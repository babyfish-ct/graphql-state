import { FieldMetadata } from "../meta/impl/FieldMetadata";
import { Record } from "./Record";
export declare class BackReferences {
    private associationOwnerMap;
    add(associationField: FieldMetadata, variablesCode: string | undefined, variables: any, ownerRecord: Record): void;
    remove(associationField: FieldMetadata, variablesCode: string | undefined, ownerRecord: Record): void;
    forEach(callback: BackReferencesCallback): void;
}
declare type BackReferencesCallback = (field: FieldMetadata, variables: any, ownerRecord: Record) => void;
export {};
