import { PositionType, ScalarRow } from "../../meta/Configuration";
import { EntityManager } from "../EntityManager";
import { objectWithOnlyId, Record } from "../Record";
import { AssociationValue } from "./AssocaitionValue";
import { toRecordMap } from "./util";

export class AssociationListValue extends AssociationValue {

    private elements?: Array<Record>;

    getAsObject(): ReadonlyArray<any> | undefined {
        return this.elements?.map(objectWithOnlyId);
    }

    get(): ReadonlyArray<Record> {
        return this.elements ?? [];
    }

    set(
        entityManager: EntityManager, 
        value: ReadonlyArray<any>
    ) {
        this.validate(value);
        if (this.valueEquals(value)) {
            return;
        }
        const oldValueForTriggger = this.getAsObject();

        const oldMap = new Map<string, Record>();
        this.elements?.map(element => {
            oldMap.set(element.id, element);
        });

        const association = this.association;
        const newIds = new Set<any>();
        const newElements: Array<Record> = [];
        if (Array.isArray(value)) {
            const idFieldName = association.field.targetType!.idField.name;
            const position = association.field.associationProperties!.position;
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
                    this.evict(entityManager);
                    return;
                }
            }
        }

        for (const [id, element] of oldMap) {
            if (!newIds.has(id)) {
                this.releaseOldReference(entityManager, element);
            }
        }

        this.elements = newElements.length === 0 ? undefined : newElements;

        for (const newElement of newElements) {
            if (!oldMap.has(newElement.id)) {
                this.retainNewReference(entityManager, newElement);
            }
        }

        entityManager.modificationContext.set(
            this.association.record, 
            association.field.name, 
            this.args, 
            oldValueForTriggger, 
            this.getAsObject()
        );
    }

    link(
        entityManager: EntityManager, 
        target: Record | ReadonlyArray<Record>
    ) {
        const elements = this.elements !== undefined ? [...this.elements] : [];
        const elementMap = toRecordMap(elements);
        const linkMap = toRecordMap(Array.isArray(target) ? target : [target]);
        const position = this.association.field.associationProperties!.position;
        for (const record of linkMap.values()) {
            if (!elementMap.has(record.id)) {
                try {
                    appendTo(elements, record, position);
                } catch (ex) {
                    if (!ex[" $evict"]) {
                        throw ex;
                    }
                    this.evict(entityManager);
                    return;
                }
            }
        }
        if (elements.length !== this.elements?.length ?? 0) {
            this.association.set(
                entityManager,
                this.args,
                elements.map(objectWithOnlyId)
            );
        }
    }

    unlink(
        entityManager: EntityManager, 
        target: Record | ReadonlyArray<Record>
    ) {
        const elements = this.elements !== undefined ? [...this.elements] : [];
        const elementMap = toRecordMap(elements);
        const unlinkMap = toRecordMap(Array.isArray(target) ? target : [target]);
        for (const record of unlinkMap.values()) {
            if (elementMap.has(record.id)) {
                const index = elements.findIndex(element => element.id === record.id);
                elements.splice(index, 1);
            }
        }
        if (elements.length !== this.elements?.length ?? 0) {
            this.association.set(
                entityManager,
                this.args,
                elements.map(objectWithOnlyId)
            );
        }
    }

    contains(target: Record): boolean {
        if (this.elements !== undefined) {
            for (const element of this.elements) {
                if (element.id === target.id) {
                    return true;
                }
            }
        }
        return false;
    }

    private validate(
        newList: ReadonlyArray<any> | undefined
    ) {
        if (newList !== undefined && newList !== null) {
            if (!Array.isArray(newList)) {
                throw new Error(`The assocaition ${this.association.field.fullName} can only accept array`);
            }
            const idFieldName = this.association.field.targetType!.idField.name;
            for (const element of newList) {
                if (element === undefined) {
                    throw new Error(`The element of the array "${this.association.field.fullName}" cannot be undefined or null`);
                }
                if (element[idFieldName] === undefined || element[idFieldName] === null) {
                    throw new Error(`The element of the array "${this.association.field.fullName}" must support id field "${idFieldName}"`);
                }
            }
        }
    }

    private valueEquals(
        newList: ReadonlyArray<any> | undefined
    ): boolean {
        if ((this.elements?.length ?? 0) !== (newList?.length ?? 0)) {
            return false;
        }
        const idFieldName = this.association.field.targetType!.idField.name;
        for (let i = (newList?.length ?? 0) - 1; i >= 0; --i) {
            const oldId = this.elements !== undefined ? 
                this.elements[i].id :
                undefined
            ;
            const newId = newList !== undefined ? 
                newList[i][idFieldName] : 
                undefined;
            if (oldId !== newId) {
                return false;
            }
        }
        return true;
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
        position(newElement.toRow(), newElements.map(e => e.toRow()), this.args?.variables);
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
