"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toRuntimeShape = void 0;
function toRuntimeShape(type, shape) {
    const fieldMap = new Map();
    for (const fieldName in shape) {
        const shapeValue = shape[fieldName];
        if (shapeValue) {
            const field = type.fieldMap.get(fieldName);
            if (field === null || field === void 0 ? void 0 : field.isAssociation) {
                fieldMap.set(fieldName, {
                    name: fieldName,
                    variables: shapeValue[" $variables"],
                    childShape: toRuntimeShape(field.targetType, typeof shapeValue === "object" ? shapeValue : {})
                });
            }
            else {
                if (shapeValue[" $variables"]) {
                    throw new Error(`Illegal shape, cannot specify variables for scalar field ${type.name}.${fieldName}`);
                }
                fieldMap.set(fieldName, { name: fieldName });
            }
        }
    }
    fieldMap.set(type.idField.name, { name: type.idField.name });
    const fields = [];
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
exports.toRuntimeShape = toRuntimeShape;
