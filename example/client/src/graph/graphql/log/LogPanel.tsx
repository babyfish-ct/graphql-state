import { Col, Row } from "antd";
import { FC, memo } from "react";
import { HttpLogList } from "./HttpLogList";

export const LogPanel: FC = memo(() => {
    return (
        <Row gutter={10}>
            <Col span={12}>
                
            </Col>
            <Col span={12}>
                <HttpLogList/>
            </Col>
        </Row>
    );
});