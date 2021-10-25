import { Col, Row } from "antd";
import { StateManagerProvider } from "graphql-state";
import { FC, memo } from "react";
import { ComponentDecorator } from "../../common/ComponentDecorator";
import { InputView } from "./InputView";
import { OutputView } from "./OutputView";
import { ChildScope } from "./ChildScope";

export const App: FC = memo(() => {
    return (
        <StateManagerProvider>
            <ComponentDecorator name="Global scope">
                <InputView/>
                <OutputView/>
            </ComponentDecorator>
            <Row gutter={10}>
                <Col span={12}>
                    <ChildScope name="LocalScope1">
                        <InputView/>
                        <OutputView/>
                    </ChildScope>
                </Col>
                <Col span={12}>
                    <ChildScope name="LocalScope2">
                        <InputView/>
                        <OutputView/>
                    </ChildScope>
                </Col>
            </Row>
        </StateManagerProvider>
    );
});
