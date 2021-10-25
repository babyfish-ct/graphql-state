import { css } from "@emotion/css";
import { Select, Spin } from "antd";
import { FC, memo, useCallback } from "react";
import { useStateValue } from "graphql-state";
import { bookStoreOptionListState } from "../State";

export const BookStoreSelect: FC<{
    value?: string,
    onChange?: (value?: string) => void,
    optional?: boolean
}> = memo(({value, onChange, optional}) => {

    const { data: stores, loading, error } = useStateValue(
        bookStoreOptionListState, 
        {asyncStyle: "async-object"}
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
                    stores && <Select value={value ?? ""} onChange={onSelectChange}>
                        { 
                            optional && <Select.Option value="">
                                <span className={css({fontStyle: "italic", fontWeight: "bold"})}>--Unspecified--</span>
                            </Select.Option>
                        }
                        {
                            stores.map(store =>
                                <Select.Option key={store.id} value={store.id}>{store.name}</Select.Option>
                            )
                        }
                    </Select>
                }
            </>
        </>
    );
});