import { StateManagerProvider } from "graphql-state";
import { FC, memo } from "react";
import { newTypedConfiguration } from "../../__generated_graphql_schema__";
import { BiggestShape } from "./BiggestShape";
import { SmallestShape } from "./SmallestShape";
import { MiddleShape } from "./MiddleShape";
import { Col, Row } from "antd";
import { HttpLogList } from "../../common/HttpLogList";
import { Filter } from "./Filter";
import { createGraphQLNetwork } from "../../common/Networks";

const stateManager = 
    newTypedConfiguration()
    .network(createGraphQLNetwork())
    .buildStateManager()
;

export const App: FC = memo(() => {
    return (
        <StateManagerProvider stateManager={stateManager}>
            <h1 style={{padding: "1rem"}}>
                For multiple queries with the same variables but different shapes, 
                queries with smaller shapes will not send out HTTP requests, 
                they will borrow the HTTP request of the query with the largest shape.
            </h1>
            <Row gutter={10}>
                <Col span={12}>
                    <Filter/>
                    <SmallestShape/>
                    <BiggestShape/>
                    <MiddleShape/>
                </Col>
                <Col span={12}>
                    <HttpLogList/>
                </Col>
            </Row>
        </StateManagerProvider>
    );
});