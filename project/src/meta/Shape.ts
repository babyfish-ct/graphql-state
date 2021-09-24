import { ObjectType } from "./SchemaTypes";

export type Shape<T> = 
    T extends object ?
    { 
        readonly [K in keyof T]? : 
        (
            T[K] extends ReadonlyArray<infer TElement> ?
            Shape<TElement> :
            Shape<T[K]>
        ) & { readonly " $variables"?: object }
    } :
    true | { readonly " $variables": object }
;

export type ObjectTypeOf<T, TShape> = 
    T extends object ?
    { 
        readonly [K in keyof TShape & keyof T] : 
        TShape[K] extends object ? (
            Exclude<keyof TShape[K], " $variables"> extends string ? (
                T[K] extends ReadonlyArray<any> ?
                ObjectTypeOf<T[K], Omit<TShape[K], " $variables">> :
                { readonly b: string}
                // ReadonlyArray<ObjectTypeOf<T[K], Omit<TShape[K], " $variables">>> :
                // ObjectTypeOf<T[K], Omit<TShape[K], " $variables">>
            ) :
            T[K]
        ) :
        T[K] 
    } :
    {}
;

export function variables(variables: object): { " $variables": object} {
    return { " $variables": variables };
}
