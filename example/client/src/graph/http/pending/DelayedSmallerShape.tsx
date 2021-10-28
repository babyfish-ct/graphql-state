import { Spin } from "antd";
import { useQuery, useStateValue } from "graphql-state";
import { FC, memo, useEffect, useState } from "react";
import { ComponentDecorator } from "../../../common/ComponentDecorator";
import { RawValueView } from "../../../common/RawValueView";
import { query$, bookConnection$, bookEdge$, book$$ } from "../../__generated_graphql_schema__/fetchers";
import { bookNameState, DELAY_MILLIS } from "./State";

export const DelayedSmallerShape: FC = memo(() => {

    const name = useStateValue(bookNameState);

    const [delayName, setDelayName] = useState<string>();

    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout>();

    useEffect(() => {
        setDelayName(undefined);
        setTimeoutId(
            setTimeout(() => {
                setDelayName(name);
            }, 2000)
        );
    }, [name]);

    useEffect(() => {
        if (timeoutId !== undefined) {
            return () => {
                clearTimeout(timeoutId);
            }
        }
    }, [timeoutId]);

    return (
        <ComponentDecorator name="DelayedSmallerShape">
            {
                delayName === undefined ?
                <h3>Delay 2 seconds, then load data</h3> :
                <DataView name={delayName}/> 
            }
        </ComponentDecorator>
    );
});

const DataView: FC<{
    readonly name: string
}> = memo(({name}) => {

    const { data, loading } = useQuery(
        query$.findBooks(
            bookConnection$.edges(
                bookEdge$.node(
                    book$$
                )
            )
        ),
        {
            variables: { 
                name,
                delayMillis: DELAY_MILLIS // All the variables must be same 
            },
            asyncStyle: "async-object"
        }
    );

    return (
        <>
            {loading && <div><Spin/>Loading...</div>}
            {data && <RawValueView value={data}/>}
        </>
    );
});


