import { FC, PropsWithChildren } from "react";
import { StateManager } from "./StateManager";
export declare const StateManagerProvider: FC<PropsWithChildren<{
    manager: StateManager<any>;
}>>;
export declare const stateContext: import("react").Context<StateManager<any> | undefined>;
