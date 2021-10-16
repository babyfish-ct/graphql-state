export declare class VariableArgs {
    readonly variables?: any;
    readonly key?: string | undefined;
    private static readonly EMPTY_ARGS;
    private constructor();
    constains(args: VariableArgs): boolean;
    static of(variables: any): VariableArgs;
}
