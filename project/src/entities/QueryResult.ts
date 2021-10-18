import { Fetcher } from "graphql-ts-client-api";
import { EntityChangeEvent } from "..";
import { SchemaMetadata } from "../meta/impl/SchemaMetadata";
import { Loadable } from "../state/impl/StateValue";
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

    private _listener: (e: EntityChangeEvent) => void;

    private _currentAsyncRequestId = 0;

    private _dependencies?: Dependencies;

    constructor(
        readonly entityManager: EntityManager,
        readonly queryArgs: QueryArgs
    ) {
        this._listener = this.onEntityChange.bind(this);
        entityManager.stateManager.addListener(this._listener);
    }

    retain(): this {
        this._refCount++;
        return this;
    }

    release(): boolean {
        if (--this._refCount === 0) {
            this.entityManager.stateManager.removeListener(this._listener);
            return true;
        }
        return false;
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

    private onEntityChange(e: EntityChangeEvent) {
        if (this._dependencies?.has(e) === true) {
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
}

class Dependencies {
    
    private map = new Map<string, Dependency>();

    accept(schema: SchemaMetadata, shape: RuntimeShape, obj: any) {
        this.handleInsertion(schema, shape, false);
        this.handleObjectChange(schema, shape, obj);
    }

    has(e: EntityChangeEvent) {
        const dependency = this.map.get(e.typeName);
        if (dependency !== undefined) {
            if (e.changedType === "DELETE") {
                return true;
            }
            if (e.changedType === "INSERT" && dependency.handleInsertion) {
                return true;
            }
            const changedKeySet = dependency.idChangedKeyMap?.get(e.id);
            if (changedKeySet !== undefined) {
                for (const changedKey of e.changedKeys) {
                    if (typeof changedKey === "string" && changedKeySet.has(changedKeyString(changedKey, undefined))) {
                        return true;
                    }
                    if (typeof changedKey === "object" && changedKeySet.has(changedKeyString(changedKey.name, VariableArgs.of(changedKey.variables)))) {
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
                            changedKeySet.add(changedKeyString(field.name, field.args));
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

function changedKeyString(fieldName: string, args?: VariableArgs): string {
    if (args === undefined) {
        return fieldName;
    }
    return `${fieldName}:${args.key}`;
}
