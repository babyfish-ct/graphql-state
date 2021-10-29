import { EntityChangeEvent } from "..";
import { SchemaMetadata } from "../meta/impl/SchemaMetadata";
import { VariableArgs } from "../state/impl/Args";
import { Loadable } from "../state/impl/StateValue";
import { ObjectQueryOptions, ObjectStyles, QueryMode } from "../state/StateHook";
import { EntityEvictEvent } from "./EntityEvent";
import { EntityManager } from "./EntityManager";
import { QueryArgs } from "./QueryArgs";
import { QueryService } from "./QueryService";
import { QUERY_OBJECT_ID } from "./Record";
import { RuntimeShape, RuntimeShapeField } from "./RuntimeShape";

export class QueryResult {
    
    private _refCount = 0;

    private _promise?: Promise<any>;

    private _loadable: QueryLoadable<any>;

    private _invalid = true;

    private _refetching = false;

    private _evictListener: (e: EntityEvictEvent) => void;

    private _changeListener: (e: EntityChangeEvent) => void;

    private _currentAsyncRequestId = 0;

    private _dependencies?: Dependencies;

    private _disposeTimerId?: NodeJS.Timeout = undefined;

    private _createdMillis = new Date().getTime();

    private _bindedRefetch: () => void;

    constructor(
        readonly entityManager: EntityManager,
        readonly queryArgs: QueryArgs,
        private disposer: () => void
    ) {
        this._evictListener = this.onEntityEvict.bind(this);
        this._changeListener = this.onEntityChange.bind(this);
        entityManager.addEvictListener(undefined, this._evictListener);
        entityManager.addChangeListener(undefined, this._changeListener);
        this._bindedRefetch = this._refetch.bind(this);
        this._loadable = {
            loading: true,
            refetch: this._bindedRefetch
        }
    }

    retain(): this {
        this._refCount++;
        return this;
    }

    release(maxDelayMillis: number) {
        if (--this._refCount === 0) {
            if (maxDelayMillis <= 0) {
                this.dispose();
                return;
            }
            const millis = Math.min(new Date().getTime() - this._createdMillis, maxDelayMillis)
            if (this._disposeTimerId !== undefined) {
                clearTimeout(this._disposeTimerId);
            }
            this._disposeTimerId = setTimeout(() => {
                if (this._refCount === 0) {
                    this.dispose();
                }
            }, millis);
        }
    }

    get promise(): Promise<any> {
        if (this._invalid) {
            this._invalid = false;
            this._promise = this.execute();
        }
        return this._promise!;
    }

    get loadable(): QueryLoadable<any> {
        this.promise;
        return this._loadable;
    }

    private async execute(): Promise<any> {
        try {
            return await this.query();
        } finally {
            this._refetching = false;
        }
    } 

    private async query(): Promise<any> {

        const rawResult = 
            new QueryService(this.entityManager)
            .query(this.queryArgs, !this._refetching, this.mode === "cache-and-network");

        if (rawResult.type === 'cached') {
            const data = this.validateData(rawResult.data);
            this.refreshDependencies(data);
            this._loadable = { 
                loading: false, 
                data: data, 
                refetch: this._bindedRefetch 
            };
            this.entityManager.stateManager.publishQueryResultChangeEvent({
                queryResult: this,
                changedType: "ASYNC_STATE_CHANGE"
            });
            return data;
        }

        if (!this._loadable.loading) {
            this._loadable = { loading: true, refetch: this._loadable.refetch };
            this.entityManager.stateManager.publishQueryResultChangeEvent({
                queryResult: this,
                changedType: "ASYNC_STATE_CHANGE"
            });
        }

        const asyncRequestId = ++this._currentAsyncRequestId;
        this.retain(); // Self holding during Async computing

        try {
            const data = this.validateData(await rawResult.promise);
            if (this._currentAsyncRequestId === asyncRequestId) {
                this.refreshDependencies(data);
                this._loadable = {
                    data,
                    loading: false,
                    refetch: this._bindedRefetch 
                }
            }
            return data;
        } catch (ex) {
            if (this._currentAsyncRequestId === asyncRequestId) {
                this._loadable = {
                    loading: false,
                    error: ex,
                    refetch: this._bindedRefetch 
                }
            }
            throw ex;
        } finally {
            try {
                if (this._currentAsyncRequestId === asyncRequestId) {
                    this.entityManager.stateManager.publishQueryResultChangeEvent({
                        queryResult: this,
                        changedType: "ASYNC_STATE_CHANGE"
                    });
                }
            } finally {
                this.entityManager.release(this.queryArgs); // Self holding during Async computing
            }
        }
    }

    private refreshDependencies(data: any) {
        const dependencies = new Dependencies();
        dependencies.accept(this.entityManager.schema, this.queryArgs.shape, data);
        this._dependencies = dependencies;
    }

    private onEntityEvict(e: EntityEvictEvent) {
        if (this._dependencies?.isAffectedBy(e) === true) {
            this.invalidate();
        }
    }

    private onEntityChange(e: EntityChangeEvent) {
        if (this._dependencies?.isAffectedBy(e) === true) {
            this.invalidate();
        }
    }

    private invalidate() {
        if (!this._invalid) {
            this._invalid = true;
            this.entityManager.stateManager.publishQueryResultChangeEvent({
                queryResult: this,
                changedType: "RESULT_CHANGE"
            });
        }
    }

