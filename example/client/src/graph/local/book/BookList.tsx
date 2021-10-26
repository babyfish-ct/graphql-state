import { Button, Modal, Space, Table, Tag } from "antd";
import { useQuery, useStateManager } from "graphql-state";
import { ModelType } from "graphql-ts-client-api";
import { FC, memo, useCallback, useState } from "react";
import { ComponentDecorator } from "../../../common/ComponentDecorator";
import { author$$, book$$, bookStore$$, query$ } from "../../__generated_local_schema__/fetchers";
import { DELETE_CONFIRM_CLASS, INFORMATION_CLASS } from "../Css";
import { BookDialog } from "./BookDialog";

const BOOK_ROW = 
    book$$
    .store(bookStore$$)
    .authors(author$$)
;

export const BookList: FC = memo(() => {

    const { books } = useQuery(query$.books(BOOK_ROW));
    const [dialog, setDialog] = useState<"NEW" | "EDIT">();
    const [editing, setEditing] = useState<ModelType<typeof BOOK_ROW>>();

    const stateManager = useStateManager();

    const onDelete = useCallback((row: ModelType<typeof BOOK_ROW>) => {
        Modal.confirm({
            title: `Are your sure`,
            content: <>
                <div className={DELETE_CONFIRM_CLASS}>Are you sure to delete the book "{row.name}"?</div>
                <div className={INFORMATION_CLASS}>
                    If you choose to delete this object
                    <ul>
                        <li>The current object will be automatically removed from any associations of other objects(Of course, include the root query object)</li>
                    </ul>
                </div>
            </>,
            onOk: () => {
                stateManager.delete("Book", row.id);
            }
        });
    }, [stateManager]);

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
                <Button onClick={() => { setDialog("EDIT"); setEditing(row); }}>Edit</Button>
                <Button onClick={() => { onDelete(row); }}>Delete</Button>
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