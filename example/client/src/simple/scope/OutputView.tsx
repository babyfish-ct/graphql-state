import { Space } from "antd";
import { useStateValue } from "graphql-state";
import { FC, memo } from "react";
import { ComponentDecorator } from "../../common/ComponentDecorator";
import { xState } from "./State";
import { yState } from "./State";

export const OutputView: FC = memo(() => {
    const x = useStateValue(xState);
    const localY = useStateValue(yState, {
        scope: "local"
    });
    return (
        <ComponentDecorator name="OutputView">
            <Space direction="vertical" style={{width: "100%"}}>
                <div>
                    x: {x}
                </div>
                <div>
                    localY: {localY}
                </div>
            </Space>
        </ComponentDecorator>
    );
});