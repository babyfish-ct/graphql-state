import { Button, Space } from "antd";
import { useStateAccessor } from "graphql-state";
import { FC, memo, useCallback } from "react";
import { ComponentDecorator } from "../../common/ComponentDecorator";
import { xState } from "./State";
import { yState } from "./State";

export const InputView: FC = memo(() => {

    const x = useStateAccessor(xState);
    const localY = useStateAccessor(yState, {
        scope: "local"
    });

    const onIncreaseX = useCallback(() => {
        x(x() + 1);
    }, [x]);

    const onIncreaseY = useCallback(() => {
        localY(localY() + 1);
    }, [localY]);

    return (
        <ComponentDecorator name="InputView">
            <Space direction="vertical" style={{width: "100%"}}>
                <Space>
                    <div>x: {x()}</div>
                    <Button onClick={onIncreaseX}>Increase X</Button>
                </Space>
                <Space>
                    <div>localY: {localY()}</div>
                    <Button onClick={onIncreaseY}>Increase Local Y</Button>
                </Space>
            </Space>
        </ComponentDecorator>
    );
});