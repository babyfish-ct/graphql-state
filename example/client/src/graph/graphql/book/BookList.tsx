import { Table, Tag, Space, Button, Input, Modal, Spin, Row, Col } from "antd";
import { useQuery } from "graphql-state";
import { ModelType, ParameterRef } from "graphql-ts-client-api";
import { ChangeEvent, FC, memo, useCallback, useState } from "react";
import { ComponentDecorator } from "../../../common/ComponentDecorator";
import { DELETE_CONFIRM_CLASS, INFORMATION_CLASS } from "../Css";
import { book$$, bookStore$$, query$ } from "../__generated/fetchers";
import { author$$ } from "../__generated/fetchers/AuthorFetcher";

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
    const { data, loading } = useQuery(
        query$.findBooks(
            BOOK_ROW,
            options => options.alias("books")
        ),
        {
            asyncStyle: "ASYNC_OBJECT",
            variables: { name, authorName }
        }
    );

    const [dialog, setDialog] = useState<"NEW" | "EDIT">();
    const [editing, setEditing] = useState<ModelType<typeof BOOK_ROW>>();

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
                
            }
        });
    }, []);

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
                <Row gutter={10}>
                    <Col flex={1}>
                        <Input value={name} onChange={onNameChange} placeholder="Input name to filter rows..."/>
                    </Col>
                    <Col flex={1}>
                        <Input value={authorName} onChange={onAuthorNameChange} placeholder="Input name to filter author of each row..."/>
                    </Col>
                    <Col>
                        <Button>Refresh</Button>
                    </Col>
                </Row>
                { loading && <div><Spin/>Loading books...</div> }
                {
                    !loading && data &&
                    <>
                        <Table rowKey="id" dataSource={data.books} pagination={false}>
                            <Table.Column title="Name" dataIndex="name"/>
                            <Table.Column title="Store" dataIndex={["store", "name"]} render={renderStoreName}/>
                            <Table.Column title="Authors" render={renderAuthors}/>
                            <Table.Column title="Operations" render={renderOperations}/>
                        </Table>
                        <Button onClick={onAddClick}>Add Book</Button>
                    </>
                }
            </Space>
        </ComponentDecorator>
    );
});