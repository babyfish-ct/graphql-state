import { Fetcher } from "graphql-ts-client-api";
import { ParameterizedComputedState, SingleComputedState, StateUnmoutHandler } from "../State";
import { InternalComputedContext } from "./InternalComputedContext";
import { StateInstance } from "./StateInstance";
import { Loadable, StateValue } from "./StateValue";

export class ComputedStateValue extends StateValue {

    private _unmountHandler?: StateUnmoutHandler;

    private _result: any;

    private _loadable: Loadable;

    private _invalid = true;

    private _ctx?: InternalComputedContext;

    private _asyncRequestId = 0;

    constructor(
        stateInstance: StateInstance,
        variablesCode: string | undefined,
        variables: any
    ) {
        super(stateInstance, variablesCode, variables);
        this._loadable = {
            loading: this.isAsync
        };
    }

    mount() {
        if (this.stateInstance.state[" $stateType"] !== "WRITABLE") {
            const mount = this.stateInstance.state[" $options"]?.mount;
            if (mount !== undefined) {
                const ctx = { invalidate: this.invalidate.bind(this) };
                this._unmountHandler = mount(ctx) as StateUnmoutHandler | undefined;
            }
        }
    }

    umount() {
        try {
            this.freeContext();
        } finally {
            const h = this._unmountHandler;
            if (h !== undefined) {
                this._unmountHandler = undefined;
                h();
            }
        }
    }

    invalidate() {
        if (!this._invalid) {
            this._invalid = true;
            this.stateInstance.scopedStateManager.stateManager.publishStateValueChangeEvent({
                stateValue: this,
                changedType: "RESULT_CHANGE"
            });
        }
    }

    get result(): any {
        return this.compute();
    }

    get loadable(): Loadable {
        this.compute();
        return this._loadable;
    }

    compute(parentContext?: InternalComputedContext): any {
        if (this._invalid) {
            this.beforeCompute();
            const result = this.compute0(parentContext);
            this._result = this.afterCompute(result);
            this._invalid = false;
        }
        return this._result;
    }

    private compute0(parentContext?: InternalComputedContext): any {
        const newCtx = new InternalComputedContext(parentContext ?? this.stateInstance.scopedStateManager, this);
        let result: any;
        try {
            if (this.stateInstance.state[" $parameterized"]) {
                result = (this.stateInstance.state as any)[" $valueSupplier"](this.exportContext(newCtx), this.variables);
            } else {
                result = (this.stateInstance.state as any)[" $valueSupplier"](this.exportContext(newCtx));
            }
        } catch (ex) {
            newCtx.close();
            throw ex;
        }
        
        this.freeContext();
        this._ctx = newCtx;
        return result;
    }

    private freeContext() {
        const ctx = this._ctx;
        if (ctx !== undefined) {
            this._ctx = undefined;
            ctx.close();
        }
    }

    private exportContext(ctx: InternalComputedContext): any {
        let publicContext = getFormContext.bind(ctx);
        publicContext.self = getSelfFormContext.bind(ctx);
        publicContext.object = objectFormContext.bind(ctx);
        publicContext.objects = objectsFormContext.bind(ctx);
        return publicContext;
    }

    private get isAsync(): boolean {
        return this.stateInstance.state[" $stateType"] === "ASYNC";
    }

    private beforeCompute() {
        if (this.isAsync && !this._loadable.loading) {
            this._loadable = {
                data: this._loadable.data,
                loading: true
            };
            this.stateInstance.scopedStateManager.stateManager.publishStateValueChangeEvent({
                stateValue: this,
                changedType: "ASYNC_STATE_CHANGE"
            });
        }
    }

    private afterCompute(result: any): any {
        if (this.isAsync) {
            const asyncRequestId = ++this._asyncRequestId;
            return (result as Promise<any>)
                .then(data => {
                    if (this._asyncRequestId === asyncRequestId) {
                        this._loadable = {
                            data,
                            loading: false
                        }
                    }
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
                        this.stateInstance.scopedStateManager.stateManager.publishStateValueChangeEvent({
                            stateValue: this,
                            changedType: "ASYNC_STATE_CHANGE"
                        })
                    }
                });
        }
        this._loadable = {
            loading: false,
            data: result
        }
        return result;
    }
}

function getFormContext(state: any, options: any): any {
    const ctx = this as InternalComputedContext;
    return ctx.get(state, options);
}

function getSelfFormContext(options: any): any {
    const ctx = this as InternalComputedContext;
    return ctx.getSelf(options);
}

function objectFormContext(fetcher: Fetcher<string, object, object>, id: any, variables?: any): any {
    const ctx = this as InternalComputedContext;
    return ctx.object(fetcher, id, variables);
}

function objectsFormContext(fetcher: Fetcher<string, object, object>, ids: ReadonlyArray<any>, variables?: any): any {
    const ctx = this as InternalComputedContext;
    return ctx.objects(fetcher, ids, variables);
}