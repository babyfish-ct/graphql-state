import { InputNumber } from "antd";
import { FC, memo } from "react";
import { useStateAccessor } from "graphql-state";
import { ComponentDecorator } from "../../common/ComponentDecorator";

import { xState } from "./State";

export const InputView:FC = memo(() => {

    const x = useStateAccessor(xState);

    return (
        <ComponentDecorator name="InputView">
            x = 
            <InputNumber value={x()} onChange={x} min={0} max={100}/>
        </ComponentDecorator>
    );
});