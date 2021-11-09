import { FieldMetadata } from "../meta/impl/FieldMetadata";
import { Record } from "./Record";
import { VariableArgs } from "../state/impl/Args";
export declare class BackReferences {
    private associationOwnerMap;
    add(associationField: FieldMetadata, args: VariableArgs | undefined, ownerRecord: Record): void;
    remove(associationField: FieldMetadata, args: VariableArgs | undefined, ownerRecord: Record): void;
    forEach(callback: BackReferencesCallback): void;
}
declare type BackReferencesCallback = (field: FieldMetadata, args: VariableArgs | undefined, ownerRecord: Record) => void;
export {};
