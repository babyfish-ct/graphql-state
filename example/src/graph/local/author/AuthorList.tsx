import { Button, Space, Tag, Table, Modal } from "antd";
import { useQuery } from "graphql-state/dist/state/StateHook";
import { ModelType } from "graphql-ts-client-api";
import { FC, memo, useCallback, useState } from "react";
import { ComponentDecorator } from "../../../common/ComponentDecorator";
import { author$$, book$$, query$ } from "../../../__generated/fetchers";
import { stateManager } from "../App";
import { DELETE_CONFIRM_CLASS, INFORMATION_CLASS } from "../Css";
import { AuthorDialog } from "./AuthorDialog";

const AUTHOR_ROW =
    author$$
    .books(
        book$$
    )
;

export const AuthorList: FC = memo(() => {

    const { authors } = useQuery(query$.authors(AUTHOR_ROW));
    const [dialog, setDialog] = useState<"NEW" | "EDIT">();
    const [editing, setEditing] = useState<ModelType<typeof AUTHOR_ROW>>();

    const onDelete = useCallback((row: ModelType<typeof AUTHOR_ROW>) => {
        Modal.confirm({
            title: `Are your sure`,
            content: <>
                <div className={DELETE_CONFIRM_CLASS}>Are you sure to delete the author "{row.name}"?</div>
                <div className={INFORMATION_CLASS}>
                    If you choose to delete this object
                    <ul>
                        <li>The current object will be automatically removed from any associations of other objects(Of course, include the root query object)</li>
                    </ul>
                </div>
            </>,
            onOk: () => {
                stateManager.delete("Author", row.id);
            }
        });
    }, []);

    const renderBooks = useCallback((_: any, row: ModelType<typeof AUTHOR_ROW>) => {
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

    const renderOperations = useCallback((_: any, row: ModelType<typeof AUTHOR_ROW>) => {
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
        <ComponentDecorator name="AuthorList">
            <Space direction="vertical" style={{width: "100%"}}>
                <Table rowKey="id" dataSource={authors} pagination={false}>
                    <Table.Column title="Name" dataIndex="name"/>
                    <Table.Column title="Books" render={renderBooks}/>
                    <Table.Column title="Operations" render={renderOperations}/>
                </Table>
                <Button onClick={onAddClick}>Add Author</Button>
            </Space>
            {
                dialog !== undefined &&
                <AuthorDialog value={dialog === "EDIT" ? editing : undefined} onClose={onDialogClose}/>
            }
        </ComponentDecorator>
    );
});