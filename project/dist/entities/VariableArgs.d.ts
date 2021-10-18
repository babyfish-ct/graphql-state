export declare class VariableArgs {
    readonly variables: any;
    readonly key: string;
    private constructor();
    constains(args: VariableArgs): boolean;
    static of(variables: any): VariableArgs | undefined;
    static contains(left: VariableArgs | undefined, right: VariableArgs | undefined): boolean;
}
