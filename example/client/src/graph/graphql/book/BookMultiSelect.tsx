import { FC, memo } from "react";
import { Select, Spin } from "antd";
import { book$$, bookConnection$, bookEdge$, query$ } from "../__generated/fetchers";
import { useQuery } from "graphql-state";

export const BookMultiSelect: FC<{
    value?: string[],
    onChange?: (value: string[]) => void
}> = memo(({value, onChange}) => {

    const { data, loading, error } = useQuery(
        query$.findBooks(
            bookConnection$.edges(
                bookEdge$.node(
                    book$$,
                )
            ),
            options => options.alias("bookConnection")
        ), {
        asyncStyle: "ASYNC_OBJECT"
    });

    return (
        <>
            {
                loading && <div>
                    <Spin/>Loading book options...
                </div>
            }
            {
                data &&
                <Select mode="multiple" value={value ?? []} onChange={onChange}>
                    {
                        data.bookConnection.edges.map(edge =>
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