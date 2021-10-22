import { Space, Table, Modal, Input, Button, Tag, Spin, Row, Col } from "antd";
import { useQuery } from "graphql-state";
import { ModelType, ParameterRef } from "graphql-ts-client-api";
import { ChangeEvent, FC, memo, useCallback, useState } from "react";
import { ComponentDecorator } from "../../../common/ComponentDecorator";
import { DELETE_CONFIRM_CLASS, INFORMATION_CLASS } from "../Css";
import { book$$, author$$, query$, authorConnection$, authorEdge$ } from "../__generated/fetchers";

const AUTHOR_ROW =
    author$$
    .books(
        { name: ParameterRef.of("bookName") },
        book$$
    );

export const AuthorList: FC = memo(() => {

    const [name, setName] = useState<string>();
    const [bookName, setBookName] = useState<string>();
    const { data, loading } = useQuery(
        query$.findAuthors(
            authorConnection$.edges(
                authorEdge$.node(
                    AUTHOR_ROW
                )
            ),
            options => options.alias("authorConnection")
        ),
        {
            asyncStyle: "ASYNC_OBJECT",
            variables: { name, bookName }
        }
    );
    
    const onNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.trim();
        setName(value === "" ? undefined : value);
    }, []);
    const onBookNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.trim();
        setBookName(value === "" ? undefined : value);
    }, []);

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
                <Row gutter={10}>
                    <Col flex={1}>
                        <Input value={name} onChange={onNameChange} placeholder="Input name to filter rows..."/>
                    </Col>
                    <Col flex={1}>
                        <Input value={bookName} onChange={onBookNameChange} placeholder="Input name to filter books of each row..."/>
                    </Col>
                    <Col>
                        <Button>Refresh</Button>
                    </Col>
                </Row>
                { loading && <div><Spin/>Loading authors...</div> }
                {
                    !loading && data &&
                    <>
                        <Table rowKey="id" dataSource={data.authorConnection.edges.map(edge => edge.node)} pagination={false}>
                            <Table.Column title="Name" dataIndex="name"/>
                            <Table.Column title="Books" render={renderBooks}/>
                            <Table.Column title="Operations" render={renderOperations}/>
                        </Table>
                        <Button onClick={onAddClick}>Add Author</Button>
                    </>
                }
            </Space>
        </ComponentDecorator>
    );
});