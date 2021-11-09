import { FieldMetadata } from "../meta/impl/FieldMetadata";
import { SpaceSavingMap } from "../state/impl/SpaceSavingMap";
import { Record } from "./Record";
import { VariableArgs } from "../state/impl/Args";

export class BackReferences {

    // objecs that associate to me
    private associationOwnerMap = new SpaceSavingMap<FieldMetadata, SpaceSavingMap<string | undefined, ParameterizedRecordSet>>();

    add(associationField: FieldMetadata, args: VariableArgs | undefined, ownerRecord: Record) {
        this
        .associationOwnerMap
        .computeIfAbsent(associationField, () => new SpaceSavingMap<string, ParameterizedRecordSet>())
        .computeIfAbsent(args?.key, () => new ParameterizedRecordSet(args))
        .add(ownerRecord);
    }

    remove(associationField: FieldMetadata, args: VariableArgs | undefined, ownerRecord: Record) {
        const subMap = this.associationOwnerMap.get(associationField);
        if (subMap !== undefined) {
            const set = subMap?.get(args?.key);
            if (set !== undefined) {
                set.remove(ownerRecord);
                if (set.isEmtpty) {
                    subMap.remove(args?.key);
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
                    callback(field, set.args, record);
                });
            });
        });
    }
}

class ParameterizedRecordSet {

    private records = new Set<Record>();

    constructor(readonly args?: VariableArgs) {}

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

type BackReferencesCallback = (field: FieldMetadata, args: VariableArgs | undefined, ownerRecord: Record) => void;