import { css } from "@emotion/css";
import { Timeline, Card, Button, Collapse } from "antd";
import { EntityChangeEvent, EntityEvictEvent, useStateAccessor } from "graphql-state";
import { FC, memo, useCallback } from "react";
import { entityLogListState } from "./EntityLog";
import { format } from "../../common/util";
import { CSSProperties } from "react";
import { RawValueView } from "../../../common/RawValueView";

export const EntityLogList: FC = memo(() => {

    const logs = useStateAccessor(entityLogListState);

    const onClearClick = useCallback(() => {
        logs([]);
    }, [logs]);

    return (
        <Card 
        title="Local entity manager logs" 
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
                                            log.event.eventType === "evict" && <>
                                                evict {log.event.typeName}
                                            </>
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
        <table className={DETAIL_TABLE_CSS}>
            <thead>
                <tr>
                    <td className={LABEL_CLASS}>Object Type:</td>
                    <td>{event.typeName}</td>
                </tr>
                <tr>
                    <td className={LABEL_CLASS}>Object ID:</td>
                    <td>{event.id}</td>
                </tr>
                <tr>
                    <td className={LABEL_CLASS}>Event Type:</td>
                    <td>{event.evictedType === 'row' ? "evict object": "evict fields"}</td>
                </tr>
            </thead>
            {
                event.evictedKeys.map((evictedKey,index) => {
                    const fieldKey = typeof evictedKey === "string" ?
                        evictedKey :
                        `${evictedKey.name}(${JSON.stringify(evictedKey.variables)})`
                    ;
                    return <tbody key={fieldKey} className={index % 2 === 0 ? "even" : "odd"}>
                        <tr>
                            <td className={LABEL_CLASS} style={NO_BOTTOM_BODER}>Field:</td>
                            <td>{fieldKey}</td>
                        </tr>
                        <tr>
                            <td className={LABEL_CLASS} style={NO_TOP_BODER}>New Value:</td>
                            <td>
                                <RawValueView value={event.evictedValue(evictedKey)}/>
                            </td>
                        </tr>
                    </tbody>
                    }
                )
            }
        </table>
    );
});

const EntityChangeDetail: FC<{
    event: EntityChangeEvent
}> = memo(({event}) => {
    return (
        <table className={DETAIL_TABLE_CSS}>
            <thead>
                <tr>
                    <td className={LABEL_CLASS}>Object Type:</td>
                    <td>{event.typeName}</td>
                </tr>
                <tr>
                    <td className={LABEL_CLASS}>Object ID:</td>
                    <td>{event.id}</td>
                </tr>
                <tr>
                    <td className={LABEL_CLASS}>Event Type:</td>
                    <td>{event.changedType}</td>
                </tr>
            </thead>
            {
                event.changedKeys.map((changedKey,index) => {
                    const fieldKey = typeof changedKey === "string" ?
                        changedKey :
                        `${changedKey.name}(${JSON.stringify(changedKey.variables)})`
                    ;
                    return <tbody key={fieldKey} className={index % 2 === 0 ? "even" : "odd"}>
                        <tr>
                            <td className={LABEL_CLASS} style={NO_BOTTOM_BODER}>Field:</td>
                            <td>{fieldKey}</td>
                        </tr>
                        {
                            event.changedType !== "insert" && <tr>
                                <td className={LABEL_CLASS} style={NO_HORIZONTAL_BODER}>Old Value:</td>
                                <td>
                                    <RawValueView value={event.oldValue(changedKey)}/>
                                </td>
                            </tr>
                        }
                        {
                            event.changedType !== "delete" && <tr>
                                <td className={LABEL_CLASS} style={NO_TOP_BODER}>New Value:</td>
                                <td>
                                    <RawValueView value={event.newValue(changedKey)}/>
                                </td>
                            </tr>
                        }
                    </tbody>
                    }
                )
            }
        </table>
    );
});

const DETAIL_TABLE_CSS = css({
    borderCollapse: "collapse",
    "& thead": {
        backgroundColor: "lightblue"
    },
    "& tbody.odd": { //it looks like tht pseudo class "tbody:odd" is not supported by "@emotion/css"
        backgroundColor: "#fed"
    },
    "& tbody.even": { //it looks like tht pseudo class "tbody:odd" is not supported by "@emotion/css"
        backgroundColor: "#efd"
    },
    "& td": {
        border: "solid 1px black",
        padding: "2px"
    }
});

const LABEL_CLASS = css({
    fontWeight: "bold",
    textAlign: "right"
});

const NO_TOP_BODER: CSSProperties = {
    borderTopStyle: "none"
};

const NO_BOTTOM_BODER: CSSProperties = {
    borderBottomStyle: "none"
};

const NO_HORIZONTAL_BODER: CSSProperties = {
    borderTopStyle: "none",
    borderBottomStyle: "none"
};
