import { FC, memo } from "react";
import { Select, Spin } from "antd";
import { book$$, query$ } from "../__generated/fetchers";
import { useQuery } from "graphql-state";

export const BookMultiSelect: FC<{
    value?: string[],
    onChange?: (value: string[]) => void
}> = memo(({value, onChange}) => {

    const { data, loading, error } = useQuery(
        query$.findBooks(
            book$$,
            options => options.alias("options")
        ), {
        asyncStyle: "ASYNC_OBJECT"
    });

    return (
        <>
            {
                loading && <div>
                    <Spin/>Loading book options...
                </div>
            }
            {
                data &&
                <Select mode="multiple" value={value ?? []} onChange={onChange}>
                    {
                        data.options.map(option =>
                            <Select.Option key={option.id} value={option.id}>{option.name}</Select.Option>
                        )
                    }
                </Select>
            }
        </>
    );
});