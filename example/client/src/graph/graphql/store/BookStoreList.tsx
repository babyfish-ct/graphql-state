import { memo, useCallback } from "react";
import { Button, Space, Table } from "antd";
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

    const { stores } = useQuery(
        query$.findBooksStores(BOOK_STORE_ROW, options => options.alias("stores"))
    );

    const onAddClick = useCallback(() => {
    }, []);

    return (
        <ComponentDecorator name="BookStoreList">
            <Space direction="vertical" style={{width: "100%"}}>
                <Table rowKey="id" dataSource={stores} pagination={false}>
                    <Table.Column title="Name" dataIndex="name"/>
                </Table>
                <Button onClick={onAddClick}>Add BookStore</Button>
            </Space>
        </ComponentDecorator>
    );
});