import { useQuery } from "graphql-state";
import { FC, memo } from "react";
import { ComponentDecorator } from "../../../common/ComponentDecorator";
import { RawValueView } from "../../../common/RawValueView";
import { book$$, bookConnection$, bookEdge$, bookStore$$, query$ } from "../../__generated_graphql_schema__/fetchers";

export const MiddleShape: FC = memo(() => {
    
    const conn = useQuery(
        query$.findBooks(
            bookConnection$.edges(
                bookEdge$.node(
                    book$$
                    .store(
                        bookStore$$
                    )
                )
            )
        )
    );

    return (
        <ComponentDecorator name="MiddleShape">
            <RawValueView value={conn}/>
        </ComponentDecorator>
    );
});