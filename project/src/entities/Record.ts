import { ScalarRow } from "../meta/Configuration";
import { FieldMetadata } from "../meta/impl/FieldMetadata";
import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { SpaceSavingMap } from "../state/impl/SpaceSavingMap";
import { Association } from "./assocaition/Association";
import { RecordConnection } from "./assocaition/AssociationConnectionValue";
import { BackReferences } from "./BackReferences";
import { EntityManager } from "./EntityManager";
import { VariableArgs } from "./VariableArgs";

export class Record {

    private scalarMap = new Map<string, any>();
    
    private associationMap = new SpaceSavingMap<FieldMetadata, Association>();

    readonly backReferences = new BackReferences();

    private row?: ScalarRow<any>;

    constructor(readonly type: TypeMetadata, readonly id: any, private deleted: boolean = false) {
        if (type.name === 'Query') {
            if (id !== QUERY_OBJECT_ID) {
                throw new Error(`The id of query object must be '${QUERY_OBJECT_ID}'`);
            }
            if (deleted) {
                throw new Error(`The object of special type 'Query' cannot be deleted`);
            }
        } else if (type.name === 'Mutation') {
            if (id !== MUATION_OBJECT_ID) {
                throw new Error(`The id of mutation object must be '${QUERY_OBJECT_ID}'`);
            }
            if (deleted) {
                throw new Error(`The object of special type 'Mutation' cannot be deleted`);
            }
        }
    }

    get isDeleted(): boolean {
        return this.deleted;
    }

    hasScalar(fieldName: string): boolean {
        return this.scalarMap.has(fieldName);
    }

    getSalar(fieldName: string): any {
        return this.scalarMap.get(fieldName);
    }

    hasAssociation(field: FieldMetadata, args?: VariableArgs): boolean {
        return this.associationMap.get(field)?.has(args) === true;
    }

    getAssociation(field: FieldMetadata, args?: VariableArgs): Record | ReadonlyArray<Record | undefined> | RecordConnection | undefined {
        return this.associationMap.get(field)?.get(args);
    }

    set(
        entityManager: EntityManager, 
        field: FieldMetadata,
        args: VariableArgs | undefined,
        value: any
    ) {
        if (field?.isAssociation) {
            this
            .associationMap
            .computeIfAbsent(field, f => new Association(f))
            .set(
                entityManager,
                this,
                args,
                value
            );
        } else {
            if (args?.variables !== undefined) {
                throw new Error('scalar fields does not support variables');
            }
            if (field === this.type.idField) {
                if (value !== this.id) {
                    throw new Error(`Cannot chanage "${this.type.idField.fullName} because its id field"`);
                }
            } else {
                const oldValue = this.scalarMap.get(field.name);
                if (oldValue !== value) {
                    this.scalarMap.set(field.name, value);
                    entityManager.modificationContext.set(this, field.name, args?.key, oldValue, value);
                }
            }
        }
    }

    link(
        entityManager: EntityManager,
        associationField: FieldMetadata,
        record: Record
    ) {
        this.associationMap.get(associationField)?.link(
            entityManager,
            this,
            record,
            undefined,
            true
        );
    }

    unlink(
        entityManager: EntityManager,
        associationField: FieldMetadata,
        record: Record
    ) {
        this.associationMap.get(associationField)?.unlink(
            entityManager,
            this,
            record,
            undefined,
            true
        );
    }

    delete(entityManager: EntityManager) {
        if (this.deleted) {
            return;
        }
        if (this.type.name === 'Query') {
            throw new Error(`The object of special type 'Query' cannot be deleted`);
        }
        this.scalarMap.clear();
        this.associationMap.clear();
        this.backReferences.forEach((field, _, record) => {
            record.associationMap.get(field)?.forceUnlink(
                entityManager,
                record,
                this
            );
        });
        this.deleted = true;
    }

    undelete() {
        this.deleted = false;
    }

    toRow(): ScalarRow<any> {
        let row = this.row;
        if (row === undefined) {
            this.row = row = new ScalarRowImpl(this.scalarMap);
        }
        return row;
    }
}

export const QUERY_OBJECT_ID = "____QUERY_OBJECT____";

export const MUATION_OBJECT_ID = "____MUTATION_OBJECT____";

export function toRecordMap(arr: ReadonlyArray<Record | undefined> | undefined): Map<any, Record> {
    const map = new Map<any, Record>();
    if (arr !== undefined) {
        for (const element of arr) {
            if (element !== undefined) {
                map.set(element.id, element);
            }
        }
    }
    return map;
}

export function objectWithOnlyId(record: Record | undefined): any {
    if (record === undefined) {
        return undefined;
    }
    return { [record.type.idField.name]: record.id };
}

class ScalarRowImpl implements ScalarRow<any> {
    
    constructor(private map: Map<string, any>) {}

    has(fieldName: string): boolean {
        return this.map.has(fieldName);
    }

    get(fieldName: string): any {
        const value = this.map.get(fieldName);
        if (value === undefined && !this.map.has(fieldName)) {
            throw new Error(`The field '${fieldName}' is not cached in the scalar row`);
        }
        return value;
    }
}
