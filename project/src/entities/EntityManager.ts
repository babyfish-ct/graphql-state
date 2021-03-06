import { EntityChangeEvent } from "..";
import { AbstractDataService } from "../data/AbstractDataService";
import { MergedDataService } from "../data/MergedDataService";
import { RemoteDataService } from "../data/RemoteDataService";
import { FieldMetadata } from "../meta/impl/FieldMetadata";
import { SchemaMetadata } from "../meta/impl/SchemaMetadata";
import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { VariableArgs } from "../state/impl/Args";
import { StateManagerImpl } from "../state/impl/StateManagerImpl";
import { compare } from "../state/impl/util";
import { GraphFieldMetadata, GraphSnapshot, GraphType, GraphTypeMetadata, postGraphStateMessage } from "../state/Monitor";
import { ReleasePolicy } from "../state/Types";
import { EntityEvictEvent } from "./EntityEvent";
import { ModificationContext } from "./ModificationContext";
import { PaginationQueryResult } from "./PaginationQueryResult";
import { Pagination, QueryArgs } from "./QueryArgs";
import { QueryResult } from "./QueryResult";
import { QUERY_OBJECT_ID, Record } from "./Record";
import { RecordManager } from "./RecordManager";
import { RecordRef } from "./RecordRef";
import { RuntimeShape } from "./RuntimeShape";

export class EntityManager {

    readonly dataService: AbstractDataService;

    private _recordManagerMap = new Map<string, RecordManager>();

    private _queryResultMap = new Map<string, QueryResult>();

    private _evictListenerMap = new Map<string | undefined, Set<(e: EntityEvictEvent) => any>>();

    private _changeListenerMap = new Map<string | undefined, Set<(e: EntityChangeEvent) => any>>();

    private _ctx?: ModificationContext;

    private _bidirectionalAssociationManagementSuspending = false;

    private _gcTimerId?: NodeJS.Timeout;

    private _modificationVersion = 0;
    
    constructor(
        readonly stateManager: StateManagerImpl<any>,
        readonly schema: SchemaMetadata
    ) {
        this.dataService = new MergedDataService(new RemoteDataService(this));
        const queryType = schema.typeMap.get("Query");
        if (queryType !== undefined) {
            this.saveId("Query", QUERY_OBJECT_ID);
        }
    }

    recordManager(typeName: string): RecordManager {
        const type = this.schema.typeMap.get(typeName); 
        if (type === undefined) {
            throw new Error(`Illegal type "${typeName}" that is not exists in schema`);
        }
        let recordManager = this._recordManagerMap.get(typeName);
        if (recordManager === undefined) {
            recordManager = new RecordManager(this, type);
            this._recordManagerMap.set(typeName, recordManager);
            recordManager.initializeOtherManagers();
        }
        return recordManager;
    }

    findRefById(typeName: string, id: any): RecordRef | undefined {
        return this.recordManager(typeName).findRefById(id);
    }

    get modificationContext(): ModificationContext {
        const ctx = this._ctx;
        if (ctx === undefined) {
            throw new Error(`No modificaton context`);
        }
        return ctx;
    }

    get modificationVersion(): number {
        return this._modificationVersion;
    }

    modify<T>(action: () => T, forGC: boolean = false): T {
        if (this._ctx !== undefined) {
            if (forGC) {
                throw new Error("Internal bug: cannot mdoify for GC under exsitsing modification context");
            }
            return action();
        } else {
            this._ctx = new ModificationContext(
                () => { ++this._modificationVersion },
                this.publishEvictChangeEvent.bind(this),
                this.publishEntityChangeEvent.bind(this),
                this.stateManager.id,
                forGC
            );
            try {
                return action();
            } finally {
                try {
                    this._ctx.close();
                } finally {
                    this._ctx = undefined;
                }
            }
        }
    }

    save(
        shape: RuntimeShape,
        objOrArray: object | readonly object[],
        pagination?: Pagination
    ): void {
        this.modify(() => {
            this.save0(shape, objOrArray, false, pagination);
            this.save0(shape, objOrArray, true, pagination);
        });
    }

