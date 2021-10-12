import { useStateValue } from "graphql-state";
import { FC, memo } from "react";
import { Select } from "antd";
import { author$$ } from "../../../__generated/fetchers";
import { authorIdListState } from "../State";
import { useObjects } from "../TypedHook";

export const AuthorMultiSelect: FC<{
    value?: string[],
    onChange?: (value: string[]) => void
}> = memo(({value, onChange}) => {

    const authorIds = useStateValue(authorIdListState);
    const authors = useObjects(author$$, authorIds);

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