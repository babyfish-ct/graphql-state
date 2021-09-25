import { TypeMetadata } from "./TypeMetdata";

export class FieldMetadata {

    readonly fullName: string;

    private _passive = false;

    private _undefinable = false;

    private _deleteOperation?: "CASCADE" | "SET_UNDEFINED";

    private _connectionType?: string | TypeMetadata;

    private _edgeType?: string | TypeMetadata;

    private _targetType?: string | TypeMetadata;

    private _oppositeField?: string | FieldMetadata;

    constructor(
        readonly type: TypeMetadata,
        readonly category: FieldMetadataCategory,
        readonly name: string,
        options?: FieldMetadataOptions
    ) {
        this.fullName = `${type.name}.${name}`;

        if (category === "CONNECTION") {
            if (options?.connectionTypeName === undefined) {
                throw new Error(`Illegal connection field "${this.fullName}", collectionTypeName is required`);
            }
            if (options?.edgeTypeName === undefined) {
                throw new Error(`Illegal connection field "${this.fullName}", edgeTypeName is required`);
            }
            this._connectionType = options.connectionTypeName;
            this._edgeType = options.edgeTypeName;
        } else {
            if (options?.connectionTypeName !== undefined) {
                throw new Error(`Illegal field "${this.fullName}", the collectionTypeName should not be specified`);
            }
            if (options?.edgeTypeName !== undefined) {
                throw new Error(`Illegal field "${this.fullName}", the edgeTypeName should not be specified`);
            }
        }

        if (category === "REFERENCE" || category === "LIST" || category === "CONNECTION") {
            if (options?.targetTypeName === undefined) {
                throw new Error(`Illegal association field "${this.fullName}", targetTypeName is required`);
            }
            this._targetType = options?.targetTypeName;
            this._oppositeField = options?.mappedBy;
            if (this._oppositeField !== undefined) {
                this._passive = true;
                type.schema[" $registerUnresolvedPassiveField"](this);
            }
        } else {
            if (options?.targetTypeName !== undefined) {
                throw new Error(`Illegal id field "${this.fullName}", the targetTypeName should not be specified`);
            }
            if (options?.mappedBy !== undefined) {
                throw new Error(`Illegal id field "${this.fullName}", the mappedBy should not be specified`);
            }
        }
    }

    get isUndefinable(): boolean {
        return this._undefinable;
    }

    get deleteOperation(): "CASCADE" | "SET_UNDEFINED" | undefined {
        return this._deleteOperation;
    }

    get isPassive(): boolean {
        return this._passive;
    }

    get connectionType(): TypeMetadata | undefined {
        if (typeof this._connectionType !== "string") {
            return this._connectionType;
        }
        const connectionMetadata = this.type.schema.typeMap.get(this._connectionType);
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
        const edgeMetadata = this.type.schema.typeMap.get(this._edgeType);
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
        const targetMetadata = this.type.schema.typeMap.get(this._targetType);
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
        this.type.schema[" $resolvedPassiveFields"]();
        return this._oppositeField as FieldMetadata | undefined;
    }

    " $resolvePassiveAssociation"() {
        if (typeof this._oppositeField !== "string") {
            return;
        }
        const targetField = this.targetType!.fieldMap.get(this._oppositeField);
        if (targetField === undefined) {
            throw new Error(`Illegal passive association field ${this.fullName}, it's mapped by "${this._oppositeField}", but there is no such field in the target type "${this.targetType?.name}"`);
        }
        if (targetField.category !== "REFERENCE" && targetField.category !== "LIST" && targetField.category !== "CONNECTION") {
            throw new Error(`Illegal passive association field ${this.fullName}, it's mapped by "${targetField.fullName}" but that field is not assciation`);
        }
        if (targetField._passive) {
            throw new Error(`Illegal passive association field ${this.fullName}, it's mapped by "${targetField.fullName}" but that field is passive too`);
        }
        if (targetField._oppositeField !== undefined) {
            throw new Error(`Illegal passive association field ${this.fullName}, it's mapped by "${targetField.fullName}" but that field is mapped by  another field`);
        }
        this._oppositeField = targetField;
        targetField._oppositeField = this;
    }
}

export type FieldMetadataCategory = "ID" | "REFERENCE" | "LIST" | "CONNECTION"; 

export interface FieldMetadataOptions {
    readonly undefinable?: boolean,
    readonly deleteOperation?: "CASCADE" | "SET_UNDEFINED";
    readonly connectionTypeName?: string;
    readonly edgeTypeName?: string;
    readonly targetTypeName?: string;
    readonly mappedBy?: string;
}