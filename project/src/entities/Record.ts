import { TextWriter } from "graphql-ts-client-api";
import { EntityChangeEvent, EntityEvictEvent } from "..";
import { FlatRow } from "../meta/Configuration";
import { FieldMetadata } from "../meta/impl/FieldMetadata";
import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { VariableArgs } from "../state/impl/Args";
import { SpaceSavingMap } from "../state/impl/SpaceSavingMap";
import { compare } from "../state/impl/util";
import { GraphField, GraphObject, ParameterizedValue, EvictReasonType } from "../state/Monitor";
import { Association } from "./assocaition/Association";
import { RecordConnection } from "./assocaition/AssociationConnectionValue";
import { BackReferences } from "./assocaition/BackReferences";
import { EntityManager, Garbage } from "./EntityManager";
import { Pagination } from "./QueryArgs";

export class Record {

    private scalarMap = new Map<string, any>();
    
    private associationMap = new SpaceSavingMap<FieldMetadata, Association>();

    readonly backReferences = new BackReferences();

    private row?: FlatRow<any>;

    private gcVisited = false;

    private derivedRecord?: Record;

    constructor(
        readonly superRecord: Record | undefined,
        readonly staticType: TypeMetadata,
        readonly runtimeType: TypeMetadata, 
        readonly id: any, 
        private deleted: boolean = false
    ) {
        if (superRecord !== undefined) {
            if (superRecord.derivedRecord !== undefined) {
                throw new Error(
                    `Internal bug: Both "${
                        staticType.name
                    }" and "${
                        superRecord.derivedRecord.staticType.name
                    }" extends "${
                        superRecord.staticType.name
                    }"`
                );
            }
            superRecord.derivedRecord = this;
        }
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
        return fieldName === "__typename" ? true : this.scalarMap.has(VariableArgs.fieldKey(fieldName, args));
    }

    getSalar(fieldName: string, args?: VariableArgs): any {
        if (fieldName === "__typename") {
            return this.runtimeType.name;
        }
        return this.scalarMap.get(VariableArgs.fieldKey(fieldName, args));
    }

    hasAssociation(field: FieldMetadata | string, args?: VariableArgs): boolean {
        const fieldMetadata = typeof field === "string" ? this.runtimeType.fieldMap.get(field) : field;
        if (fieldMetadata === undefined) {
            return false;
        }
        return this.associationMap.get(fieldMetadata)?.has(args) === true;
    }

    getAssociation(
        field: FieldMetadata | string, 
        args?: VariableArgs
    ): Record | ReadonlyArray<Record | undefined> | RecordConnection | undefined {
        const fieldMetadata = typeof field === "string" ? this.runtimeType.fieldMap.get(field) : field;
        if (fieldMetadata === undefined) {
            throw new Error(`Illegal asscoaition field: "${field}"`);
        }
        return this.associationMap.get(fieldMetadata)?.get(args);
    }

