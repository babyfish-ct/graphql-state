import { Spin } from "antd";
import { useQuery, useStateValue } from "graphql-state";
import { ParameterRef } from "graphql-ts-client-api";
import { FC, memo } from "react";
import { ComponentDecorator } from "../../../common/ComponentDecorator";
import { RawValueView } from "../../../common/RawValueView";
import { author$$, bookConnection$, bookEdge$, query$ } from "../../__generated_graphql_schema__/fetchers";
import { book$$ } from "../../__generated_graphql_schema__/fetchers";
import { bookNameState } from "./State";

export const FilteredData: FC = memo(() => {
    
    const name = useStateValue(bookNameState);
    
    const { data, loading } = useQuery(
        query$.findBooks(
            bookConnection$.edges(
                bookEdge$.node(
                    book$$
                    .authors(
                        { name: ParameterRef.of("authorName") },
                        author$$
                    )
                )
            )
        ),
        {
            variables: { 
                name, 
                authorName: undefined 
            },
            asyncStyle: "async-object"
        }
    );

    /*
     * TODO:
     *
     * For this framework, it is very important to intelligently modify the associations of 
     * incremental objects with other objects when they are saved into the cache. 
     * 
     * Therefore, it is never possible to provide options similar to "network-only" in the query API
     * 
     * This sub-demo is very special, In order to achieve a better demonstration effect, 
     * it does not want to cache data. As an alternative, you can choose to call GC
     * to release unnecessary objects early.
     */

    return (
        <ComponentDecorator name="FilteredData">
            { loading && <div><Spin/>Loading or refetching...</div> }
            { data && <RawValueView value={data}/>}
        </ComponentDecorator>
    );
});