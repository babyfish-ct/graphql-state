import { FC, PropsWithChildren } from "react";
import { StateManagerImpl } from "./impl/StateManagerImpl";
import { ReleasePolicy } from "./State";
import { StateManager } from "./StateManager";
export declare const StateManagerProvider: FC<PropsWithChildren<{
    stateManager?: StateManager<any>;
    releasePolicy?: ReleasePolicy;
}>>;
export declare const stateContext: import("react").Context<StateManagerImpl<any> | undefined>;
