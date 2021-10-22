import { FC, memo } from "react";
import { Select, Spin } from "antd";
import { useQuery } from "graphql-state";
import { author$$, authorConnection$, authorEdge$, query$ } from "../__generated/fetchers";

export const AuthorMultiSelect: FC<{
    value?: string[],
    onChange?: (value: string[]) => void
}> = memo(({value, onChange}) => {

    const { data, loading, error } = useQuery(
        query$.findAuthors(
            authorConnection$.edges(
                authorEdge$.node(
                    author$$
                )
            ),
            options => options.alias("conn")
        ),
        { asyncStyle: "ASYNC_OBJECT" }
    );

    return (
        <>
            { error && <div>Failed to load options</div> }
            { loading && <><Spin/>Loading options...</> }
            {
                data && <Select mode="multiple" value={value === undefined ? [] : value} onChange={onChange}>
                    {
                        data.conn.edges.map(edge => 
                            <Select.Option key={edge.node.id} value={edge.node.id}>{edge.node.name}</Select.Option>
                        )
                    }
                </Select>
            }
        </>
    );
});