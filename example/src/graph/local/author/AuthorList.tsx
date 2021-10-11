import { Button, Space, Tag, Table } from "antd";
import { useStateValue } from "graphql-state";
import { ModelType } from "graphql-ts-client-api";
import { FC, memo, useCallback } from "react";
import { ComponentDecorator } from "../../../common/ComponentDecorator";
import { author$$, book$$ } from "../../../__generated/fetchers";
import { stateManager } from "../App";
import { authorIdListState } from "../State";
import { useObjects } from "../TypedHook";

const AUTHOR_ROW =
    author$$
    .books(
        book$$
    );

export const AuthorList: FC = memo(() => {

    const authorIds = useStateValue(authorIdListState);
    const authors = useObjects(AUTHOR_ROW, authorIds);

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
                <Button>Edit</Button>
                <Button onClick={()=>stateManager.delete("Author", row.id)}>Delete</Button>
            </Button.Group>
        );
    }, []);

    return (
        <ComponentDecorator name="AuthorList">
            <Space direction="vertical" style={{width: "100%"}}>
                <Table rowKey="id" dataSource={authors}>
                    <Table.Column title="Name" dataIndex="name"/>
                    <Table.Column title="Books" render={renderBooks}/>
                    <Table.Column title="Operations" render={renderOperations}/>
                </Table>
            </Space>
        </ComponentDecorator>
    );
});