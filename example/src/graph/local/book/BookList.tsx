import { Button, Space, Table, Tag } from "antd";
import { useStateValue } from "graphql-state";
import { ModelType } from "graphql-ts-client-api";
import { FC, memo, useCallback, useState } from "react";
import { ComponentDecorator } from "../../../common/ComponentDecorator";
import { author$$, book$$, bookStore$$ } from "../../../__generated/fetchers";
import { stateManager } from "../App";
import { bookIdListState } from "../State";
import { useObjects } from "../TypedHook";
import { BookDialog } from "./BookDialog";

const BOOK_ROW = 
    book$$
    .store(bookStore$$)
    .authors(author$$)
;

export const BookList: FC = memo(() => {

    const bookIds = useStateValue(bookIdListState);
    const books = useObjects(BOOK_ROW, bookIds);
    const [dialog, setDialog] = useState<"NEW" | "EDIT">();
    const [editing, setEditing] = useState<ModelType<typeof BOOK_ROW>>();

    const renderStoreName = useCallback((name?: string) => {
        return name ? <Tag>{name}</Tag> : <></>
    }, []);

    const renderAuthors = useCallback((_: any, row: ModelType<typeof BOOK_ROW>) => {
        return (
            <>
                {
                    row.authors.map(author => 
                        <Tag key={author.id}>{author.name}</Tag>
                    )
                }
            </>
        );
    }, []);

    const renderOperations = useCallback((_: any, row: ModelType<typeof BOOK_ROW>) => {
        return (
            <Button.Group>
                <Button onClick={() => {setDialog("EDIT"); setEditing(row); }}>Edit</Button>
                <Button onClick={()=>stateManager.delete("Book", row.id)}>Delete</Button>
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
        <ComponentDecorator name="BookList">
            <Space direction="vertical" style={{width: "100%"}}>
                <Table rowKey="id" dataSource={books} pagination={false}>
                    <Table.Column title="Name" dataIndex="name"/>
                    <Table.Column title="Store" dataIndex={["store", "name"]} render={renderStoreName}/>
                    <Table.Column title="Authors" render={renderAuthors}/>
                    <Table.Column title="Operations" render={renderOperations}/>
                </Table>
                <Button onClick={onAddClick}>Add Book</Button>
            </Space>
            {
                dialog !== undefined &&
                <BookDialog value={dialog === "EDIT" ? editing : undefined} onClose={onDialogClose}/>
            }
        </ComponentDecorator>
    );
});