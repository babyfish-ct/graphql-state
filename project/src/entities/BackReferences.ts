import { FieldMetadata } from "../meta/impl/FieldMetadata";
import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { SpaceSavingMap } from "../state/impl/SpaceSavingMap";
import { Record } from "./Record";

export class BackReferences {

    // objecs that associate to me
    private associationOwnerMap = new SpaceSavingMap<FieldMetadata, Set<Record>>();

    add(associationField: FieldMetadata, ownerRecord: Record) {
        console.log(`Add back referance for assocaition ${associationField.fullName}`)
        this
        .associationOwnerMap
        .computeIfAbsent(associationField, () => new Set<Record>())
        .add(ownerRecord);
    }

    remove(associationField: FieldMetadata, ownerRecord: Record) {
        console.log(`Remove back referance for assocaition ${associationField.fullName}`)
        this.associationOwnerMap.get(associationField)?.delete(ownerRecord);
    }

    forEach(callback: BackReferencesCallback) {
        this.associationOwnerMap.forEach((field, recordSet) => {
            for (const onwerRecord of recordSet) {
                callback(field, onwerRecord);
            }
        });
    }
}

type BackReferencesCallback = (field: FieldMetadata, ownerRecord: Record) => void;