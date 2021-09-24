import { TypeMetadata, TypeMetadataCategory } from "./TypeMetdata";

export class SchemaMetadata {

    private _typeMap = new Map<string, TypeMetadata>();

    get typeMap(): ReadonlyMap<string, TypeMetadata> {
        return this._typeMap;
    }

    public addType(category: TypeMetadataCategory, typeName) {
        this.validateTypeName(typeName);
        this._typeMap.set(typeName, new TypeMetadata(this, category, typeName));
    }

    private validateTypeName(typeName: string) {
        if (!TYPE_NAME_PATTERN.test(typeName)) {
            throw new Error(`typeName "${typeName}" does not match the pattern "${TYPE_NAME_PATTERN.source}"`);
        }
        if (this._typeMap.has(typeName)) {
            throw new Error(`Cannot add the type "${typeName}" becasue it's exists`);
        }
    }
}

const TYPE_NAME_PATTERN = /^[_A-Za-z][_A-Za-z0-0]*$/;
