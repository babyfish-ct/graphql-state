import { css } from "@emotion/css";
import { Col, Row } from "antd";
import { GraphQLNetwork, StateManagerProvider } from "graphql-state";
import { FC, memo } from "react";
import { publishRequestLog, publishResponseLog } from "../../../common/HttpLog";
import { HttpLogList } from "../../../common/HttpLogList";
import { newTypedConfiguration } from "../../__generated_graphql_schema__";
import { Filter } from "./Filter";
import { FilteredData } from "./FilteredData";

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
                <h1>
                    Users can quickly change the query conditions, 
                    but asynchronous requests will be sent out as slowly as possible. 
                    The system guarantees that the last HTTP request uses the parameters entered last time by the user
                </h1>
                <h2 style={{color: "darkblue"}}>Notes</h2>
                This framework work support two API styles for async state
                <ol>
                    <li>
                        <pre className={PSEUDO_CODE_CSS}>{SUSPENSE_STYLE}</pre>
                    </li>
                    <li>
                        <pre className={PSEUDO_CODE_CSS}>{ASYNC_OBJECT_STYLE}</pre>
                    </li>
                </ol>
                <div style={{color: "darkblue"}}>Be careful, only the second style supports peak clipping optimization!</div>
            </div>
            <Row gutter={10}>
                <Col span={12}>
                    <Filter/>
                    <FilteredData/>
                </Col>
                <Col span={12}>
                    <HttpLogList/>
                </Col>
            </Row>
        </StateManagerProvider>
    );
});

const SUSPENSE_STYLE = `
const data = useQuery(someFetcher);
// This style looks like synchronous code, 
// but it needs to be wrapped by <Suspense/> externally
`;

const ASYNC_OBJECT_STYLE = `
const {data, loading, error} = useQuery(someFetcher, {
    asyncStyle: "async-object"
});
// Developers need to deal with the "loading" variable, 
// different values need to correspond to different rendering logic`;

const PSEUDO_CODE_CSS = css({
    padding: "0.5rem 0.5rem 0.5rem 2rem",
    borderLeft: "solid 3px gray",
    backgroundColor: "#fed"
});