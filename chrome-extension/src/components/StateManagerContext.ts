import { createContext, useContext } from "react";

const stateManagerIdContext = createContext<string>("");

export function useStateManagerId(): string {
    return useContext(stateManagerIdContext);
}

export const StateManagerIdContextProvider = stateManagerIdContext.Provider;