export declare abstract class AsyncPeakClippingValue {
    private _invalid;
    private _promise;
    private _executing;
    private _moreInvalidations;
    invalidate(): void;
    get promise(): Promise<any>;
    private execute;
    protected abstract onInvalidate(): void;
    protected abstract onExecute(): Promise<any>;
    protected abstract onComplete(): void;
}
