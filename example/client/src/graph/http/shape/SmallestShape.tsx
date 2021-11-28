import { Spin } from "antd";
import { useQuery, useStateValue } from "graphql-state";
import { FC, memo } from "react";
import { ComponentDecorator } from "../../../common/ComponentDecorator";
import { RawValueView } from "../../../common/RawValueView";
import { book$$, bookConnection$, bookEdge$, query$ } from "../../__generated_graphql_schema__/fetchers";
import { bookNameState } from "./State";

export const SmallestShape: FC = memo(() => {
    
    const name = useStateValue(bookNameState);

    const { data, loading } = useQuery(
        query$.findBooks(
            bookConnection$.edges(
                bookEdge$.node(
                    book$$
                )
            )
        ),
        {
            variables: { name },
            asyncStyle: "async-object"
        }
    );

    return (
        <ComponentDecorator name="SmallestShape">
            { loading && <div><Spin/>Loading...</div>}
            { !loading && data && <RawValueView value={data}/> }
        </ComponentDecorator>
    );
});