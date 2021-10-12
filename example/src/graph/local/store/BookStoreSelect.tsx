import { css } from "@emotion/css";
import { useStateValue } from "graphql-state";
import { Select } from "antd";
import { FC, memo } from "react";
import { bookStore$$ } from "../../../__generated/fetchers";
import { bookStoreIdListState } from "../State";
import { useObjects } from "../TypedHook";

export const BookStoreSelect: FC<{
    value?: string,
    onChange?: (value?: string) => void,
    optional?: boolean
}> = memo(({value, onChange, optional}) => {

    const storeIds = useStateValue(bookStoreIdListState);
    const stores = useObjects(bookStore$$, storeIds);

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