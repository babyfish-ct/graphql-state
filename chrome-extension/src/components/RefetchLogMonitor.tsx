import { FC, memo, useCallback } from "react";
import { Table } from "antd";
import { Log, useLogs } from "./RefetchLogProvider";
import { createValueNode } from "../common/value";

export const RefetchLogMonitor: FC = memo(() => {

    const logs = useLogs();

    const parameterRender = useCallback((log: Log) => {
        const parameter = log.parameter;
        if (parameter.length <= 20) {
            return parameter;
        }
        return createValueNode(JSON.parse(parameter));
    }, []);

    return (
        <Table rowKey="logId" dataSource={logs} pagination={false}>
            <Table.Column dataIndex="typeName" title="Type"/>
            <Table.Column dataIndex="id" title="Id"/>
            <Table.Column dataIndex="field" title="Field"/>
            <Table.Column title="Parameter" render={parameterRender}/>
            <Table.Column dataIndex="reason" title="Reason"/>
        </Table>
    );
});
