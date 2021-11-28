import { FC, memo } from "react";
import { useStateValue } from "graphql-state";
import { textState } from "./State";
import { ComponentDecorator } from "../../common/ComponentDecorator";

export const OutputView: FC = memo(() => {

    const text = useStateValue(textState);

    return (
        <ComponentDecorator name="OutputView">
            Your input is: {text}
        </ComponentDecorator>
    );
});