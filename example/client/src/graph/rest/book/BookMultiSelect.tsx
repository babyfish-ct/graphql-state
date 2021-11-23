import { FC, memo } from "react";
import { Select, Spin } from "antd";
import { useQuery } from "graphql-state";
import { query$, bookConnection$, bookEdge$, book$ } from "../../__generated_rest_schema__/fetchers";

export const BookMultiSelect: FC<{
    value?: string[],
    onChange?: (value: string[]) => void
}> = memo(({value, onChange}) => {

    const { data, loading, error } = useQuery(
        query$.findBooks(
            bookConnection$.edges(
                bookEdge$.node(
                    book$.id.name,
                )
            ),
            options => options.alias("conn")
        ),
        { 
            asyncStyle: "async-object",
            releasePolicy: () => 3600_000
        }
    );

    return (
        <>
            { error && <div>Failed to load options</div> }
            { loading && <><Spin/>Loading options...</> }
            {
                data && <Select mode="multiple" value={value ?? []} onChange={onChange}>
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