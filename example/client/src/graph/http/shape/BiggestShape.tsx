import { useQuery, useStateValue } from "graphql-state";
import { FC, memo } from "react";
import { ComponentDecorator } from "../../../common/ComponentDecorator";
import { RawValueView } from "../../../common/RawValueView";
import { author$$, book$$, bookConnection$, bookEdge$, bookStore$$, query$ } from "../../__generated_graphql_schema__/fetchers";
import { bookNameState } from "./State";

export const BiggestShape: FC = memo(() => {

    const name = useStateValue(bookNameState);
    
    const conn = useQuery(
        query$.findBooks(
            bookConnection$.edges(
                bookEdge$.node(
                    book$$
                    .store(
                        bookStore$$
                    )
                    .authors(
                        author$$
                    )
                )
            )
        ),
        {
            variables: { name }
        }
    );

    return (
        <ComponentDecorator name="BiggestShape">
            <RawValueView value={conn}/>
        </ComponentDecorator>
    );
});