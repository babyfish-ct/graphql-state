import { Col, Row, Spin } from "antd";
import { GraphQLNetwork, StateManagerProvider } from "graphql-state";
import { FC, memo, Suspense } from "react";
import { publishRequestLog, publishResponseLog } from "../../../common/HttpLog";
import { HttpLogList } from "../../../common/HttpLogList";
import { newTypedConfiguration } from "../../__generated_graphql_schema__";
import { MultipleBookReferences } from "./MultipleBookReferences";
import { SingleBookReference } from "./SingleBookReference";

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
                There are two ways to query object/objects base on id/ids 
                <ul>
                    <li>Use the hook API useObject/useObjects returned by "makeManagedObjectHooks". (This way is used by this sub demo)</li>
                    <li>Use the method object/objects of the context object in the lambda expression of the asynchronous state declaration</li>
                </ul>
                <p>
                    Object/objects queries base on id/ids are easy to repeat between different UI components, 
                    if not optimized, it will lead to fragmentation of HTTP requests.
                </p>
                <h1>
                    As long as different components query object/objects by same shape, 
                    the id/ids parameters specified by different components will be merged together, 
                    and finally only one batch request will be sent
                </h1>
                <p>
                    For the sake of simplicity, this example hard-codes the id/ids parameters, which may result in not being able to query the data. 
                    You can restart the server to restore data
                </p>
            </div>
            <Row gutter={10}>
                <Col span={12}>
                    <Suspense fallback={<div><Spin/>Loading...</div>}>
                        <SingleBookReference id="a62f7aa3-9490-4612-98b5-98aae0e77120"/>
                        <MultipleBookReferences ids={[
                            "a62f7aa3-9490-4612-98b5-98aae0e77120",
                            "e110c564-23cc-4811-9e81-d587a13db634",
                            "914c8595-35cb-4f67-bbc7-8029e9e6245a"
                        ]}/>
                        <MultipleBookReferences ids={[
                            "914c8595-35cb-4f67-bbc7-8029e9e6245a",
                            "8f30bc8a-49f9-481d-beca-5fe2d147c831"
                        ]}/>
                    </Suspense>
                </Col>
                <Col span={12}>
                    <HttpLogList/>
                </Col>
            </Row>
        </StateManagerProvider>
    ); 
});