    private save0(
        shape: RuntimeShape,
        objOrArray: object | readonly object[],
        forAssociation: boolean,
        pagination?: Pagination
    ): void {
        if (pagination !== undefined && shape.typeName !== 'Query') {
            throw new Error(`The save method cannot accept pagination when the type name of shape is not "Query"`);
        }
        if (shape.typeName === "Mutation") {
            throw new Error(`save() does not accept object whose type is 'Mutation'`);
        }
        this.visit(shape, objOrArray, (id, runtimeType, field, args, value) => {
            if (field.isAssociation === forAssociation) {
                const manager = this.recordManager(field.declaringType.name);
                manager.set(
                    id, 
                    runtimeType,
                    field, 
                    args,
                    value,
                    runtimeType.name === 'Query' ? pagination : undefined
                );
            }
        });
    }

    delete(
        typeName: string, 
        idOrArray: any
    ): void {
        if (typeName === 'Query') {
            throw new Error(`The typeof deleted object cannot be the special type 'Query'`);
        }
        this.modify(() => {
            const recordManager = this.recordManager(typeName);
            if (Array.isArray(idOrArray)) {
                for (const id of idOrArray) {
                    if (id !== undefined && id !== null) {
                        recordManager.delete(id);
                    }
                }
            } else if (idOrArray !== undefined && idOrArray !== null) {
                recordManager.delete(idOrArray);
            }
        });
    }

    evict(
        typeName: string,
        idOrArray: any,
        fieldKeyOrArray?: any
    ): void {
        this.modify(() => {
            if (typeName === "Query") {
                evictHelper(this.recordManager("Query"), QUERY_OBJECT_ID, fieldKeyOrArray);
            } else {
                const recordManager = this.recordManager(typeName);
                if (Array.isArray(idOrArray)) {
                    for (const id of idOrArray) {
                        if (id !== undefined && id !== null) {
                            evictHelper(recordManager, id, fieldKeyOrArray);
                        }
                    }
                } else if (idOrArray !== undefined && idOrArray !== null) {
                    evictHelper(recordManager, idOrArray, fieldKeyOrArray);
                }
            }
        });
    }

    saveId(typeName: string, id: any): Record {
        return this.modify(() => {
            const type = this.schema.typeMap.get(typeName);
            if (type === undefined) {
                throw new Error(`Cannot save object id for illegal type "${typeName}"`);
            }
            if (typeName === "Mutation") {
                throw new Error(`saveId() does not accept object whose type is 'Mutation'`);
            }
            return this.recordManager(typeName).saveId(id, type);
        });
    }

    retain(args: QueryArgs): QueryResult {
        
        let result = this._queryResultMap.get(args.key);
        if (result === undefined) {
            if (!this.schema.isAcceptable(args.fetcher.fetchableType)) {
                throw new Error("Cannot accept that fetcher because it is not configured in the state manager");
            }
            if (args.pagination !== undefined) {
                result = new PaginationQueryResult(this, args, () => {
                    this._queryResultMap.delete(args.key);
                    this.gc();
                });
            } else {
                result = new QueryResult(this, args, () => { 
                    this._queryResultMap.delete(args.key); 
                    this.gc();
                });
            }
            this._queryResultMap.set(args.key, result);
        }
        return result.retain();
    }

    release(args: QueryArgs, releasePolicy?: ReleasePolicy<any>) {
        const result = this._queryResultMap.get(args.key);
        result?.release(releasePolicy);
    }

    addEvictListener(typeName: string | undefined, listener: (e: EntityEvictEvent) => void): void {
        if (listener !== undefined && listener !== null) {
            let set = this._evictListenerMap.get(typeName);
            if (set === undefined) {
                set = new Set<(e: EntityEvictEvent) => void>();
                this._evictListenerMap.set(typeName, set);
            } 
            if (set.has(listener)) {
                throw new Error(`Cannot add exists listener`);
            }
            set.add(listener);
        }
    }

    removeEvictListener(typeName: string | undefined, listener: (e: EntityEvictEvent) => void): void {
        this._evictListenerMap.get(typeName)?.delete(listener);
    }

    private publishEvictChangeEvent(e: EntityEvictEvent) {
        postGraphStateMessage(this.stateManager.id, e);
        this.refreshByEvictEvent(e);
        for (const [, set] of this._evictListenerMap) {
            for (const listener of set) {
                listener(e);
            }
        }
    }

