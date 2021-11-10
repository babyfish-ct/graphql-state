import { FC, PropsWithChildren } from "react";
import { StateManagerImpl } from "./impl/StateManagerImpl";
import { StateManager } from "./StateManager";
import { ReleasePolicy } from "./Types";
export declare const StateManagerProvider: FC<PropsWithChildren<{
    stateManager?: StateManager<any>;
    releasePolicy?: ReleasePolicy;
}>>;
export declare const stateContext: import("react").Context<StateManagerImpl<any> | undefined>;
