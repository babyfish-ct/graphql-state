import { Fetcher } from "graphql-ts-client-api";
import { EntityChangeEvent } from "..";
import { SchemaMetadata } from "../meta/impl/SchemaMetadata";
import { Loadable } from "../state/impl/StateValue";
import { EntityEvictEvent } from "./EntityEvent";
import { EntityManager } from "./EntityManager";
import { QueryArgs } from "./QueryArgs";
import { QueryService } from "./QueryService";
import { RuntimeShape } from "./RuntimeShape";
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
            }
            const millis = Math.min(new Date().getTime() - this._createdMillis, maxDelayMillis)
            let timerId = this._disposeTimerId;
            if (timerId !== undefined) {
                clearTimeout(timerId);
            }
            timerId = setTimeout(() => {
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
        if (this._dependencies?.isAffectedByEvictEvent(e) === true) {
            this.invalidate();
        }
    }

    private onEntityChange(e: EntityChangeEvent) {
        if (this._dependencies?.isAffectedByChangeEvent(e) === true) {
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
    
    private map = new Map<string, Dependency>();

    accept(schema: SchemaMetadata, shape: RuntimeShape, obj: any) {
        this.handleInsertion(schema, shape, false);
        this.handleObjectChange(schema, shape, obj);
    }

    isAffectedByEvictEvent(e: EntityEvictEvent): boolean {
        const dependency = this.map.get(e.typeName);
        if (dependency !== undefined) {
            if (e.evictedType === "row") {
                return true;
            }
            const keySet = dependency.idChangedKeyMap?.get(e.id);
            if (keySet !== undefined) {
                for (const evictedKey of e.evictedKeys) {
                    if (typeof evictedKey === "string" && keySet.has(evictedKey)) {
                        return true;
                    }
                    if (typeof evictedKey === "object" && keySet.has(VariableArgs.fieldKey(evictedKey.name, evictedKey.variables))) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    isAffectedByChangeEvent(e: EntityChangeEvent): boolean {
        const dependency = this.map.get(e.typeName);
        if (dependency !== undefined) {
            if (e.changedType === "delete") {
                return true;
            }
            if (e.changedType === "insert" && dependency.handleInsertion) {
                return true;
            }
            const keySet = dependency.idChangedKeyMap?.get(e.id);
            if (keySet !== undefined) {
                for (const changedKey of e.changedKeys) {
                    if (typeof changedKey === "string" && keySet.has(changedKey)) {
                        return true;
                    }
                    if (typeof changedKey === "object" && keySet.has(VariableArgs.fieldKey(changedKey.name, changedKey.variables))) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private handleInsertion(schema: SchemaMetadata, shape: RuntimeShape, isLeaf: boolean) {
        if (isLeaf && schema.typeMap.get(shape.typeName)?.category === 'OBJECT') {
            let dependency = this.map.get(shape.typeName);
            if (dependency === undefined) {
                dependency = { 
                    handleInsertion: true, 
                    idChangedKeyMap: new Map<String, Set<string>>() 
                };
                this.map.set(shape.typeName, dependency);
            } else {
                dependency.handleInsertion ||= true;
            }
        }
        for (const [, field] of shape.fieldMap) {
            const childShape = field.childShape;
            if (childShape !== undefined) {
                this.handleInsertion(schema, childShape, true);
            }
        }
    }

    private handleObjectChange(schema: SchemaMetadata, shape: RuntimeShape, obj: any) {
        if (Array.isArray(obj)) {
            for (const element of obj) {
                this.handleObjectChange(schema, shape, element);
            }
        } else {
            const type = schema.typeMap.get(shape.typeName)!;
            if (obj !== undefined) {
                if (type.name !== 'Query' && type.category !== 'CONNECTION' && type.category !== 'EDGE') {
                    let dependency = this.map.get(shape.typeName);
                    if (dependency === undefined) {
                        dependency = { 
                            handleInsertion: false, 
                            idChangedKeyMap: new Map<String, Set<string>>() 
                        };
                        this.map.set(shape.typeName, dependency);
                    }
                    const idFieldName = schema.typeMap.get(shape.typeName)!.idField.name;
                    const id = obj[idFieldName];
                    for (const [, field] of shape.fieldMap) {
                        if (field.name !== idFieldName) {
                            let changedKeySet = dependency.idChangedKeyMap.get(id); 
                            if (changedKeySet === undefined) {
                                changedKeySet = new Set<string>();
                                dependency.idChangedKeyMap.set(id, changedKeySet);
                            }
                            changedKeySet.add(VariableArgs.fieldKey(field.name, field.args));
                        }
                    }
                }
                for (const [, field] of shape.fieldMap) {
                    const childShape = field.childShape;
                    if (childShape !== undefined) {
                        this.handleObjectChange(schema, childShape, obj[field.alias ?? field.name]);
                    }
                }
            }
        }
    }
}

interface Dependency {
    
    handleInsertion: boolean;

    idChangedKeyMap: Map<any, Set<string>>;
}
