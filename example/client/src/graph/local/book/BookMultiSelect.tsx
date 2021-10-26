import { FC, memo } from "react";
import { Select } from "antd";
import { book$$, query$ } from "../../__generated_local_schema__/fetchers";
import { useQuery } from "graphql-state";

export const BookMultiSelect: FC<{
    value?: string[],
    onChange?: (value: string[]) => void
}> = memo(({value, onChange}) => {

    const { books } = useQuery(query$.books(book$$));

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