    addChangeListener(typeName: string | undefined, listener: (e: EntityChangeEvent) => void): void {
        if (listener !== undefined && listener !== null) {
            let set = this._changeListenerMap.get(typeName);
            if (set === undefined) {
                set = new Set<(e: EntityChangeEvent) => void>();
                this._changeListenerMap.set(typeName, set);
            } 
            if (set.has(listener)) {
                throw new Error(`Cannot add exists listener`);
            }
            set.add(listener);
        }
    }

    removeChangeListener(typeName: string | undefined, listener: (e: EntityChangeEvent) => void): void {
        this._changeListenerMap.get(typeName)?.delete(listener);
    }

    private publishEntityChangeEvent(e: EntityChangeEvent) {
        postGraphStateMessage(this.stateManager.id, e);
        this.refreshByChangeEvent(e);
        for (const [, set] of this._changeListenerMap) {
            for (const listener of set) {
                listener(e);
            }
        }
    }

    private refreshByEvictEvent(e: EntityEvictEvent) {
        this.recordManager(e.typeName).findRefById(e.id)?.value?.refreshBackReferencesByEvictEvent(this, e);
    }

    private refreshByChangeEvent(e: EntityChangeEvent) {
        for (let type = this.schema.typeMap.get(e.typeName); type !== undefined; type = type.superType) {
            for (const field of type.backRefFields) {
                this.recordManager(field.declaringType.name).refresh(field, e);
            }
        }
    }

    forEach(typeName: string, visitor: (record: Record) => boolean | void) {
        this.recordManager(typeName).forEach(visitor);
    }

    get isBidirectionalAssociationManagementSuspending(): boolean {
        return this._bidirectionalAssociationManagementSuspending;
    }

    suspendBidirectionalAssociationManagement<T>(action: () => T): T {
        if (this._bidirectionalAssociationManagementSuspending) {
            return action();
        }
        this._bidirectionalAssociationManagementSuspending = true;
        try {
            return action();
        } finally {
            this._bidirectionalAssociationManagementSuspending = false;
        }
    }

    gc() {
        if (this._gcTimerId === undefined) {
            this._gcTimerId = setTimeout(() => {
                this._gcTimerId = undefined;
                this.onGC();
            }, 0);
        }
    }

    private onGC() {
        for (const result of this._queryResultMap.values()) {
            result.gcVisit();
        }
        const garbages: Garbage[] = [];
        for (const rm of this._recordManagerMap.values()) {
            rm.collectGarbages(garbages);
        }
        if (garbages.length !== 0) {
            this.modify(() => {
                for (const garbage of garbages) {
                    if (garbage instanceof Record) {
                        this.evict(garbage.runtimeType.name, garbage.id);
                    } else {
                        garbage.record.evict(this, garbage.field, garbage.args);
                    }
                }
            }, true);
        }
    }

    visit(
        shape: RuntimeShape,
        objOrArray: object | readonly object[],
        visitor: EntityFieldVisitor
    ): void {
        const type = this.schema.typeMap.get(shape.typeName);
        if (type === undefined) {
            throw new Error(`Illegal type name "${shape.typeName}" of shape`);
        }
        if (Array.isArray(objOrArray)) {
            for (const obj of objOrArray) {
                this.visitObj(shape, obj, type, visitor);
            }
        } else if (objOrArray !== undefined && objOrArray !== null) {
            this.visitObj(shape, objOrArray, type, visitor);
        }
    }

