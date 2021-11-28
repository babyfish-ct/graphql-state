import { StateScope } from "graphql-state";
import { FC, memo, PropsWithChildren } from "react";
import { ComponentDecorator } from "../../common/ComponentDecorator";

export const ChildScope: FC<
    PropsWithChildren<{
        readonly name: string
    }>
> = memo(({name, children}) => {
    return (
        <ComponentDecorator name={`scope(${name})`}>
            <StateScope name={name}>
                {children}
            </StateScope>
        </ComponentDecorator>
    );
});