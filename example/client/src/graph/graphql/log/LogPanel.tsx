import { Col, Row } from "antd";
import { FC, memo } from "react";
import { EntityLogList } from "./EntityLogList";
import { HttpLogList } from "./HttpLogList";

export const LogPanel: FC = memo(() => {
    return (
        <Row gutter={10}>
            <Col span={12}>
                <EntityLogList/>
            </Col>
            <Col span={12}>
                <HttpLogList/>
            </Col>
        </Row>
    );
});