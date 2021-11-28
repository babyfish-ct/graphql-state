import { css } from "@emotion/css";
import { Select, Spin } from "antd";
import { FC, memo, useCallback } from "react";
import { useQuery } from "graphql-state";
import { bookStore$, query$ } from "../../__generated_rest_schema__/fetchers";

export const BookStoreSelect: FC<{
    value?: string,
    onChange?: (value?: string) => void,
    optional?: boolean
}> = memo(({value, onChange, optional}) => {
    
    const { data, loading, error } = useQuery(
        query$.findBookStores(
            bookStore$.id.name
        ),
        { 
            asyncStyle: "async-object",
            releasePolicy: () => 3600_000
        }
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
                            data.findBookStores.map(store =>
                                <Select.Option key={store.id} value={store.id}>{store.name}</Select.Option>
                            )
                        }
                    </Select>
                }
            </>
        </>
    );
});