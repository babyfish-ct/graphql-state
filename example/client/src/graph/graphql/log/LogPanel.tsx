import { Col, Row } from "antd";
import { FC, memo } from "react";
import { HttpLogList } from "../../../common/HttpLogList";
import { EntityLogList } from "./EntityLogList";

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