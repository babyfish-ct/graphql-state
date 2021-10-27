import { GraphQLNetwork, StateManagerProvider } from "graphql-state";
import { FC, memo } from "react";
import { newTypedConfiguration } from "../../__generated_graphql_schema__";
import { BiggestShape } from "./BiggestShape";
import { SmallestShape } from "./SmallestShape";
import { MiddleShape } from "./MiddleShape";
import { Col, Row } from "antd";
import { publishRequestLog, publishResponseLog } from "../../../common/HttpLog";
import { HttpLogList } from "../../../common/HttpLogList";
import { Filter } from "./Filter";

const stateManager = 
    newTypedConfiguration()
    .network(new GraphQLNetwork(async(body, variables) => {
        const id = publishRequestLog(body, variables);
        const response = await fetch('http://localhost:8081/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: body,
                variables,
            }),
        }); 
        const json = await response.json();
        publishResponseLog(id, json);
        return json;
    }))
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