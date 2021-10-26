import { useQuery } from "graphql-state";
import { FC, memo } from "react";
import { ComponentDecorator } from "../../../common/ComponentDecorator";
import { RawValueView } from "../../../common/RawValueView";
import { book$$, bookConnection$, bookEdge$, query$ } from "../../__generated_graphql_schema__/fetchers";

export const SmallestShape: FC = memo(() => {
    
    const conn = useQuery(
        query$.findBooks(
            bookConnection$.edges(
                bookEdge$.node(
                    book$$
                )
            )
        )
    );

    return (
        <ComponentDecorator name="SmallestShape">
            <RawValueView value={conn}/>
        </ComponentDecorator>
    );
});