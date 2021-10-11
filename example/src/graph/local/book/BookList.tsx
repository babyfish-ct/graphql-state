import { Button, Space, Table, Tag } from "antd";
import { useStateValue } from "graphql-state";
import { ModelType } from "graphql-ts-client-api";
import { FC, memo, useCallback } from "react";
import { ComponentDecorator } from "../../../common/ComponentDecorator";
import { author$$, book$$, bookStore$$ } from "../../../__generated/fetchers";
import { stateManager } from "../App";
import { bookIdListState } from "../State";
import { useObjects } from "../TypedHook";

const BOOK_ROW = 
    book$$
    .store(bookStore$$)
    .authors(author$$)
;

export const BookList: FC = memo(() => {

    const bookIds = useStateValue(bookIdListState);
    const books = useObjects(BOOK_ROW, bookIds);

    const renderStoreName = useCallback((name: string) => {
        return <Tag>{name}</Tag>
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
                <Button>Edit</Button>
                <Button onClick={()=>stateManager.delete("Book", row.id)}>Delete</Button>
            </Button.Group>
        );
    }, []);

    return (
        <ComponentDecorator name="BookList">
            <Space direction="vertical" style={{width: "100%"}}>
                <Table rowKey="id" dataSource={books}>
                    <Table.Column title="Name" dataIndex="name"/>
                    <Table.Column title="Authors" dataIndex={["store", "name"]} render={renderStoreName}/>
                    <Table.Column title="Authors" render={renderAuthors}/>
                    <Table.Column title="Operations" render={renderOperations}/>
                </Table>
            </Space>
        </ComponentDecorator>
    );
});