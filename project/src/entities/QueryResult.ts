import { Fetcher } from "graphql-ts-client-api";
import { EntityChangeEvent } from "..";
import { FieldMetadataCategory } from "../meta/impl/FieldMetadata";
import { SchemaMetadata } from "../meta/impl/SchemaMetadata";
import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { Loadable } from "../state/impl/StateValue";
import { EntityManager } from "./EntityManager";
import { QueryService } from "./QueryService";
import { RuntimeShape, RuntimeShapeField, toRuntimeShape } from "./RuntimeShape";

export class QueryResult {
    
    private _refCount = 0;

    private _promise?: Promise<any>;

    private _loadable: Loadable = { loading: true };

    private _invalid = true;

    private _asyncRequestId = 0;

    private _listener?: (e: EntityChangeEvent) => void;

    constructor(
        readonly entityManager: EntityManager,
        readonly queryArgs: QueryArgs
    ) {}

    retain(): this {
        this._refCount++;
        return this;
    }

    release(): boolean {
        if (--this._refCount === 0) {
            this.acceptData(undefined);
            return true;
        }
        return false;
    }

    get promise(): Promise<any> {
        if (this._invalid) {
            let promise: Promise<any>;
            const queryService = new QueryService(this.entityManager);
            if (this.queryArgs.ids !== undefined) {
                promise = queryService.queryObjects(this.queryArgs.ids, this.queryArgs.shape);
            } else {
                promise = queryService.query(this.queryArgs.shape);
            }
            const asyncRequestId = this._asyncRequestId;
            if (!this._loadable.loading) {
                this._loadable = { ...this._loadable, loading: true };
            }
            this._promise = 
                promise
                .then(data => {
                    if (this._asyncRequestId === asyncRequestId) {
                        this._loadable = {
                            data,
                            loading: false
                        }
                    }
                    this.acceptData(data);
                    return data;
                })
                .catch(error => {
                    if (this._asyncRequestId === asyncRequestId) {
                        this._loadable = {
                            error,
                            loading: false
                        }
                    }
                    return error;
                })
                .finally(() => {
                    if (this._asyncRequestId === asyncRequestId) {
                        this.entityManager.stateManager.publishQueryResultChangeEvent({
                            queryResult: this,
                            changedType: "ASYNC_STATE_CHANGE"
                        });
                    }
                });
            this._invalid = false;
        }
        return this._promise!;
    }

    get loadable(): Loadable {
        this.promise;
        return this._loadable;
    }

    private acceptData(data: any) {
        const l = this._listener;
        if (l !== undefined) {
            this._listener = undefined;
            this.entityManager.stateManager.removeListener(l);
        }
        if (data !== undefined) {
            const dependencies = new Dependencies();
            dependencies.accept(this.entityManager.schema, this.queryArgs.shape, data);
            const listener = (e: EntityChangeEvent) => {
                if (dependencies.has(e)) {
                    this.invalidate();
                }
            };
            this._listener = listener;
            this.entityManager.stateManager.addListener(listener);
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

export class QueryArgs {

    private _shape: RuntimeShape;

    constructor(
        readonly fetcher: Fetcher<string, object, object>,
        readonly ids?: ReadonlyArray<any>,
        readonly variables?: any
    ) {
        if (fetcher.fetchableType.name === 'Query' && ids !== undefined) {
            throw new Error("Generic query does not support id");
        } else if (fetcher.fetchableType.name !== 'Query' && ids === undefined) {
            throw new Error("Id is required for object query");
        }
        this._shape = toRuntimeShape(fetcher, variables);
    }

    get shape(): RuntimeShape {
        return this._shape;
    }
}

class Dependencies {
    
    private map = new Map<string, Dependency>();

    accept(schema: SchemaMetadata, shape: RuntimeShape, obj: any) {
        this.handleInsertion(schema, shape);
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
                    if (typeof changedKey === "string" && changedKeySet.has(changedKeyString(changedKey))) {
                        return true;
                    }
                    if (typeof changedKey === "object" && changedKeySet.has(changedKeyString(changedKey.name, changedKey.variables))) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private handleInsertion(schema: SchemaMetadata, shape: RuntimeShape) {
        const type = schema.typeMap.get(shape.typeName)!;
        if (type.name === 'Query' || type.category === 'CONNECTION' || type.category === 'EDGE') {
            for (const field of shape.fields) {
                const childShape = field.childShape;
                if (childShape !== undefined) {
                    let dependency = this.map.get(childShape.typeName);
                    if (dependency === undefined) {
                        dependency = { 
                            handleInsertion: true, 
                            idChangedKeyMap: new Map<String, Set<string>>() 
                        };
                        this.map.set(childShape.typeName, dependency);
                    } else {
                        dependency.handleInsertion ||= true;
                    }
                }
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
                    for (const field of shape.fields) {
                        if (field.name !== idFieldName) {
                            let changedKeySet = dependency.idChangedKeyMap.get(id); 
                            if (changedKeySet === undefined) {
                                changedKeySet = new Set<string>();
                                dependency.idChangedKeyMap.set(id, changedKeySet);
                            }
                            changedKeySet.add(changedKeyString(field.name, field.variables));
                        }
                    }
                }
                for (const field of shape.fields) {
                    const childShape = field.childShape;
                    if (childShape !== undefined) {
                        this.handleObjectChange(schema, childShape, obj[field.name]);
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

function changedKeyString(fieldName: string, variables?: any): string {
    const vsCode = variables !== undefined ? JSON.stringify(variables) : undefined;
    if (vsCode === undefined || vsCode === '{}') {
        return fieldName;
    }
    return `${fieldName}:${vsCode}`;
}