    private dispose() {
        this.entityManager.removeEvictListener(undefined, this._evictListener);
        this.entityManager.removeChangeListener(undefined, this._changeListener);
        this.disposer();
    }

    private _refetch() {
        if (this.mode === "cache-only") {
            throw new Error(`cannot refetch the cache-only resource`);
        }
        this.invalidate();
        this._refetching = true;
    }

    private get mode(): QueryMode {
        return (this.queryArgs?.optionsArgs?.options?.mode as QueryMode | undefined) ?? "cache-and-network";
    }

    private validateData(data: any): any {
        if (this.queryArgs.ids !== undefined) {
            const objectStyle: ObjectStyles = 
                (
                    this.queryArgs.optionsArgs?.options as ObjectQueryOptions<any, any, any> | undefined
                )?.objectStyle 
                ?? "required";
            if (objectStyle === "required") {
                const arr = data as ReadonlyArray<any>;
                for (let i = 0; i < arr.length; i++) {
                    if (arr[i] === undefined) {
                        throw new Error(
                            `Cannot find object whose type is "${this.queryArgs.shape.typeName}" and id is "${this.queryArgs.ids[i]}"`
                        );
                    }
                }
            }
        }
        return data;
    }

    gcVisit() {
        const data = this.loadable.data;
        if (data !== undefined) {
            const shape = this.queryArgs.shape;
        }
    }
}

class Dependencies {
    
    private map = new Map<string, TypeDependency>();

    accept(schema: SchemaMetadata, shape: RuntimeShape, obj: any) {
        
        const typeMetadata = schema.typeMap.get(shape.typeName);
        if (typeMetadata === undefined) {
            throw new Error(`Illegal runtime shape type "${shape.typeName}"`);
        }
        const idFieldName = typeMetadata.idField.name;

        let id: any;
        if (shape.typeName === "Query") {
            id = QUERY_OBJECT_ID;
        } else {
            const idShapedField = shape.fieldMap.get(idFieldName);
            if (idShapedField === undefined) {
                throw new Error(`Cannot accept the runtime shape whose type is "${shape.typeName}" without id`);
            }
            id = obj[idShapedField.alias ?? idShapedField.name];
        }
        for (const [fieldName, field] of shape.fieldMap) {
            if (fieldName !== idFieldName) {
                const fieldMetadata = typeMetadata.fieldMap.get(fieldName);
                if (fieldMetadata === undefined) {
                    throw new Error(`Illegal runtime shape field "${shape.typeName}.${fieldName}"`);
                }
                this.typeDependency(fieldMetadata.declaringType.name).addObjectId(field, id);
                if (field.childShape !== undefined) {
                    const value = obj[field.alias ?? fieldName];
                    if (value !== undefined) {
                        const category = typeMetadata.fieldMap.get(field.name)?.category;
                        if (category === "LIST") {
                            for (const element of value) {
                                this.accept(schema, field.childShape, element);
                            }
                        } else if (category === "CONNECTION") {
                            for (const edge of value.edges) {
                                this.accept(schema, field.nodeShape!, edge.node);
                            }
                        } else {
                            this.accept(schema, field.childShape, value);
                        }
                    }
                }
            }
        }
    }

    isAffectedBy(e: EntityEvictEvent | EntityChangeEvent): boolean {
        return this.map.get(e.typeName)?.isAffectedBy(e) === true;
    }

    private typeDependency(typeName: string) {
        let typeDependency = this.map.get(typeName);
        if (typeDependency === undefined) {
            typeDependency = new TypeDependency();
            this.map.set(typeName, typeDependency);
        }
        return typeDependency;
    }
}

class TypeDependency {

    readonly isQuery: boolean;

    private fieldKeyIdMutlipMap = new Map<string, Set<any>>();

    addObjectId(field: RuntimeShapeField, id: any) {
        const key = VariableArgs.fieldKey(field.name, field.args);
        let ids = this.fieldKeyIdMutlipMap.get(key);
        if (ids === undefined) {
            ids = new Set<any>();
            this.fieldKeyIdMutlipMap.set(key, ids);
        }
        ids.add(id);
    }

    isAffectedBy(e: EntityEvictEvent | EntityChangeEvent) {
        return e.eventType === "evict" ?
            this.isAffectedByEvictEvent(e) :
            this.isAffectedByChangeEvent(e);
    }

    private isAffectedByEvictEvent(e: EntityEvictEvent) {
        if (e.evictedType === "row") {
            return true;
        }
        for (const entityKey of e.evictedKeys) {
            const key = typeof entityKey === "string" ? 
                entityKey :
                VariableArgs.fieldKey(entityKey.name, VariableArgs.of(entityKey.variables));
            if (this.fieldKeyIdMutlipMap.has(key) === true) {
                return true;
            }
        }
        return false;
    }

    private isAffectedByChangeEvent(e: EntityChangeEvent): boolean {
        for (const entityKey of e.changedKeys) {
            const key = typeof entityKey === "string" ? 
                entityKey :
                VariableArgs.fieldKey(entityKey.name, VariableArgs.of(entityKey.variables));
            if (this.fieldKeyIdMutlipMap.get(key)?.has(e.id) === true) {
                return true;
            }
        }
        return false;
    }
}

export interface QueryLoadable<T> extends Loadable<T> {

    refetch: () => void;
}