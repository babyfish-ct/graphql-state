import { css } from "@emotion/css";
import { Select, Spin } from "antd";
import { FC, memo, useCallback } from "react";
import { bookStore$$, query$ } from "../__generated/fetchers";
import { useQuery } from "graphql-state";

export const BookStoreSelect: FC<{
    value?: string,
    onChange?: (value?: string) => void,
    optional?: boolean
}> = memo(({value, onChange, optional}) => {

    const { data, loading, error } = useQuery(
        query$.findBooksStores(
            bookStore$$,
            options => options.alias("options")
        ),
        { asyncStyle: "ASYNC_OBJECT" }
    );

    const onSelectChange = useCallback((value: string) => {
        if (onChange !== undefined) {
            onChange(value === "" ? undefined : value);
        }
    }, [onChange]);

    return (
        <>
            { error && <div>Failed to load options</div> }
            { loading && <><Spin/>Loading options...</> }
            <>
                {
                    data && <Select value={value ?? ""} onChange={onSelectChange}>
                        { 
                            optional && <Select.Option value="">
                                <span className={css({fontStyle: "italic", fontWeight: "bold"})}>--Unspecified--</span>
                            </Select.Option>
                        }
                        {
                            data.options.map(option =>
                                <Select.Option key={option.id} value={option.id}>{option.name}</Select.Option>
                            )
                        }
                    </Select>
                }
            </>
        </>
    );
});