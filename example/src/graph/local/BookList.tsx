import { Table } from "antd";
import { FC, memo } from "react";
import { ComponentDecorator } from "../../common/ComponentDecorator";
import { author$$, book$$, bookStore$$ } from "../../__generated/fetchers";

export const BOOK_ROW = 
    book$$
    .store(bookStore$$)
    .authors(author$$)
;

export const BookList: FC = memo(() => {

    return (
        <ComponentDecorator name="BookList">
            <Table>

            </Table>
        </ComponentDecorator>
    );
});