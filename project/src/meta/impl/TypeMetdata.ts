import { FieldMetadata, FieldMetadataCategory, FieldMetadataOptions } from "./FieldMetadata";
import { SchemaMetadata } from "./SchemaMetadata";

export class TypeMetadata {

    private _superType?: string | TypeMetadata;

    private _declaredFieldMap = new Map<string, FieldMetadata>();

    private _fieldMap: Map<string, FieldMetadata> | undefined = undefined;

    private _idField?: FieldMetadata;

    constructor(
        readonly schema: SchemaMetadata,
        readonly category: TypeMetadataCategory, 
        readonly name: string,
    ) {}

    get superType(): TypeMetadata | undefined {
        if (typeof this._superType !== 'string') {
            return this._superType;
        }
        const superMetadata = this.schema.typeMap.get(this._superType);
        if (superMetadata === undefined) {
            throw new Error(`Illegal type "${this.name}" becasue its super type "${this.superType}" is not exists`);
        }
        const cycleTypeNames = [this.name];
        for (let metadata: TypeMetadata | undefined = superMetadata; metadata; metadata = metadata.superType) {
            cycleTypeNames.push(metadata.name);
            if (metadata === this) {
                throw new Error(`Super type reference cycle: ${cycleTypeNames.map(name => `"${name}"`).join(", ")}`);
            }
        }
        this._superType = superMetadata;
        return superMetadata;
    }

    get declaredFieldMap(): ReadonlyMap<string, FieldMetadata> {
        return this._declaredFieldMap;
    }

    get fieldMap(): ReadonlyMap<string, FieldMetadata> {
        let fieldMap = this._fieldMap;
        if (fieldMap === undefined) {
            const superType = this.superType;
            if (superType === undefined) {
                this._fieldMap = fieldMap = this._declaredFieldMap;
            } else {
                fieldMap = new Map<string, FieldMetadata>(superType.fieldMap);
                for (const [name, field] of this._declaredFieldMap) {
                    const baseField = fieldMap.get(name);
                    if (baseField !== undefined) {
                        throw new Error(`The filed "${field.fullName}" overrides "${baseField.fullName}", overridden is forbidden`);
                    }
                    fieldMap.set(name, field);
                }
                this._fieldMap = fieldMap;
            }
        }
        return fieldMap;
    }

    get idField(): FieldMetadata {
        let field = this._idField;
        if (field === undefined) {
            if (this.superType !== undefined) {
                field = this.superType.idField;
            } else {
                throw new Error(`There is no id field in the  type "${this.name}"`);
            }
            this._idField = field;
        }
        return field;
    }

    setSuperType(superType: string) {
        this.schema.preChange();
        if (this._fieldMap !== undefined) {
            throw new Error("The current type is frozen becasue the fieldMap is cached");
        }
        if (this.category !== "OBJECT") {
            throw new Error(`Cannot set the super type for "${this.name}" because its category is not "OBJECT"`);
        }
        if (this._superType !== undefined) {
            throw new Error(`Cannot set the super type for "${this.name}" more than once`);
        }
        if (this._idField !== undefined) {
            throw new Error(`Cannot set the super type for "${this.name}" because its id field has been specified`);
        }
        this._superType = superType;
    }

    addField(
        category: FieldMetadataCategory,
        name: string, 
        options?: FieldMetadataOptions
    ) {
        this.schema.preChange();
        if (this._fieldMap !== undefined) {
            throw new Error("The current type is frozen becasue the fieldMap is cached");
        }
        if (this._declaredFieldMap.has(name)) {
            throw new Error(`The field "${this.name}.${name}" is alreay exists`);
        }
        if (category === "ID") {
            if (this._superType !== undefined) {
                throw new Error(`Cannot add id field into "${this.name}" because its super class is specified`);
            }
            if (this._idField !== undefined) {
                throw new Error(`Cannot add id field into "${this.name}" because its id field is already specified`);
            }
        }
        const field = new FieldMetadata(this, category, name, options);
        this._declaredFieldMap.set(name, field);
        if (category === "ID") {
            this._idField = field;
        }
    }

    setFieldMappedBy(name: string, oppositeFieldName: string) {
        this.schema.preChange();
        const field = this.fieldMap.get(name);
        if (field === undefined) {
            throw new Error(`Cannot set the "mappedBy" of field "${name}" because that field is not exists in type "${this.name}"`);
        }
        field.setOppositeFieldName(oppositeFieldName);
    }
}

export type TypeMetadataCategory = "OBJECT" | "CONNECTION" | "EDGE";