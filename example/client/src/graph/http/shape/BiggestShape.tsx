import { useQuery } from "graphql-state";
import { FC, memo } from "react";
import { ComponentDecorator } from "../../../common/ComponentDecorator";
import { RawValueView } from "../../../common/RawValueView";
import { author$$, book$$, bookConnection$, bookEdge$, bookStore$$, query$ } from "../../__generated_graphql_schema__/fetchers";

export const BiggestShape: FC = memo(() => {
    
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
        )
    );

    return (
        <ComponentDecorator name="BiggestShape">
            <RawValueView value={conn}/>
        </ComponentDecorator>
    );
});