    private visitObj(
        shape: RuntimeShape, 
        obj: any, 
        type: TypeMetadata,
        visitor: EntityFieldVisitor
    ) {
        const runtimeTypeName = obj["__typename"] ?? type.name;
        const runtimeType = runtimeTypeName === type.name ? type : this.schema.typeMap.get(runtimeTypeName);
        if (runtimeType === undefined) {
            throw new Error(`Illegal typed name "${runtimeTypeName}" of obj["__typename"]`);
        }
        if (!type.isAssignableFrom(runtimeType)) {
            throw new Error(
                `Cannot visit obj with illegal type "${runtimeType.name}" because that type is not derived type of "${type.name}"`);
        }
        if (typeof obj !== "object" || Array.isArray(obj)) {
            throw new Error("Cannot visit data that is not plain object");
        }
        let idFieldName: string | undefined;
        let id: any;
        if (shape.typeName === 'Query') {
            idFieldName = undefined;
            id = QUERY_OBJECT_ID;
        } else {
            idFieldName = type.idField.name;
            const idShapeField = shape.fieldMap.get(idFieldName);
            if (idShapeField === undefined) {
                throw new Error(`Cannot visit the object whose type is "${shape.typeName}" without id`);
            }
            id = obj[idShapeField.alias ?? idShapeField.name];
            if (id === undefined || id === null) {
                throw new Error(`Cannot visit the object whose type is "${shape.typeName}" without id`);
            }
        }
        for (const [, shapeField] of shape.fieldMap) { 
            if (shapeField.name !== idFieldName) {
                const field = runtimeType.fieldMap.get(shapeField.name);
                if (field === undefined) {
                    throw new Error(`Cannot visit the non-existing field "${shapeField.name}" for type "${type.name}"`);
                }
                let value = obj[shapeField.alias ?? shapeField.name];
                if (value === null) {
                    value = undefined;
                }
                if (visitor(
                    id, 
                    runtimeType,
                    field, 
                    shapeField.args,
                    value) === false
                ) {
                    return;
                }
                if (value !== undefined && field.isAssociation && shapeField.childShape !== undefined) {
                    switch (field.category) {
                        case "REFERENCE":
                            this.visit(shapeField.childShape, value, visitor);
                            break;
                        case "LIST":
                            if (Array.isArray(value)) {
                                for (const element of value) {
                                    this.visit(shapeField.childShape, element, visitor);
                                }
                            }
                            break;
                        case "CONNECTION":
                            const edges = value.edges;
                            if (Array.isArray(edges)) {
                                for (const edge of edges) {
                                    this.visit(shapeField.nodeShape!, edge.node, visitor);
                                }
                            }
                            break;
                    }
                }
            }
        }
    }

    monitor(): GraphSnapshot {
        const typeMetadataMap: { [key: string]: GraphTypeMetadata } = {};
        for (const type of this.schema.typeMap.values()) {
            const declaredFieldMap: { [key: string]: GraphFieldMetadata } = {};
            for (const field of type.declaredFieldMap.values()) {
                if (field.category !== "ID") {
                    declaredFieldMap[field.name] = {
                        name: field.name,
                        isParamerized: field.isParameterized,
                        isConnection: field.connectionType !== undefined,
                        targetTypeName: field.targetType?.name
                    };
                }
            }
            typeMetadataMap[type.name] = {
                name: type.name,
                superTypeName: type.superType?.name,
                idFieldName: type.category === "OBJECT" ? type.idField.name : undefined,
                declaredFieldMap
            };
        }
        const queryRecord = this
            ._recordManagerMap.get("Query")
            ?.findRefById(QUERY_OBJECT_ID)
            ?.value;
        const types = Array
            .from(this._recordManagerMap.values())
            .filter(rm => rm.type.name !== "Query")
            .map(rm => rm.monitor())
            .filter(t => t !== undefined) as Array<GraphType>;
        ;
        types.sort((a, b) => compare(a, b, "name"));
        const snapshot: GraphSnapshot = {
            typeMetadataMap,
            query: queryRecord?.monitor(),
            types
        };
        return snapshot;
    }
}

export type EntityFieldVisitor = (
    id: any, 
    runtimeType: TypeMetadata,
    field: FieldMetadata, 
    args: VariableArgs | undefined,
    value: any
) => void | boolean;

export type Garbage = Record | FieldGarbage;

interface FieldGarbage {
    readonly record: Record;
    readonly field: FieldMetadata;
    readonly args: VariableArgs | undefined;
}

function evictHelper(recordManager: RecordManager, id: any, fieldKeyOrArray?: any) {
    if (fieldKeyOrArray === undefined) {
        recordManager.evict(id);
    } else if (Array.isArray(fieldKeyOrArray)) {
        for (const fieldKey of fieldKeyOrArray) {
            if (fieldKey !== undefined && fieldKey !== null) {
                recordManager.evict(id, fieldKey);
            }
        }
    } else if (fieldKeyOrArray !== undefined && fieldKeyOrArray !== null) {
        recordManager.evict(id, fieldKeyOrArray);
    }
}