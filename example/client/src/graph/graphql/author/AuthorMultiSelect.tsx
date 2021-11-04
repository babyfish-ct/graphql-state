import { FC, memo } from "react";
import { Select, Spin } from "antd";
import { useQuery } from "graphql-state";
import { query$, authorConnection$, authorEdge$, author$ } from "../../__generated_graphql_schema__/fetchers";

export const AuthorMultiSelect: FC<{
    value?: string[],
    onChange?: (value: string[]) => void
}> = memo(({value, onChange}) => {

    const { data, loading, error } = useQuery(
        query$.findAuthors(
            authorConnection$.edges(
                authorEdge$.node(
                    author$.id.name,
                )
            ),
            options => options.alias("conn")
        ), 
        {asyncStyle: "async-object"}
    );

    return (
        <>
            { error && <div>Failed to load options</div> }
            { loading && <><Spin/>Loading options...</> }
            {
                data && <Select mode="multiple" value={value === undefined ? [] : value} onChange={onChange}>
                    {
                        data.conn.edges.map(edge => 
                            <Select.Option key={edge.node.id} value={edge.node.id}>
                                {edge.node.name}
                            </Select.Option>
                        )
                    }
                </Select>
            }
        </>
    );
});