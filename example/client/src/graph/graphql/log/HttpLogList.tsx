import { Timeline, Card, Button } from "antd";
import { useStateAccessor } from "graphql-state";
import { FC, memo, useCallback } from "react";
import { httpLogListState } from "./HttpLog";
import { format } from "./util";

export const HttpLogList: FC = memo(() => {

    const logs = useStateAccessor(httpLogListState);

    const onClearClick = useCallback(() => {
        logs([]);
    }, [logs]);

    return (
        <Card 
        title="Http request logs" 
        extra={
            <Button type="link" onClick={onClearClick}>Clear</Button>
        }>
            <Timeline reverse={true} mode="left">
                {
                    logs().map(log =>
                        <Timeline.Item key={log.id}>
                            <div>
                                {format(log.time)}
                                <div>Body</div>
                                <pre>{log.body}</pre>
                                <div>Variables</div>
                                <pre>{JSON.stringify(log.variables)}</pre>
                                <div>Response</div>
                                <pre>{
                                    typeof log.response === "string" ?
                                    log.response :
                                    JSON.stringify(log.response, undefined, "    ")
                                }</pre>
                            </div>
                        </Timeline.Item>
                    )
                }
            </Timeline>
        </Card>
    );
});