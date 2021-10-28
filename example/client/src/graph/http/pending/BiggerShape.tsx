import { Spin } from "antd";
import { useQuery, useStateValue } from "graphql-state";
import { FC, memo } from "react";
import { ComponentDecorator } from "../../../common/ComponentDecorator";
import { RawValueView } from "../../../common/RawValueView";
import { book$$, bookConnection$, bookEdge$, bookStore$$, query$ } from "../../__generated_graphql_schema__/fetchers";
import { bookNameState, DELAY_MILLIS } from "./State";

export const BiggerShape: FC = memo(() => {

    const name = useStateValue(bookNameState);

    const { data, loading } = useQuery(
        query$.findBooks(
            bookConnection$.edges(
                bookEdge$.node(
                    book$$
                    .store(
                        bookStore$$
                    )
                )
            )
        ),
        {
            variables: { 
                name,
                delayMillis: DELAY_MILLIS
            },
            asyncStyle: "async-object"
        }
    );

    return (
        <ComponentDecorator name="BiggerShape">
            {loading && <div><Spin/>Loading...(Need 4 seconds if data is not cached)</div>}
            {data && <RawValueView value={data}/>}
        </ComponentDecorator>
    );
});