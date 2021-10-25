import { FC, memo } from "react";
import { Select, Spin } from "antd";
import { useStateValue } from "graphql-state";
import { authorOptionListState } from "../State";

export const AuthorMultiSelect: FC<{
    value?: string[],
    onChange?: (value: string[]) => void
}> = memo(({value, onChange}) => {

    const { data: authors, loading, error } = useStateValue(
        authorOptionListState, 
        {asyncStyle: "async-object"}
    );

    return (
        <>
            { error && <div>Failed to load options</div> }
            { loading && <><Spin/>Loading options...</> }
            {
                authors && <Select mode="multiple" value={value === undefined ? [] : value} onChange={onChange}>
                    {
                        authors.map(author => 
                            <Select.Option key={author.id} value={author.id}>{author.name}</Select.Option>
                        )
                    }
                </Select>
            }
        </>
    );
});