import { FC, memo } from "react";
import { Select } from "antd";
import { useQuery } from "graphql-state";
import { author$$, query$ } from "../../../__generated/fetchers";

export const AuthorMultiSelect: FC<{
    value?: string[],
    onChange?: (value: string[]) => void
}> = memo(({value, onChange}) => {

    const { authors } = useQuery(query$.authors(author$$));

    return (
        <Select mode="multiple" value={value === undefined ? [] : value} onChange={onChange}>
            {
                authors.map(author => 
                    <Select.Option key={author.id} value={author.id}>{author.name}</Select.Option>
                )
            }
        </Select>
    );
});