    set(
        entityManager: EntityManager, 
        field: FieldMetadata,
        args: VariableArgs | undefined,
        value: any,
        pagination?: Pagination
    ) {
        if (field.declaringType !== this.staticType) {
            throw new Error(`'${field.fullName}' is not field of the type '${this.staticType.name}' of current record`);
        }
        if (field.isAssociation) {
            if (field.category === "REFERENCE" && args?.variables !== undefined && this.runtimeType.name !== "Query") {
                throw new Error('reference fields of entity object does not support variables');
            }
            this
            .associationMap
            .computeIfAbsent(field, f => new Association(this, f))
            .set(
                entityManager,
                args,
                value,
                pagination
            );
        } else {
            if (args?.variables !== undefined && this.runtimeType.name !== "Query") {
                throw new Error('scalar fields of entity object does not support variables');
            }
            if (field.name === "__typename") {
                if (value !== this.runtimeType.name) {
                    throw new Error(`Illegal new value value "${value}" for "__typename", the runtime type of current record is "${this.runtimeType.name}"`);
                }
                return;
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

    anyValueContains(
        field: FieldMetadata,
        target: Record
    ): boolean | undefined {
        return this.associationMap.get(field)?.anyValueContains(target);
    }

    evict(
        entityManager: EntityManager, 
        field: FieldMetadata,
        args: VariableArgs | undefined,
        includeMoreStrictArgs: boolean = false,
        evictReason?: EvictReasonType
    ) {
        if (field.declaringType !== this.staticType) {
            throw new Error(`'${field.fullName}' is not field of the type '${this.staticType.name}' of current record`);
        }
        if (field.isAssociation) {
            this.associationMap.get(field)?.evict(entityManager, args, includeMoreStrictArgs, evictReason);
        } else {
            entityManager.modificationContext.unset(this, field.name, args, evictReason);
            this.scalarMap.delete(VariableArgs.fieldKey(field.name, args));
        }
    }

    delete(entityManager: EntityManager) {
        if (this.staticType.name === 'Query') {
            throw new Error(`The object of special type 'Query' cannot be deleted`);
        }
        if (this.deleted) {
            return;
        }
        for (let record: Record | undefined = this.derivedRecord; record !== undefined; record = record.derivedRecord) {
            record.delete(entityManager);
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
        for (let record: Record | undefined = this.superRecord; record !== undefined; record = record.superRecord) {
            record.delete(entityManager);
        }
    }

    undelete(): boolean {
        if (this.deleted) {
            this.deleted = false;
            return true;
        }
        return false;
    }

    toRow(): FlatRow<any> {
        let row = this.row;
        if (row === undefined) {
            this.row = row = new FlatRowImpl(this);
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
        this.associationMap.clear();
    }

    refreshBackReferencesByEvictEvent(entityManager: EntityManager, event: EntityEvictEvent) {
        this.backReferences.forEach((field, _, backReferenceRecord) => {
            // Duplicated invacaion, but not problem
            // because Asscoaiton.refresh can ignore duplicated invocations
            // by comparing EntityManager.modificationVersion
            backReferenceRecord.associationMap.get(field)?.refresh(entityManager, event);
        });
    }

    refreshByChangeEvent(entityManager: EntityManager, field: FieldMetadata, e: EntityChangeEvent) {
        this.associationMap.get(field)?.refresh(entityManager, e);
    }

    gcVisit(field: FieldMetadata, args: VariableArgs | undefined) {
        this.gcVisited = true;
        for (let record: Record | undefined = this.superRecord; record !== undefined; record = record.superRecord) {
            record.gcVisited = true;
        }
        for (let record: Record | undefined = this.derivedRecord; record !== undefined; record = record.derivedRecord) {
            record.gcVisited = true;
        }
        if (field.isAssociation) {
            this.associationMap.get(field)?.gcVisit(args);
        }
    }

    collectGarbages(output: Garbage[]) {
        if (this.gcVisited) {
            this.gcVisited = false;
        } else {
            output.push(this);
            return;
        }
        this.associationMap.forEachValue(association => {
            association.collectGarbages(output);
        }) 
    }

    toString(): string {
        const writer = new TextWriter();
        writer.scope({"type": "BLOCK", multiLines: true}, () => {
            writer.seperator();
            writer.text(`"__typeame": ${this.runtimeType.name}`); 
            writer.seperator();
            writer.text(`"id": ${this.id}`);
            this.writeTo(writer);
        });
        return writer.toString();
    }

    private writeTo(writer: TextWriter) {
        this.superRecord?.writeTo(writer);
        for (const [key, value] of this.scalarMap) {
            writer.seperator();
            writer.text(`"${key}"": ${JSON.stringify(value)}`);
        }
        this.associationMap.forEachValue(association => {
            association.writeTo(writer);
        });
    }

    monitor(): GraphObject {
        const fields: GraphField[] = [];
        const parameterizedScalarMap = new Map<string, Map<string, any>>();
        for (const [k, v] of this.scalarMap) {
            const colonIndex = k.indexOf(":");
            if (colonIndex !== -1) {
                const name = k.substring(0, colonIndex);
                const parameter = k.substring(colonIndex + 1);
                let subMap = parameterizedScalarMap.get(name);
                if (subMap === undefined) {
                    subMap = new Map<string, any>();
                    parameterizedScalarMap.set(name, subMap);
                }
                subMap.set(parameter, v);
            }
        }
        for (const [k, v] of this.scalarMap) {
            const colonIndex = k.indexOf(":");
            if (colonIndex === -1) {
                fields.push({
                    name: k,
                    value: v
                });
            }
        }
        for (const [k, subMap] of parameterizedScalarMap) {
            const arr: ParameterizedValue[] = [];
            for (const [parameter, value] of subMap) {
                arr.push({parameter, value});
            }
            arr.sort((a, b) => compare(a, b, "parameter"));
            fields.push({
                name: k,
                parameterizedValues: arr
            });
        }
        this.associationMap.forEachValue(association => {
            fields.push(association.monitor());
        });
        fields.sort((a, b) => compare(a, b, "name"));
        const obj: GraphObject = {
            id: this.id,
            runtimeTypeName: this.runtimeType.name,
            fields
        };
        return obj;
    }
}

export const QUERY_OBJECT_ID = "____QUERY_OBJECT____";

export function objectWithOnlyId(record: Record | undefined): any {
    if (record === undefined) {
        return undefined;
    }
    return record.staticType.createObject(record.id);
}

export class FlatRowImpl implements FlatRow<any> {
    
    constructor(private record: Record) {}

    has(fieldName: string): boolean {
        return this.record.hasScalar(fieldName) || this.record.hasAssociation(fieldName, undefined);
    }

    get(fieldName: string): any {
        if (this.record.hasScalar(fieldName)) {
            return this.record.getSalar(fieldName);
        }
        if (this.record.hasAssociation(fieldName, undefined)) {
            return this.record.getAssociation(fieldName, undefined);
        }
        throw new Error(`The field '${fieldName}' is not cached in the scalar row`);
    }

    toString(): string {
        return this.record.toString();
    }
}
