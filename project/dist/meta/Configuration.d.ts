import { StateManager } from "../state/StateManager";
import { ScheamType } from "./SchemaType";
export interface Configuration<TSchema extends ScheamType> {
    buildStateManager(): StateManager<TSchema>;
}
