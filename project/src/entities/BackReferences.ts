import { FieldMetadata } from "../meta/impl/FieldMetadata";
import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { SpaceSavingMap } from "../state/impl/SpaceSavingMap";
import { Record } from "./Record";

export class BackReferences {

    // objecs that associate to me
    private associationOwnerMap = new SpaceSavingMap<FieldMetadata, SpaceSavingMap<string | undefined, ParameterizedRecordSet>>();

    add(associationField: FieldMetadata, variablesCode: string | undefined, variables: any, ownerRecord: Record) {
        console.log(`Add back referance for assocaition ${associationField.fullName}`)
        this
        .associationOwnerMap
        .computeIfAbsent(associationField, () => new SpaceSavingMap<string, ParameterizedRecordSet>())
        .computeIfAbsent(variablesCode, () => new ParameterizedRecordSet(variables))
        .add(ownerRecord);
    }

    remove(associationField: FieldMetadata, variablesCode: string | undefined, ownerRecord: Record) {
        console.log(`Remove back referance for assocaition ${associationField.fullName}`)
        const subMap = this.associationOwnerMap.get(associationField);
        if (subMap !== undefined) {
            const set = subMap?.get(variablesCode);
            if (set !== undefined) {
                set.remove(ownerRecord);
                if (set.isEmtpty) {
                    subMap.remove(variablesCode);
                    if (subMap.isEmpty) {
                        this.associationOwnerMap.remove(associationField);
                    }
                }
            }
        }
    }

    forEach(callback: BackReferencesCallback) {
        this.associationOwnerMap.forEach((field, subMap) => {
            subMap.forEachValue(set => {
                set.forEach(record => {
                    callback(field, set.variables, record);
                });
            });
        });
    }
}

class ParameterizedRecordSet {

    private records = new Set<Record>();

    constructor(readonly variables: any) {}

    add(record: Record) {
        this.records.add(record);
    }

    remove(record: Record) {
        this.records.delete(record);
    }

    get isEmtpty(): boolean {
        return this.records.size === 0;
    }

    forEach(callback: (record: Record) => void) {
        for (const record of this.records) {
            callback(record);
        }
    }
}

type BackReferencesCallback = (field: FieldMetadata, variables: any, ownerRecord: Record) => void;