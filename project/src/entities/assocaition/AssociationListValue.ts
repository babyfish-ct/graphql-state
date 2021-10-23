import { PositionType, ScalarRow } from "../../meta/Configuration";
import { EntityManager } from "../EntityManager";
import { objectWithOnlyId, Record } from "../Record";
import { AssociationValue } from "./AssocaitionValue";
import { toRecordMap } from "./util";

export class AssociationListValue extends AssociationValue {

    private elements?: Array<Record>;

    private indexMap?: Map<any, number>;

    getAsObject(): ReadonlyArray<any> {
        return this.elements?.map(objectWithOnlyId) ?? [];
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

        const oldIndexMap = this.indexMap;
        const association = this.association;
        const newIndexMap = new Map<any, number>();
        const newElements: Array<Record> = [];
        if (Array.isArray(value)) {
            const idFieldName = association.field.targetType!.idField.name;
            const position = association.field.associationProperties!.position;
            for (let i = 0; i < value.length; i++) {
                const item = value[i];
                if (item === undefined || item === null) {
                    throw new Error(`Cannot add undfined/null element into ${association.field.fullName}`);
                }
                const newElement = entityManager.saveId(association.field.targetType!.name, item[idFieldName]);
                if (!newIndexMap.has(newElement.id)) {
                    newElements.push(newElement);
                    newIndexMap.set(newElement.id, i);
                }
            }
        }

        if (this.elements !== undefined) {
            for (const oldElement of this.elements) {
                if (!newIndexMap.has(oldElement.id)) {
                    this.releaseOldReference(entityManager, oldElement);
                }
            }
        }

        this.elements = newElements;
        this.indexMap = newIndexMap.size !== 0 ? newIndexMap : undefined;

        for (const newElement of newElements) {
            if (oldIndexMap?.has(newElement.id) !== true) {
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
        targets: ReadonlyArray<Record>
    ) {
        const elements = this.elements !== undefined ? [...this.elements] : [];
        const indexMap = this.indexMap;
        const linkMap = toRecordMap(targets);
        const position = this.association.field.associationProperties!.position;
        for (const record of linkMap.values()) {
            if (indexMap?.has(record.id) !== true) {
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
        targets: ReadonlyArray<Record>
    ) {
        const elements = this.elements !== undefined ? [...this.elements] : [];
        const indexMap = this.indexMap;
        const unlinkMap = toRecordMap(targets);
        for (const record of unlinkMap.values()) {
            const index = indexMap?.get(record.id);
            if (index !== undefined) {
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
        return this.indexMap?.has(target.id) === true;
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
        newList: ReadonlyArray<any>
    ): boolean {
        if (this.elements === undefined || this.elements.length !== newList.length) {
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
