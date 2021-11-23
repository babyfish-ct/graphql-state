import { Space, Table, Modal, Input, Button, Tag, Spin, Row, Col } from "antd";
import { useStateManager, usePaginationQuery } from "graphql-state";
import { ModelType, ParameterRef } from "graphql-ts-client-api";
import { ChangeEvent, FC, memo, useCallback, useState } from "react";
import { ComponentDecorator } from "../../../common/ComponentDecorator";
import { DELETE_CONFIRM_CLASS, DELETING_ROW_CLASS, INFORMATION_CLASS } from "../Css";
import { book$$, author$$, query$, authorConnection$, authorEdge$ } from "../../__generated_rest_schema__/fetchers";
import { Schema } from "../../__generated_rest_schema__";
import { AuthorDialog } from "./AuthorDialog";
import { deleteAuthor } from "../Mutation";

const AUTHOR_ROW =
    author$$
    .books(
        { name: ParameterRef.of("bookName") },
        book$$
    );

export const AuthorList: FC = memo(() => {

    const [name, setName] = useState("");
    const [bookName, setBookName] = useState("");

    const { data, loading, refetch, isLoadingNext, loadNext, hasNext } = usePaginationQuery(
        query$.findAuthors(
            authorConnection$
            .totalCount
            .edges(
                authorEdge$.node(
                    AUTHOR_ROW
                )
            ),
            options => options.alias("authorConnection")
        ),
        {
            windowId: "authorPagination",
            initialSize: 4,
            asyncStyle: "async-object",
            variables: { name, bookName }
        }
    );

    const stateManager = useStateManager<Schema>();
    const [removing, setRemoving] = useState(false);
    
    const onNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
    }, []);
    const onBookNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setBookName(e.target.value);
    }, []);

    const [dialog, setDialog] = useState<"NEW" | "EDIT">();
    const [editing, setEditing] = useState<ModelType<typeof AUTHOR_ROW>>();
    const [deleting, setDeleting] = useState<ModelType<typeof AUTHOR_ROW>>();

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
            onOk: async () => {
                setDeleting(row);
                setRemoving(true);
                try {
                    await deleteAuthor(row.id);
                    stateManager.delete('Author', row.id);
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
        setEditing(undefined);
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
                <Button 
                onClick={()=> { onDelete(row); }} 
                loading={removing && deleting?.id === row.id }>
                    Delete
                </Button>
            </Button.Group>
        );
    }, [onDelete, removing, deleting]);

    const rowClassName = useCallback((row: ModelType<typeof AUTHOR_ROW>) => {
        return removing && deleting?.id === row.id ? DELETING_ROW_CLASS : "";
    }, [deleting, removing]);

    return (
        <ComponentDecorator name="AuthorList">
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
                        <Button onClick={onAddClick} type="primary">Add Author...</Button>
                    </Col>
                </Row>
                { loading && <div><Spin/>Loading authors...</div> }
                {
                    !loading && data &&
                    <>
                        <Table 
                        rowKey="id" 
                        dataSource={data.authorConnection.edges.map(edge => edge.node)} 
                        pagination={false}
                        rowClassName={rowClassName}>
                            <Table.Column title="Id" dataIndex="id"/>
                            <Table.Column title="Name" dataIndex="name"/>
                            <Table.Column title="Books" render={renderBooks}/>
                            <Table.Column title="Operations" render={renderOperations}/>
                        </Table>
                        <Space>
                            <Button onClick={loadNext} disabled={!hasNext} loading={isLoadingNext}>Load more</Button>
                            {data.authorConnection.totalCount - data.authorConnection.edges.length} row(s) left
                        </Space>
                    </>
                }
                {
                    dialog !== undefined &&
                    <AuthorDialog value={dialog === "EDIT" ? editing : undefined} onClose={onDialogClose}/>
                }
            </Space>
        </ComponentDecorator>
    );
});