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

export function toRuntimeShape(type: TypeMetadata, shape: any): RuntimeShape {
    const fieldMap = new Map<string, RuntimeShapeField>();
    for (const fieldName in shape) {
        const shapeValue = shape[fieldName];
        if (shapeValue) {
            const field = type.fieldMap.get(fieldName);
            if (field?.isAssociation) {
                fieldMap.set(fieldName, {
                    name: fieldName,
                    variables: shapeValue[" $variables"],
                    childShape: toRuntimeShape(field.targetType!, typeof shapeValue === "object" ? shapeValue : {})
                });
            } else {
                if (shapeValue[" $variables"]) {
                    throw new Error(`Illegal shape, cannot specify variables for scalar field ${type.name}.${fieldName}`);
                }
                fieldMap.set(fieldName, { name: fieldName });
            }
        }
    }
    fieldMap.set(type.idField.name, { name: type.idField.name });
    const fields: RuntimeShapeField[] = [];
    for (const [, field] of fieldMap) {
        fields.push(field);
    }
    fields.sort((a, b) => {
        if (a.name < b.name) {
            return -1;
        }
        if (a.name > b.name) {
            return +1;
        }
        return 0;
    });
    return {
        " $runtimeShape": true,
        typeName: type.name,
        fields
    };
}