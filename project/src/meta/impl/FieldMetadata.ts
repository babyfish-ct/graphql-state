import { FetchableField } from "graphql-ts-client-api";
import { TypeMetadata } from "./TypeMetdata";

export class FieldMetadata {

    readonly name: string;

    readonly category: FieldMetadataCategory;

    readonly fullName: string;

    private _inversed = false;

    private _deleteOperation?: "CASCADE" | "SET_UNDEFINED";

    private _connectionType?: string | TypeMetadata;

    private _edgeType?: string | TypeMetadata;

    private _targetType?: string | TypeMetadata;

    private _oppositeField?: string | FieldMetadata;

    constructor(
        readonly declaringType: TypeMetadata,
        field: FetchableField
    ) {
        this.name = field.name;
        this.category = field.category;
        this.fullName = `${declaringType.name}.${field.name}`;
        this._connectionType = field.connectionTypeName;
        this._edgeType = field.edgeTypeName;
        this._targetType = field.targetTypeName;
    }

    get deleteOperation(): "CASCADE" | "SET_UNDEFINED" | undefined {
        return this._deleteOperation;
    }

    get isInversed(): boolean {
        return this._inversed;
    }

    get isAssociation(): boolean {
        return isAssociationCategory(this.category);
    }

    get connectionType(): TypeMetadata | undefined {
        if (typeof this._connectionType !== "string") {
            return this._connectionType;
        }
        
        const connectionMetadata = this.declaringType.schema.typeMap.get(this._connectionType);
        if (connectionMetadata === undefined) {
            throw new Error(`Illegal connection field "${this.fullName}", its connection type "${this._connectionType}" is not exists`);
        }
        if (connectionMetadata.category !== "OBJECT") {
            throw new Error(`Illegal connection field "${this.fullName}", the category of its target type "${this._connectionType}" is not "CONNECTION"`);
        }
        this._connectionType = connectionMetadata;
        return connectionMetadata;
    }

    get edgeType(): TypeMetadata | undefined {
        if (typeof this._edgeType !== "string") {
            return this._edgeType;
        }
        const edgeMetadata = this.declaringType.schema.typeMap.get(this._edgeType);
        if (edgeMetadata === undefined) {
            throw new Error(`Illegal connection field "${this.fullName}", its connection type "${this._edgeType}" is not exists`);
        }
        if (edgeMetadata.category !== "OBJECT") {
            throw new Error(`Illegal connection field "${this.fullName}", the category of its target type "${this._edgeType}" is not "EDGE"`);
        }
        this._edgeType = edgeMetadata;
        return edgeMetadata;
    }

    get targetType(): TypeMetadata | undefined {
        if (typeof this._targetType !== "string") {
            return this._targetType;
        }
        const targetMetadata = this.declaringType.schema.typeMap.get(this._targetType);
        if (targetMetadata === undefined) {
            throw new Error(`Illegal association field "${this.fullName}", its target type "${this._targetType}" is not exists`);
        }
        if (targetMetadata.category !== "OBJECT") {
            throw new Error(`Illegal association field "${this.fullName}", the category of its target type "${this._targetType}" is not "OBJECT"`);
        }
        this._targetType = targetMetadata;
        return targetMetadata;
    }

    get oppositeField(): FieldMetadata | undefined {
        this.declaringType.schema[" $resolvedInversedFields"]();
        return this._oppositeField as FieldMetadata | undefined;
    }

    setOppositeFieldName(oppositeFieldName: string) {
        this.declaringType.schema.preChange();
        if (this._oppositeField !== undefined) {
            throw new Error(`Cannot change the opposite field of ${this.fullName} because its opposite field has been set`);
        }
        if (!this.isAssociation) {
            throw new Error(`Cannot change the opposite field of ${this.fullName} because its is association`);
        }
        this._oppositeField = oppositeFieldName;
        this._inversed = true;
        this.declaringType.schema[" $registerUnresolvedInversedField"](this);
    }

    " $resolveInversedAssociation"() {
        if (typeof this._oppositeField !== "string") {
            return;
        }
        const targetField = this.targetType!.fieldMap.get(this._oppositeField);
        if (targetField === undefined) {
            throw new Error(`Illegal inversed association field ${this.fullName}, it's mapped by "${this._oppositeField}", but there is no such field in the target type "${this.targetType?.name}"`);
        }
        if (targetField.category !== "REFERENCE" && targetField.category !== "LIST" && targetField.category !== "CONNECTION") {
            throw new Error(`Illegal inversed association field ${this.fullName}, it's mapped by "${targetField.fullName}" but that field is not assciation`);
        }
        if (targetField._inversed) {
            throw new Error(`Illegal inversed association field ${this.fullName}, it's mapped by "${targetField.fullName}" but that field is inversed too`);
        }
        if (targetField._oppositeField !== undefined) {
            throw new Error(`Illegal inversed association field ${this.fullName}, it's mapped by "${targetField.fullName}" but that field is mapped by  another field`);
        }
        if (targetField === this) {
            throw new Error(`Illegal inversed association field ${this.fullName}, it's mapped by itself`);
        }
        this._oppositeField = targetField;
        targetField._oppositeField = this;
    }
}

export type FieldMetadataCategory = "ID" | "SCALAR" | "REFERENCE" | "LIST" | "CONNECTION"; 

export interface FieldMetadataOptions {
    readonly undefinable?: boolean,
    readonly deleteOperation?: "CASCADE" | "SET_UNDEFINED";
    readonly connectionTypeName?: string;
    readonly edgeTypeName?: string;
    readonly targetTypeName?: string;
    readonly mappedBy?: string;
}

function isAssociationCategory(category: FieldMetadataCategory) {
    return category === "REFERENCE" || category === "LIST" || category === "CONNECTION";
}