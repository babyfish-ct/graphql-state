import { css } from "@emotion/css";
import { Select } from "antd";
import { FC, memo } from "react";
import { bookStore$$, query$ } from "../../../__generated/fetchers";
import { useQuery } from "graphql-state/dist/state/StateHook";

export const BookStoreSelect: FC<{
    value?: string,
    onChange?: (value?: string) => void,
    optional?: boolean
}> = memo(({value, onChange, optional}) => {

    const { stores } = useQuery(
        query$.bookStores(
            bookStore$$,
            options => options.alias("stores")
        )
    );

    return (
        <Select value={value} onChange={onChange}>
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
    );
});