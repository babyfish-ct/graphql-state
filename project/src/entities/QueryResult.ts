import { EntityChangeEvent } from "..";
import { SchemaMetadata } from "../meta/impl/SchemaMetadata";
import { Loadable } from "../state/impl/StateValue";
import { EntityEvictEvent } from "./EntityEvent";
import { EntityManager } from "./EntityManager";
import { QueryArgs } from "./QueryArgs";
import { QueryService } from "./QueryService";
import { QUERY_OBJECT_ID } from "./Record";
import { RuntimeShape, RuntimeShapeField } from "./RuntimeShape";
import { VariableArgs } from "./VariableArgs";

export class QueryResult {
    
    private _refCount = 0;

    private _promise?: Promise<any>;

    private _loadable: Loadable = { loading: true };

    private _invalid = true;

    private _evictListener: (e: EntityEvictEvent) => void;

    private _changeListener: (e: EntityChangeEvent) => void;

    private _currentAsyncRequestId = 0;

    private _dependencies?: Dependencies;

    private _disposeTimerId?: NodeJS.Timeout = undefined;

    private _createdMillis = new Date().getTime();

    constructor(
        readonly entityManager: EntityManager,
        readonly queryArgs: QueryArgs,
        private disposer: () => void
    ) {
        this._evictListener = this.onEntityEvict.bind(this);
        this._changeListener = this.onEntityChange.bind(this);
        entityManager.addEvictListener(undefined, this._evictListener);
        entityManager.addChangeListener(undefined, this._changeListener);
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
            this._promise = this.query();
            this._invalid = false;
        }
        return this._promise!;
    }

    get loadable(): Loadable {
        this.promise;
        return this._loadable;
    }

    private async query(): Promise<any> {
        
        const rawResult = new QueryService(this.entityManager).query(this.queryArgs);

        if (rawResult.type === 'cached') {
            this.refreshDependencies(rawResult.data);
            this._loadable = { loading: false, data: rawResult.data };
            this.entityManager.stateManager.publishQueryResultChangeEvent({
                queryResult: this,
                changedType: "ASYNC_STATE_CHANGE"
            });
            return rawResult.data;
        }

        if (!this._loadable.loading) {
            this._loadable = { ...this._loadable, loading: true };
            this.entityManager.stateManager.publishQueryResultChangeEvent({
                queryResult: this,
                changedType: "ASYNC_STATE_CHANGE"
            });
        }

        const asyncRequestId = ++this._currentAsyncRequestId;
        this.retain(); // Self holding during Async computing

        try {
            const data = await rawResult.promise;
            if (this._currentAsyncRequestId === asyncRequestId) {
                this.refreshDependencies(data);
                this._loadable = {
                    data,
                    loading: false
                }
            }
        } catch (ex) {
            if (this._currentAsyncRequestId === asyncRequestId) {
                this._loadable = {
                    loading: false,
                    error: ex
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
        console.log("dispose", this.queryArgs.variables);
        this.entityManager.removeEvictListener(undefined, this._evictListener);
        this.entityManager.removeChangeListener(undefined, this._changeListener);
        this.disposer();
    }
}

class Dependencies {
    
    private map = new Map<string, TypeDependency>();

    accept(schema: SchemaMetadata, shape: RuntimeShape, obj: any) {
        const baseTypeName = shape.typeName;
        const type = schema.typeMap.get(baseTypeName);
        if (type === undefined) {
            throw new Error(`Illegal type "${baseTypeName}"`);
        }
        const typeDependency = this.typeDependency(baseTypeName);
        if (typeDependency.isQuery) {
            const id = QUERY_OBJECT_ID;
            for (const [, field] of shape.fieldMap) {
                this
                .typeDependency(field.declaringTypeName ?? baseTypeName)
                .addObjectId(field, id);
            }
        } else {
            const idFieldName = type.idField.name;
            const idShapedField = shape.fieldMap.get(idFieldName);
            if (idShapedField === undefined) {
                throw new Error(`Cannot accept the runtime shape whose type is "${type.name}" without id`);
            }
            const id = obj[idShapedField.alias ?? idShapedField.name];
            for (const [, field] of shape.fieldMap) {
                this
                .typeDependency(field.declaringTypeName ?? baseTypeName)
                .addObjectId(field, id);
            }
        }
        for (const [fieldName, field] of shape.fieldMap) {
            if (field.childShape !== undefined) {
                const value = obj[field.alias ?? fieldName];
                if (value !== undefined) {
                    const category = type.fieldMap.get(field.name)?.category;
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

    isAffectedBy(e: EntityEvictEvent | EntityChangeEvent): boolean {
        return this.map.get(e.typeName)?.isAffectedBy(e) === true;
    }

    private typeDependency(typeName: string) {
        let typeDependency = this.map.get(typeName);
        if (typeDependency === undefined) {
            typeDependency = new TypeDependency(typeName);
            this.map.set(typeName, typeDependency);
        }
        return typeDependency;
    }
}

class TypeDependency {

    readonly isQuery: boolean;

    private fieldKeyIdMutlipMap = new Map<string, Set<any>>();

    constructor(typeName: string) {
        this.isQuery = typeName === "Query";
    }

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
