import { TypeMetadata } from "../meta/impl/TypeMetdata";
export interface RuntimeShape {
    readonly " $runtimeShape": true;
    readonly typeName: string;
    readonly fields: RuntimeShapeField[];
}
export interface RuntimeShapeField {
    readonly name: string;
    readonly alias?: string;
    readonly variables?: any;
    readonly baseOnType?: string;
    readonly childShape?: RuntimeShape;
}
export declare function toRuntimeShape(type: TypeMetadata, shape: any): RuntimeShape;
