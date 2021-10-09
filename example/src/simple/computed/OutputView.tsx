import { FC, memo } from "react";
import { useStateValue } from "graphql-state";
import { ComponentDecorator } from "../../common/ComponentDecorator";
import { factorialXState, totalState } from "./State";

export const OutputView: FC = memo(() => {

    const total = useStateValue(totalState);
    const factorialX = useStateValue(factorialXState);

    return (
        <ComponentDecorator name="OutputView">
            <div>
                x * 2 + x * 3 = {total}
            </div>
            <div>
                x! = {factorialX}
            </div>
        </ComponentDecorator>
    );
});