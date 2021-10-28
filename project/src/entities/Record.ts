import { ScalarRow } from "../meta/Configuration";
import { FieldMetadata } from "../meta/impl/FieldMetadata";
import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { VariableArgs } from "../state/impl/Args";
import { SpaceSavingMap } from "../state/impl/SpaceSavingMap";
import { Association } from "./assocaition/Association";
import { RecordConnection } from "./assocaition/AssociationConnectionValue";
import { BackReferences } from "./BackReferences";
import { EntityManager } from "./EntityManager";

export class Record {

    private scalarMap = new Map<string, any>();
    
    private associationMap = new SpaceSavingMap<FieldMetadata, Association>();

    readonly backReferences = new BackReferences();

    private row?: ScalarRow<any>;

    constructor(
        readonly staticType: TypeMetadata,
        readonly runtimeType: TypeMetadata, 
        readonly id: any, 
        private deleted: boolean = false
    ) {
        if (staticType.name === 'Mutation') {
            throw new Error(`Cannot create record for type 'Mutation'`);
        }
        if (staticType.name === 'Query') {
            if (id !== QUERY_OBJECT_ID) {
                throw new Error(`The id of query object must be '${QUERY_OBJECT_ID}'`);
            }
            if (deleted) {
                throw new Error(`The object of special type 'Query' cannot be deleted`);
            }
        }
    }

    get isDeleted(): boolean {
        return this.deleted;
    }

    hasScalar(fieldName: string, args?: VariableArgs): boolean {
        return this.scalarMap.has(VariableArgs.fieldKey(fieldName, args));
    }

    getSalar(fieldName: string, args?: VariableArgs): any {
        return this.scalarMap.get(VariableArgs.fieldKey(fieldName, args));
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
        if (field.declaringType !== this.staticType) {
            throw new Error(`'${field.fullName}' is not field of the type '${this.staticType.name}' of current record`);
        }
        if (field?.isAssociation) {
            if (field.category === "REFERENCE" && args?.variables !== undefined && this.runtimeType.name !== "Query") {
                throw new Error('reference fields of entity object does not support variables');
            }
            this
            .associationMap
            .computeIfAbsent(field, f => new Association(this, f))
            .set(
                entityManager,
                args,
                value
            );
        } else {
            if (args?.variables !== undefined && this.runtimeType.name !== "Query") {
                throw new Error('scalar fields of entity object does not support variables');
            }
            const fieldKey = VariableArgs.fieldKey(field.name, args);
            if (field === this.staticType.idField) {
                if (value !== this.id) {
                    throw new Error(`Cannot chanage "${this.staticType.idField.fullName} because its id field"`);
                }
            } else {
                const oldValue = this.scalarMap.get(fieldKey);
                if (oldValue !== value) {
                    this.scalarMap.set(fieldKey, value);
                    entityManager.modificationContext.set(this, fieldKey, args, oldValue, value);
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
            record,
            undefined
        );
    }

    unlink(
        entityManager: EntityManager,
        associationField: FieldMetadata,
        record: Record
    ) {
        this.associationMap.get(associationField)?.unlink(
            entityManager,
            record,
            undefined
        );
    }

    contains(
        field: FieldMetadata, 
        args: VariableArgs | undefined, 
        target: Record, 
        tryMoreStrictArgs: boolean
    ): boolean {
        return this.associationMap.get(field)?.contains(args, target, tryMoreStrictArgs) === true;
    }

    evict(
        entityManager: EntityManager, 
        field: FieldMetadata,
        args: VariableArgs | undefined,
        includeMoreStrictArgs: boolean = false
    ) {
        if (field.declaringType !== this.staticType) {
            throw new Error(`'${field.fullName}' is not field of the type '${this.staticType.name}' of current record`);
        }
        if (field.isAssociation) {
            this.associationMap.get(field)?.evict(entityManager, args, includeMoreStrictArgs);
        } else {
            entityManager.modificationContext.unset(this, field.name, undefined);
            this.scalarMap.delete(field.name);
        }
    }

    delete(entityManager: EntityManager) {
        if (this.deleted) {
            return;
        }
        if (this.staticType.name === 'Query') {
            throw new Error(`The object of special type 'Query' cannot be deleted`);
        }
        this.scalarMap.clear();
        this.disposeAssocaitions(entityManager);
        this.backReferences.forEach((field, _, record) => {
            record.associationMap.get(field)?.unlinkAll(
                entityManager,
                this
            );
        });
        this.deleted = true;
    }

    undelete(): boolean {
        if (this.deleted) {
            this.deleted = false;
            return true;
        }
        return false;
    }

    toRow(): ScalarRow<any> {
        let row = this.row;
        if (row === undefined) {
            this.row = row = new ScalarRowImpl(this.scalarMap);
        }
        return row;
    }

    createMap(): Map<string, any> {
        const map = new Map<string, any>();
        for (const [name, value] of this.scalarMap) {
            map.set(name, value);
        }
        this.associationMap.forEachValue(association => {
            association.appendTo(map);
        });
        return map;
    }

    dispose(entityManager: EntityManager) {
        this.disposeAssocaitions(entityManager);
        // Add other behaviors in future
    }

    private disposeAssocaitions(entityManager: EntityManager) {
        this.associationMap.forEachValue(assocaition => { 
            assocaition.dispose(entityManager); 
        });
        this.associationMap.clear();
    }
}

export const QUERY_OBJECT_ID = "____QUERY_OBJECT____";

export function objectWithOnlyId(record: Record | undefined): any {
    if (record === undefined) {
        return undefined;
    }
    return record.staticType.createObject(record.id);
}

export class ScalarRowImpl implements ScalarRow<any> {
    
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

    toString(): string {
        let sperator = "";
        let result = "{ ";
        for (const [k, v] of this.map) {
            if (v !== undefined) {
                result += sperator;
                result += k;
                result += ": ";
                result += JSON.stringify(v)
                sperator = ", ";
            }
        }
        result += " }";
        return result;
    }
}