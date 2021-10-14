import { Button, Modal, Space, Table, Tag } from "antd";
import { useQuery } from "graphql-state";
import { ModelType } from "graphql-ts-client-api";
import { FC, memo, useCallback, useState } from "react";
import { ComponentDecorator } from "../../../common/ComponentDecorator";
import { book$$, bookStore$$, query$ } from "../../../__generated/fetchers";
import { stateManager } from "../App";
import { DELETE_CONFIRM_CLASS, INFORMATION_CLASS } from "../Css";
import { BookStoreDialog } from "./BookStoreDialog";

const BOOK_STORE_ROW = 
    bookStore$$
    .books(
        book$$
    )
;

export const BookStoreList: FC = memo(() => {

    const { stores } = useQuery(
        query$.bookStores(
            BOOK_STORE_ROW,
            options => options.alias("stores")
        )
    );
    const [dialog, setDialog] = useState<"NEW" | "EDIT">();
    const [editing, setEditing] = useState<ModelType<typeof BOOK_STORE_ROW>>();

    const onDelete = useCallback((row: ModelType<typeof BOOK_STORE_ROW>) => {
        Modal.confirm({
            title: `Are your sure`,
            content: <>
                <div className={DELETE_CONFIRM_CLASS}>Are you sure to delete the book store "{row.name}"?</div>
                <div className={INFORMATION_CLASS}>
                    If you choose to delete this object
                    <ul>
                        <li>The current object will be automatically removed from any associations of other objects(Of course, include the root query object)</li>
                    </ul>
                </div>
            </>,
            onOk: () => {
                stateManager.delete("BookStore", row.id);
            }
        });
    }, []);

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
                <Button onClick={() => { setDialog("EDIT"); setEditing(row); }}>Edit</Button>
                <Button onClick={( )=> { onDelete(row); }}>Delete</Button>
            </Button.Group>
        );
    }, [onDelete]);

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