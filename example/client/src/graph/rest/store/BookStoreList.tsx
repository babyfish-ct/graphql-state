import { ChangeEvent, memo, useCallback, useState } from "react";
import { Button, Input, Space, Spin, Table, Tag, Modal, Row, Col } from "antd";
import { ComponentDecorator } from "../../../common/ComponentDecorator";
import { useQuery, useStateManager } from "graphql-state";
import { ModelType, ParameterRef } from "graphql-ts-client-api";
import { DELETE_CONFIRM_CLASS, DELETING_ROW_CLASS, INFORMATION_CLASS } from "../Css";
import { BookStoreDialog } from "./BookStoreDialog";
import { book$$, bookStore$$, query$ } from "../../__generated_rest_schema__/fetchers";
import { Schema } from "../../__generated_rest_schema__";
import { deleteBookStore } from "../Mutation";

const BOOK_STORE_ROW =
    bookStore$$
    .books(
        {name: ParameterRef.of("bookName")},
        book$$
    )
;

export const BookStoreList = memo(() => {

    const [name, setName] = useState("");
    const [bookName, setBookName] = useState("");

    const { data, loading, refetch } = useQuery(
        query$.findBookStores(
            BOOK_STORE_ROW, 
            options => options.alias("stores")
        ),
        {
            asyncStyle: "async-object",
            variables: { name, bookName }
        }
    );

    const stateManager = useStateManager<Schema>();
    const [removing, setRemoving] = useState(false);

    const [dialog, setDialog] = useState<"NEW" | "EDIT">();
    const [editing, setEditing] = useState<ModelType<typeof BOOK_STORE_ROW>>();
    const [deleting, setDeleting] = useState<ModelType<typeof BOOK_STORE_ROW>>();

    const onNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
    }, []);
    const onBookNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setBookName(e.target.value);
    }, []);

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
            onOk: async () => {
                setDeleting(row);
                setRemoving(true);
                try {
                    await deleteBookStore(row.id);
                    stateManager.delete('BookStore', row.id);
                } finally {
                    setRemoving(false);
                }
            }
        });
    }, [stateManager]);

    const onAddClick = useCallback(() => {
        setDialog("NEW");
    }, []);

    const onDialogClose = useCallback(() => {
        setDialog(undefined);
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
                <Button 
                onClick={()=> { onDelete(row); }} 
                loading={removing && deleting?.id === row.id }>
                    Delete
                </Button>
            </Button.Group>
        );
    }, [onDelete, removing, deleting]);

    const rowClassName = useCallback((row: ModelType<typeof BOOK_STORE_ROW>) => {
        return removing && deleting?.id === row.id ? DELETING_ROW_CLASS : "";
    }, [deleting, removing]);

    return (
        <ComponentDecorator name="BookStoreList">
            <Space direction="vertical" style={{width: "100%"}}>
                <Row gutter={10}>
                    <Col flex={1}>
                        <Input value={name} onChange={onNameChange} placeholder="Input name to filter rows..."/>
                    </Col>
                    <Col flex={1}>
                        <Input value={bookName} onChange={onBookNameChange} placeholder="Input name to filter books of each row..."/>
                    </Col>
                    <Col>
                        <Button onClick={refetch}>Refresh</Button>
                    </Col>
                    <Col>
                        <Button onClick={onAddClick} type="primary">Add BookStore...</Button>
                    </Col>
                </Row>
                { loading && <div><Spin/>Loading book stores...</div>}
                {
                    !loading && data &&
                    <>
                        <Table 
                        rowKey="id" 
                        dataSource={data.stores} 
                        pagination={false}
                        rowClassName={rowClassName}>
                            <Table.Column title="Id" dataIndex="id"/>
                            <Table.Column title="Name" dataIndex="name"/>
                            <Table.Column title="Books" render={renderBooks}/>
                            <Table.Column title="Operations" render={renderOperations}/>
                        </Table>
                    </>
                }
                {
                    dialog !== undefined &&
                    <BookStoreDialog value={dialog === "EDIT" ? editing : undefined} onClose={onDialogClose}/>
                }
            </Space>
        </ComponentDecorator>
    );
});