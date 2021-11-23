import { Table, Tag, Space, Button, Input, Modal, Spin, Row, Col } from "antd";
import { useStateManager, usePaginationQuery } from "graphql-state";
import { ModelType, ParameterRef } from "graphql-ts-client-api";
import { ChangeEvent, FC, memo, useCallback, useState } from "react";
import { ComponentDecorator } from "../../../common/ComponentDecorator";
import { DELETE_CONFIRM_CLASS, DELETING_ROW_CLASS, INFORMATION_CLASS } from "../Css";
import { book$$, bookConnection$, bookEdge$, bookStore$$, query$, author$$ } from "../../__generated_rest_schema__/fetchers";
import { Schema } from "../../__generated_rest_schema__";
import { BookDialog } from "./BookDialog";

const BOOK_ROW =
    book$$
    .store(
        bookStore$$
    )
    .authors(
        { name: ParameterRef.of("authorName") },
        author$$
    )

export const BookList: FC = memo(() => {
    
    const [name, setName] = useState("");
    const [authorName, setAuthorName] = useState("");

    const { data, loading, refetch, hasNext, loadNext, isLoadingNext } = usePaginationQuery(
        query$.findBooks(
            bookConnection$
            .totalCount
            .edges(
                bookEdge$.node(
                    BOOK_ROW
                )
            ),
            options => options.alias("bookConnection")
        ),
        {
            windowId: "bookPagination",
            initialSize: 4,
            asyncStyle: "async-object",
            variables: { name, authorName }
        }
    );

    const stateManager = useStateManager<Schema>();

    const [removing, setRemoving] = useState(false);

    const [dialog, setDialog] = useState<"NEW" | "EDIT">();
    const [editing, setEditing] = useState<ModelType<typeof BOOK_ROW>>();
    const [deleting, setDeleting] = useState<ModelType<typeof BOOK_ROW>>();

    const onNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
    }, []);

    const onAuthorNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setAuthorName(e.target.value);
    }, []);

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
                setDeleting(row);
                // TODO
            }
        });
    }, []);

    const renderStoreName = useCallback((name?: string) => {
        return name ? <Tag>{name}</Tag> : <></>
    }, []);

    const onAddClick = useCallback(() => {
        setDialog("NEW");
    }, []);

    const onDialogClose = useCallback(() => {
        setDialog(undefined);
        setEditing(undefined);
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
                <Button 
                onClick={()=> { onDelete(row); }} 
                loading={removing && deleting?.id === row.id }>
                    Delete
                </Button>
            </Button.Group>
        );
    }, [onDelete, removing, deleting]);

    const rowClassName = useCallback((row: ModelType<typeof BOOK_ROW>) => {
        return removing && deleting?.id === row.id ? DELETING_ROW_CLASS : "";
    }, [deleting, removing]);

    return (
        <ComponentDecorator name="BookList">
            <Space direction="vertical" style={{width: "100%"}}>
                <Row gutter={10}>
                    <Col flex={1}>
                        <Input value={name} onChange={onNameChange} placeholder="Input name to filter rows..."/>
                    </Col>
                    <Col flex={1}>
                        <Input value={authorName} onChange={onAuthorNameChange} placeholder="Input name to filter author of each row..."/>
                    </Col>
                    <Col>
                        <Button onClick={refetch}>Refresh</Button>
                    </Col>
                    <Col>
                        <Button onClick={onAddClick} type="primary">Add Book...</Button>
                    </Col>
                </Row>
                { loading && <div><Spin/>Loading books...</div> }
                {
                    data &&
                    <>
                        <Table 
                        rowKey="id" 
                        dataSource={data.bookConnection.edges.map(edge => edge.node)} 
                        pagination={false}
                        rowClassName={rowClassName}>
                            <Table.Column title="Id" dataIndex="id"/>
                            <Table.Column title="Name" dataIndex="name"/>
                            <Table.Column title="Store" dataIndex={["store", "name"]} render={renderStoreName}/>
                            <Table.Column title="Authors" render={renderAuthors}/>
                            <Table.Column title="Operations" render={renderOperations}/>
                        </Table>
                        <Space>
                            <Button onClick={loadNext} disabled={!hasNext} loading={isLoadingNext}>Load more</Button>
                            {data.bookConnection.totalCount - data.bookConnection.edges.length} row(s) left
                        </Space>
                    </>
                }
                {
                    dialog !== undefined &&
                    <BookDialog value={dialog === "EDIT" ? editing : undefined} onClose={onDialogClose}/>
                }
            </Space>
        </ComponentDecorator>
    );
});