import { createContext, FC, memo, PropsWithChildren, useContext } from "react";

export const StateScope: FC<
    PropsWithChildren<{
        readonly name: string
    }>
> = memo(({name, children}) => {
    
    const path = useContext(pathContext) ?? "";

    return (
        <pathContext.Provider value={`${path}/${name}`}>
            {children}
        </pathContext.Provider>
    );
});

export function useScopePath(): string {
    return useContext(pathContext) ?? "/";
}

const pathContext = createContext<string | undefined>(undefined);