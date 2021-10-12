import { Button, Space, Table, Tag } from "antd";
import { useStateValue } from "graphql-state";
import { ModelType } from "graphql-ts-client-api";
import { FC, memo, useCallback, useState } from "react";
import { ComponentDecorator } from "../../../common/ComponentDecorator";
import { book$$, bookStore$$ } from "../../../__generated/fetchers";
import { stateManager } from "../App";
import { bookStoreIdListState } from "../State";
import { useObjects } from "../TypedHook";
import { BookStoreDialog } from "./BookStoreDialog";

const BOOK_STORE_ROW = 
    bookStore$$
    .books(
        book$$
    )
;

export const BookStoreList: FC = memo(() => {

    const storeIds = useStateValue(bookStoreIdListState);
    const stores = useObjects(BOOK_STORE_ROW, storeIds);
    const [dialog, setDialog] = useState<"NEW" | "EDIT">();
    const [editing, setEditing] = useState<ModelType<typeof BOOK_STORE_ROW>>();

    const renderBooks = useCallback((_: any, row: ModelType<typeof BOOK_STORE_ROW>) => {
        return (
            <>
                {
                    row.books.map(book => 
                        <Tag key={book.id}>{book.name}</Tag>
                    )
                }
            </>
        );
    }, []);

    const renderOperations = useCallback((_: any, row: ModelType<typeof BOOK_STORE_ROW>) => {
        return (
            <Button.Group>
                <Button onClick={() => {setDialog("EDIT"); setEditing(row); }}>Edit</Button>
                <Button onClick={()=> stateManager.delete("BookStore", row.id)}>Delete</Button>
            </Button.Group>
        );
    }, []);

    const onAddClick = useCallback(() => {
        setDialog("NEW");
    }, []);

    const onDialogClose = useCallback(() => {
        setDialog(undefined);
        setEditing(undefined);
    }, []);

    return (
        <ComponentDecorator name="BookStoreList">
            <Space direction="vertical" style={{width: "100%"}}>
                <Table rowKey="id" dataSource={stores} pagination={false}>
                    <Table.Column title="Name" dataIndex="name"/>
                    <Table.Column title="Books" render={renderBooks}/>
                    <Table.Column title="Operations" render={renderOperations}/>
                </Table>
                <Button onClick={onAddClick}>Add BookStore</Button>
            </Space>
            {
                dialog !== undefined &&
                <BookStoreDialog value={dialog === "EDIT" ? editing : undefined} onClose={onDialogClose}/>
            }
        </ComponentDecorator>
    );
});