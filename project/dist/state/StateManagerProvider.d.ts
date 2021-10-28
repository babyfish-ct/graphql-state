import { FC, PropsWithChildren } from "react";
import { StateManagerImpl } from "./impl/StateManagerImpl";
import { StateManager } from "./StateManager";
export declare const StateManagerProvider: FC<PropsWithChildren<{
    stateManager?: StateManager<any>;
}>>;
export declare const stateContext: import("react").Context<StateManagerImpl<any> | undefined>;
