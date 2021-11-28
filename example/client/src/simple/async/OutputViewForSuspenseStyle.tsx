import { FC, memo } from "react";
import { useStateValue } from "graphql-state";
import { ComponentDecorator } from "../../common/ComponentDecorator";
import { totalState } from "./State";

/*
 * This component must be wrapped by <Suspense/>
 * otherwise, error will be raised.
 */
export const OutputViewForSuspenseStyle: FC = memo(() => {

    const total = useStateValue(totalState);

    return (
        <ComponentDecorator name="OutputViewForSuspenseStyle">
            x * 2 + x * 3 = {total}
        </ComponentDecorator>
    );
});