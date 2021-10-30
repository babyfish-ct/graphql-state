import { Table, Tag, Space, Button, Input, Modal, Spin, Row, Col } from "antd";
import { useQuery, useMutation, useStateManager, usePaginationQuery } from "graphql-state";
import { ModelType, ParameterRef } from "graphql-ts-client-api";
import { ChangeEvent, FC, memo, useCallback, useState } from "react";
import { ComponentDecorator } from "../../../common/ComponentDecorator";
import { BookDialog } from "../book/BookDialog";
import { DELETE_CONFIRM_CLASS, DELETING_ROW_CLASS, INFORMATION_CLASS } from "../Css";
import { book$$, bookConnection$, bookEdge$, bookStore$$, mutation$, query$, author$$ } from "../../__generated_graphql_schema__/fetchers";
import { Schema } from "../../__generated_graphql_schema__";

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
    
    const [name, setName] = useState<string>();
    const [authorName, setAuthorName] = useState<string>();

    const { data, loading, refetch } = usePaginationQuery(
        query$.findBooks(
            bookConnection$.edges(
                bookEdge$.node(
                    BOOK_ROW
                )
            ),
            options => options.alias("bookConnection")
        ),
        {
            asyncStyle: "async-object",
            variables: { name, authorName },
            initializedSize: 4
        }
    );

    const stateManager = useStateManager<Schema>();

    const [remove, {loading: removing}] = useMutation(
        mutation$.deleteBook(),
        {
            onSuccess: data => {
                stateManager.delete("Book", data.deleteBook)
            }
        }
    );

    const [dialog, setDialog] = useState<"NEW" | "EDIT">();
    const [editing, setEditing] = useState<ModelType<typeof BOOK_ROW>>();
    const [deleting, setDeleting] = useState<ModelType<typeof BOOK_ROW>>();

    const onNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.trim();
        setName(value === "" ? undefined : value);
    }, []);

    const onAuthorNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.trim();
        setAuthorName(value === "" ? undefined : value);
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
                remove({id: row.id});
            }
        });
    }, [remove]);

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
                </Row>
                { loading && <div><Spin/>Loading books...</div> }
                {
                    !loading && data &&
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
                }
                <Button onClick={onAddClick}>Add Book</Button>
            </Space>
            {
                dialog !== undefined &&
                <BookDialog value={dialog === "EDIT" ? editing : undefined} onClose={onDialogClose}/>
            }
        </ComponentDecorator>
    );
});