import { Col, Row } from "antd";
import { GraphQLNetwork, StateManagerProvider } from "graphql-state";
import { FC, memo } from "react";
import { publishRequestLog, publishResponseLog } from "../../../common/HttpLog";
import { HttpLogList } from "../../../common/HttpLogList";
import { newTypedConfiguration } from "../../__generated_graphql_schema__";
import { BiggerShape } from "./BiggerShape";
import { DelayedSmallerShape } from "./DelayedSmallerShape";
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
            <div style={{padding: "1rem"}}>
                <h3>
                    <p>
                        Before attempting to send an HTTP request, first check whether there is a query that 
                        has been sent but has not yet received the response, 
                        its variables must be the same as the current query and 
                        its shape must include the shape of the current query.</p>
                    <p>
                        If there is such a pending request, borrow its HTTP request and share the response
                    </p>
                </h3>
                <p>
                    Be different with <a href="./mergeDifferentShapes">previous demo about marging queries of different shape</a>,
                    the HTTP request of reused query of this demo has been sent. 
                </p>
            </div>
            <Row gutter={10}>
                <Col span={12}>
                    <Filter/>
                    <BiggerShape/>
                    <DelayedSmallerShape/>
                </Col>
                <Col span={12}>
                    <HttpLogList/>
                </Col>
            </Row>
        </StateManagerProvider>
    );
});