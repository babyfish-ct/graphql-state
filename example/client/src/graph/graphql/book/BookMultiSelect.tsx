import { FC, memo } from "react";
import { Select, Spin } from "antd";
import { useStateValue } from "graphql-state";
import { bookOptionListState } from "../State";

export const BookMultiSelect: FC<{
    value?: string[],
    onChange?: (value: string[]) => void
}> = memo(({value, onChange}) => {

    const { data: books, loading, error } = useStateValue(
        bookOptionListState,
        { asyncStyle: "async-object" }
    );

    return (
        <>
            { error && <div>Failed to load options</div> }
            { loading && <><Spin/>Loading options...</> }
            {
                books && <Select mode="multiple" value={value ?? []} onChange={onChange}>
                    {
                        books.map(book =>
                            <Select.Option key={book.id} value={book.id}>
                                {book.name}
                            </Select.Option>
                        )
                    }
                </Select>
            }
        </>
    );
});