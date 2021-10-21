import { FetchableField, FetchableType } from "graphql-ts-client-api";
import { FieldMetadata } from "./FieldMetadata";
import { SchemaMetadata } from "./SchemaMetadata";

export class TypeMetadata {

    readonly name: string;

    readonly category: TypeMetadataCategory;

    private _superType: string | TypeMetadata | undefined;

    private _derivedTypes: Set<TypeMetadata> = new Set<TypeMetadata>();

    private _rootType?: TypeMetadata;

    private _declaredFieldMap = new Map<string, FieldMetadata>();

    private _fieldMap: Map<string, FieldMetadata> | undefined = undefined;

    private _idField?: FieldMetadata;

    constructor(
        readonly schema: SchemaMetadata,
        fetchableType: FetchableType<string>
    ) {
        this.name = fetchableType.name;
        this.category = fetchableType.category;
        switch (fetchableType.superTypes.length) {
            case 0:
                this._superType = undefined;
                break;
            case 1:
                if (fetchableType.category !== 'OBJECT') {
                    throw new Error(`The non-object type ${fetchableType.name} cannot accept super type`);
                }
                if (fetchableType.superTypes[0].category !== 'OBJECT') {
                    throw new Error(`The type ${fetchableType.name} cannot accept super type ${fetchableType.superTypes[0].name} because that super class is not object type`);
                }
                this._superType = fetchableType.superTypes[0].name;
                break;
            default:
                throw new Error(`graph-state does not support mutliple inheritance but the type "${fetchableType.name}" has ${fetchableType.superTypes.length} super types`);
        }
        for (const [, field] of fetchableType.declaredFields) {
            this.addField(field);
        }
        if (fetchableType.name === "Query") {
            this._idField = new FieldMetadata(this, {
                name: "__queryObjectId",
                category: "ID",
                argGraphQLTypeMap: new Map<string, string>(),
                isPlural: false,
                isAssociation: false,
                isFunction: false,
                isUndefinable: false
            });
        } else if (fetchableType.name === "Mutation") {
            this._idField = new FieldMetadata(this, {
                name: "__mutationObjectId",
                category: "ID",
                argGraphQLTypeMap: new Map<string, string>(),
                isPlural: false,
                isAssociation: false,
                isFunction: false,
                isUndefinable: false
            });
        }
    }

    get superType(): TypeMetadata | undefined {
        let superType = this._superType;
        if (typeof superType === "string") {
            const superMetadata = this.schema.typeMap.get(superType);
            if (superMetadata === undefined) {
                throw new Error(`Illegal type "${this.name}" becasue its super type "${superType}" is not exists`);
            }
            const cycle = [this.name];
            for (let meta: TypeMetadata | undefined = superMetadata; meta !== undefined; meta = meta.superType) {
                cycle.push(meta.name);
                if (cycle[0] === meta.name) {
                    throw new Error(`Super type reference cycle: ${cycle.map(name => `"${name}"`).join(" -> ")}`);
                }
            }
            this._superType = superType = superMetadata;
        }
        return superType as TypeMetadata | undefined;
    }

    get derivedType(): ReadonlySet<TypeMetadata> {
        let set = this._derivedTypes;
        if (set !== undefined) {
            set = new Set<TypeMetadata>();
            this._derivedTypes = set;
        }
        return set;
    }

    get rootType(): TypeMetadata {
        let rootMetadata = this._rootType;
        if (rootMetadata === undefined) {
            this._rootType = rootMetadata = this.superType?.rootType ?? this;
        }
        return rootMetadata;
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
                        throw new Error(`The field "${field.fullName}" overrides "${baseField.fullName}", overridden is forbidden`);
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
                throw new Error(`There is no id field in the type "${this.name}"`);
            }
            this._idField = field;
        }
        return field;
    }

    isAssignableFrom(type: TypeMetadata): boolean {
        for (let t: TypeMetadata | undefined = type; t !== undefined; t = t.superType) {
            if (this === t) {
                return true;
            }
        }
        return false;
    }

    setFieldMappedBy(name: string, oppositeFieldName: string) {
        this.schema.preChange();
        const field = this.fieldMap.get(name);
        if (field === undefined) {
            throw new Error(`Cannot set the "mappedBy" of field "${name}" because that field is not exists in type "${this.name}"`);
        }
        field.setOppositeFieldName(oppositeFieldName);
    }

    private addField(field: FetchableField) {
        this.schema.preChange();
        if (this._fieldMap !== undefined) {
            throw new Error("The current type is frozen becasue the fieldMap is cached");
        }
        if (this._declaredFieldMap.has(field.name)) {
            throw new Error(`The field "${this.name}.${field.name}" is alreay exists`);
        }
        if (field.category === "ID") {
            if (this._superType !== undefined) {
                throw new Error(`Cannot add id field into "${this.name}" because its super class is specified`);
            }
            if (this._idField !== undefined) {
                throw new Error(`Cannot add id field into "${this.name}" because its id field is already specified`);
            }
        }
        if (this.name !== "Query" && 
            this.name !== "Mutation" && 
            field.argGraphQLTypeMap.size !== 0 && 
            field.category !== "LIST" && 
            field.category !== "CONNECTION"
        ) {
            throw new Error(`Illegal field ${this.name}.${field.name}, arguments can only be supported by list or connection`);
        }
        const fieldMetadata = new FieldMetadata(this, field);
        this._declaredFieldMap.set(fieldMetadata.name, fieldMetadata);
        if (field.category === "ID") {
            this._idField = fieldMetadata;
        }
    }

    createObject(id: any): any {
        return { [this.idField.name]: id };
    }
}

export type TypeMetadataCategory = "OBJECT" | "CONNECTION" | "EDGE";
