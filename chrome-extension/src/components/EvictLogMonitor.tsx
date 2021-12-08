import { ChangeEvent, FC, memo, ReactNode, useCallback, useMemo, useState } from "react";
import { Button, Col, Input, Row, Space, Table, Form } from "antd";
import { Log, useEvictLogInfo } from "./EvictLogProvider";
import { createParameterNode } from "../common/value";

export const EvictLogMonitor: FC = memo(() => {

    const {logs, deleteLog, clearLogs } = useEvictLogInfo();
    const [filter, setFilter] = useState("");
    const onFilterChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setFilter(e.target.value);
    }, []);

    const timeRender = useCallback((log: Log) => {
        const time = log.time;
        return `${
            time.getFullYear()
        }-${
            time.getMonth() + 1
        }-${
            time.getDate()
        } ${
            time.getHours()
        }:${
            time.getMinutes()
        }:${
            time.getSeconds()
        }`;
    }, []);
    const associationRender = useCallback((log: Log) => {
        return `${log.typeName}.${log.field}`;
    }, []);
    const parameterRender = useCallback((log: Log) => {
        return log.parameter === "" ? "" : "{...}"
    }, []);
    const operationRender = useCallback((log: Log) => {
        return <Button type="link" onClick={() => {deleteLog(log.logId)}}>Delete</Button>
    }, [deleteLog]);

    const filteredLogs = useMemo<Log[]>(() => {
        const finalFilter = filter.trim();
        if (finalFilter === "") {
            return logs;
        }
        return logs.filter(
            log => log.parameter.indexOf(finalFilter) !== -1 || 
            `${log.typeName}.${log.field}`.indexOf(finalFilter) !== -1
        );
    }, [logs, filter]);

    return (
        <Space className="full-width" direction="vertical">
            <Row gutter={10}>
                <Col flex={1}>
                    <Input 
                    value={filter} 
                    onChange={onFilterChange} 
                    placeholder="Filter of association or parameter..."/>
                </Col>
                <Col>
                    <Button onClick={clearLogs}>Clear</Button>
                </Col>
            </Row>
            <Table 
            rowKey="logId" 
            dataSource={filteredLogs} 
            pagination={false}
            expandable={
                { expandedRowRender: log => <ExpandedRow log={log}/>}
            }>
                <Table.Column title="Time" render={timeRender}/>
                <Table.Column title="Assocaition" render={associationRender}/>
                <Table.Column title="Parameter" render={parameterRender}/>
                <Table.Column title="Operation" render={operationRender}/>
            </Table>
        </Space>
    );
});

const ExpandedRow: FC<{
    readonly log: Log
}> = memo(({log}) => {
    return (
        <div>
            
            {
                log.typeName !== "Query" &&
                <>
                    <div className="log-head">ObjectId</div>
                    <div className="log-body">{log.id}</div>
                </>
            }
            
            {
                log.parameter !== "" && <>
                    <div className="log-head">Parameter</div>
                    <div className="log-body">{createParameterNode(log.parameter)}</div>
                </>
            }
            
            <div className="log-head">Reason</div>
            <div className="log-body">{reason(log)}</div>

            <div className="log-head">Optimization solution</div>
            <div className="log-body">{optimization(log)}</div>
        </div>
    );
});

function reason(log: Log): ReactNode {
    switch (log.reason) {
        case "no-contains":
            return <div>
                <span className="important">"assocaitionProperties.contains"</span>
                is not specified for
                <span className="important">"{log.typeName}.{log.field}"</span>
            </div>;
        case "no-range":
            return <div>
                <span className="important">"assocaitionProperties.range"</span>
                is not specified for
                <span className="important">"{log.typeName}.{log.field}"</span>
            </div>;
        case "contains-returns-undefined":
            return <div>
                <span className="important">"assocaitionProperties.contains"</span>
                of
                <span className="important">"{log.typeName}.{log.field}"</span>
                returns undefined
            </div>;
        case "position-returns-undefined":
            return <div>
                <span className="important">"assocaitionProperties.position"</span>
                of
                <span className="important">"{log.typeName}.{log.field}"</span>
                returns undefined
            </div>;
        case "page-style-pagination":
            return <div>
                <span className="important">"{log.typeName}.{log.field}"</span> is
                a pagination connection whose style is 
                <span className="important">"page"</span>
            </div>;
        case "forward-tail":
            return <div>
                <span className="important">"{log.typeName}.{log.field}"</span> is
                a pagination connection whose style is 
                <span className="important">"forward"</span> and
                its <span className="important">"hasNextPage"</span> is true,
                so adding new element to the <span className="important">tail</span> causes cache evict.
            </div>;
        case "backward-head":
            return <div>
                <span className="important">"{log.typeName}.{log.field}"</span> is
                a pagination connection whose style is 
                <span className="important">"backward"</span> and
                its <span className="important">"hasPreviousPage"</span> is true,
                so adding new element to the <span className="important">head</span> causes cache evict.
            </div>;
        case "unknown-owner":
            return <div>
                Unable to determine whether the saved object belongs to the current association.
            </div>;
    }
}

function optimization(log: Log): ReactNode {
    switch (log.reason) {
        case "no-contains":
            return "Please specify that function";
        case "no-range":
            return "Please spscify that function";
        case "contains-returns-undefined":
            return "Try to make that function not return undefined";
        case "position-returns-undefined":
            return "Try to make that function not return undefined";
        case "page-style-pagination":
            return <span className="impossible">This scenario cannot be optimized</span>;
        case "forward-tail":
            return <span className="impossible">This scenario cannot be optimized</span>;
        case "backward-head":
            return <span className="impossible">This scenario cannot be optimized</span>;
        case "unknown-owner":
            return <span className="impossible">This scenario cannot be optimized</span>;
    }
}