import { ChangeEvent, memo, useCallback, useState } from "react";
import { Button, Input, Space, Spin, Table } from "antd";
import { ComponentDecorator } from "../../../common/ComponentDecorator";
import { useQuery } from "graphql-state";
import { book$$, bookStore$$, query$ } from "../__generated/fetchers";

const BOOK_STORE_ROW =
    bookStore$$
    .books(
        book$$
    )
;

export const BookStoreList = memo(() => {

    const [name, setName] = useState<string>();
    const { data, loading } = useQuery(
        query$.findBooksStores(BOOK_STORE_ROW, options => options.alias("stores")),
        {
            asyncStyle: "ASYNC_OBJECT",
            variables: { name }
        }
    );

    const onNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.trim();
        setName(value === "" ? undefined : value);
    }, []);

    const onAddClick = useCallback(() => {
    }, []);

    return (
        <ComponentDecorator name="BookStoreList">
            <Space direction="vertical" style={{width: "100%"}}>
                <Input value={name} onChange={onNameChange} placeholder="Input name to filter rows..."/>
                { loading && <div><Spin/>Loading book stores</div>}
                {
                    !loading && data.stores &&
                    <>
                        <Table rowKey="id" dataSource={data.stores} pagination={false}>
                            <Table.Column title="Name" dataIndex="name"/>
                        </Table>
                        <Button onClick={onAddClick}>Add BookStore</Button>
                    </>
                }
            </Space>
        </ComponentDecorator>
    );
});