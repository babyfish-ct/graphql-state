import { css } from "@emotion/css";
import { Timeline, Card, Button, Collapse, Spin, Space } from "antd";
import { EntityChangeEvent, EntityEvictEvent, useStateAccessor } from "graphql-state";
import { FC, memo, ReactNode, useCallback } from "react";
import { LOG_LABEL_CLASS, LOG_VALUE_CLASS } from "../Css";
import { entityLogListState } from "./EntityLog";
import { format } from "./util";

export const EntityLogList: FC = memo(() => {

    const logs = useStateAccessor(entityLogListState);

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
                            <Collapse>
                                <Collapse.Panel 
                                header={
                                    <>
                                        {format(log.time)},&nbsp;
                                        {
                                            log.event.eventType === "evict" && <>{
                                                log.event.evictedType === "row" ?
                                                `evict whole object of "${log.event.typeName}"` :
                                                `evict some fields of "${log.event.typeName}"`
                                            }</>
                                        }
                                        {
                                            log.event.eventType === "change" && <>
                                                {log.event.changedType} {log.event.typeName}
                                            </>
                                        }
                                    </>
                                } 
                                key="message">
                                    { 
                                        log.event.eventType === "evict" ?
                                        <EntityEvictDetail event={log.event}/> :
                                        <EntityChangeDetail event={log.event}/>
                                     }
                                </Collapse.Panel>
                            </Collapse>
                        </Timeline.Item>
                    )
                }
            </Timeline>
        </Card>
    );
});

const EntityEvictDetail: FC<{
    event: EntityEvictEvent
}> = memo(({event}) => {
    return (
        <Space direction="vertical" style={{width: "100%"}}>
            {
                event.evictedKeys.map(key => {
                    return (
                        <Card 
                        size="small"
                        key={JSON.stringify(key)}
                        title={typeof key === "string" ? key : `${key.name}(${JSON.stringify(key.variables)})`}>
                            <div>Evicted Value</div>
                            <div className={LOG_VALUE_CLASS}>{valueNode(event.evictedValue(key))}</div>
                        </Card>
                    );
                })
            }
        </Space>
    );
});

const EntityChangeDetail: FC<{
    event: EntityChangeEvent
}> = memo(({event}) => {
    return (
        <Space direction="vertical" style={{width: "100%"}}>
            {
                event.changedKeys.map(key => {
                    return (
                        <Card 
                        size="small"
                        key={JSON.stringify(key)}
                        title={typeof key === "string" ? key : `${key.name}(${JSON.stringify(key.variables)})`}>
                            <div>Old Value</div>
                            <div className={LOG_VALUE_CLASS}>{valueNode(event.oldValue(key))}</div>
                            <div>New Value</div>
                            <div className={LOG_VALUE_CLASS}>{valueNode(event.newValue(key))}</div>
                        </Card>
                    );
                })
            }
        </Space>
    );
});

function valueNode(value: any): ReactNode {
    if (Array.isArray(value)) {
        return (
            <ul>
                {value.map((element, index) => <li key={index}>{valueNode(element)}</li>)}
            </ul>
        );
    }
    if (value === undefined || value === null) {
        return "undefined";
    }
    return JSON.stringify(value);
}

const DETAIL_TABLE_CSS = css({
    borderCollapse: "collapse",
    "& thead": {
        backgroundColor: "#eef",
        fontWeight: "bold",
        whiteSpace: "nowrap"
    },
    "& td": {
        border: "solid 1px lightgray"
    }
});