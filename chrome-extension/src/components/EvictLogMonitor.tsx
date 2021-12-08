import { FC, memo, useCallback } from "react";
import { Table } from "antd";
import { Log, useLogs } from "./EvictLogProvider";
import { createValueNode } from "../common/value";

export const EvictLogMonitor: FC = memo(() => {

    const logs = useLogs();

    const associationRender = useCallback((log: Log) => {
        return `${log.typeName}.${log.field}`;
    }, []);
    const parameterRender = useCallback((log: Log) => {
        const parameter = log.parameter;
        if (parameter.length <= 20) {
            return parameter;
        }
        return createValueNode(JSON.parse(parameter));
    }, []);

    return (
        <Table rowKey="logId" dataSource={logs} pagination={false}>
            <Table.Column dataIndex="id" title="Owner Id"/>
            <Table.Column title="Assocaition" render={associationRender}/>
            <Table.Column title="Parameter" render={parameterRender}/>
            <Table.Column dataIndex="reason" title="Reason"/>
        </Table>
    );
});
