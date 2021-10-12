import { FC, memo } from "react";
import { Select } from "antd";
import { useStateValue } from "graphql-state";
import { bookIdListState } from "../State";
import { useObjects } from "../TypedHook";
import { book$$ } from "../../../__generated/fetchers";

export const BookMultiSelect: FC<{
    value?: string[],
    onChange?: (value: string[]) => void
}> = memo(({value, onChange}) => {

    const bookIds = useStateValue(bookIdListState);
    const books = useObjects(book$$, bookIds);

    return (
        <Select mode="multiple" value={value ?? []} onChange={onChange}>
            {
                books.map(book =>
                    <Select.Option key={book.id} value={book.id}>{book.name}</Select.Option>
                )
            }
        </Select>
    );
});