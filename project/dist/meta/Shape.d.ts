export declare type Shape<T> = T extends object ? {
    readonly [K in keyof T]?: (T[K] extends ReadonlyArray<infer TElement> ? Shape<TElement> : Shape<T[K]>);
} : (boolean | {
    readonly " $variables": object;
});
export declare type ObjectTypeOf<T, TShape> = T extends object ? {
    readonly [K in keyof TShape & keyof T]: TShape[K] extends object ? (T[K] extends ReadonlyArray<infer TElement> ? ReadonlyArray<ObjectTypeOf<TElement, Omit<TShape[K], " $variables">>> : ObjectTypeOf<T[K], Omit<TShape[K], " $variables">>) : T[K];
} : T;
export declare function variables(variables: object): {
    " $variables": object;
};
