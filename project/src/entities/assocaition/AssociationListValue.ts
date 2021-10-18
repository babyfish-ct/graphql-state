import { PositionType, ScalarRow } from "../../meta/Configuration";
import { EntityManager } from "../EntityManager";
import { objectWithOnlyId, Record, toRecordMap } from "../Record";
import { AssociationValue } from "./AssocaitionValue";
import { Association } from "./Association";

export class AssociationListValue extends AssociationValue {

    private elements?: Array<Record>;

    get(): ReadonlyArray<Record | undefined> {
        return this.elements ?? [];
    }

    set(
        entityManager: EntityManager, 
        self: Record, 
        association: Association,
        value: any
    ) {
        let listChanged = (this.elements?.length ?? 0) !== (value?.length ?? 0);
        if (!listChanged) {
            const idFieldName = association.field.targetType!.idField.name;
            for (let i = (value?.length ?? 0) - 1; i >= 0; --i) {
                const oldId = this.elements !== undefined ? 
                    this.elements[i]?.id :
                    undefined
                ;
                const newId = value[i] !== undefined && value[i] !== null ?
                    value[i][idFieldName] :
                    undefined
                ;
                if (oldId !== newId) {
                    listChanged = true;
                    break;
                }
            }
        }
        const oldValueForTriggger = listChanged ? this.elements?.map(objectWithOnlyId) : undefined;

        const oldMap = toRecordMap(this.elements);

        const newIds = new Set<any>();
        const newElements: Array<Record> = [];
        if (Array.isArray(value)) {
            const idFieldName = association.field.targetType!.idField.name;
            const position = association.field.associationProperties.position;
            for (const item of value) {
                if (item === undefined || item === null) {
                    throw new Error(`Cannot add undfined/null element into ${association.field.fullName}`);
                }
                const newElement = entityManager.saveId(association.field.targetType!.name, item[idFieldName]);
                newIds.add(newElement.id);
                try {
                    appendTo(newElements, newElement, position);
                } catch (ex) {
                    if (!ex[" $evict"]) {
                        throw ex;
                    }
                    
                }
            }
        }

        for (const [id, element] of oldMap) {
            if (!newIds.has(id)) {
                this.releaseOldReference(entityManager, self, association.field, element);
            }
        }

        this.elements = newElements.length === 0 ? undefined : newElements;

        for (const newElement of newElements) {
            if (newElement !== undefined) {
                if (!oldMap.has(newElement.id)) {
                    this.retainNewReference(entityManager, self, association.field, newElement);
                }
            }
        }

        if (listChanged) {
            entityManager.modificationContext.set(
                self, 
                association.field.name, 
                this.args?.key, 
                oldValueForTriggger, 
                this.elements?.map(objectWithOnlyId)
            );
        }
    }

    link(
        entityManager: EntityManager, 
        self: Record, 
        association: Association,
        target: Record | ReadonlyArray<Record>
    ) {
        const elements = this.elements !== undefined ? [...this.elements] : [];
        const elementMap = toRecordMap(elements);
        const linkMap = toRecordMap(Array.isArray(target) ? target : [target]);
        for (const record of linkMap.values()) {
            if (!elementMap.has(record.id)) {
                elements.push(record);
            }
        }
        if (elements.length !== this.elements?.length ?? 0) {
            association.set(
                entityManager,
                self,
                this.args,
                elements.map(objectWithOnlyId)
            );
        }
    }

    unlink(
        entityManager: EntityManager, 
        self: Record, 
        association: Association,
        target: Record | ReadonlyArray<Record>
    ) {
        const elements = this.elements !== undefined ? [...this.elements] : [];
        const elementMap = toRecordMap(elements);
        const unlinkMap = toRecordMap(Array.isArray(target) ? target : [target]);
        for (const record of unlinkMap.values()) {
            if (elementMap.has(record.id)) {
                const index = elements.findIndex(element => element?.id === record.id);
                elements.splice(index, 1);
            }
        }
        if (elements.length !== this.elements?.length ?? 0) {
            association.set(
                entityManager,
                self,
                this.args,
                elements.map(objectWithOnlyId)
            );
        }
    }
}

function appendTo(
    newElements: Array<Record>, 
    newElement: Record,
    position: (
        row: ScalarRow<any>,
        rows: ReadonlyArray<ScalarRow<any>>,
        variables?: any
    ) => PositionType | undefined
) {
    const pos = newElements.length === 0 ? 
        0 : 
        position(newElement.toRow(), newElements.map(e => e.toRow()), this.args);
    if (pos === undefined) {
        throw { " $evict": true };
    }
    const index = pos === "start" ? 0 : pos === "end" ? newElements.length : pos;
    if (index >= newElements.length) {
        newElements.push(newElement);
    } else {
        newElements.splice(Math.max(0, index), 0, newElement);
    }
}