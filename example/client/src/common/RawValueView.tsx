import { css } from "@emotion/css";
import { FC, memo, ReactNode } from "react";

export const RawValueView: FC<{
    readonly value: any
}> = memo(({value}) => {
    return <div>{valueNode(value)}</div>
});

function valueNode(value: any): ReactNode {
    if (Array.isArray(value)) {
        if (value.length === 0) {
            return "[]";
        }
        return (
            <ol className={LIST_CSS}>
                {value.map((element, index) => <li key={index}>{valueNode(element)}</li>)}
            </ol>
        );
    }
    if (typeof value === "object") {
        const pairs: Array<{readonly key: string, readonly value: any}> = [];
        for (const key in value) {
            pairs.push({key, value: value[key]});
        }
        if (pairs.length === 0) {
            return "{}";
        }
        return (
            <ul className={OBJECT_CSS}>
                {
                    pairs.map(pair => 
                        <li key={pair.key}>
                            {pair.key}: {valueNode(pair.value)}
                        </li>
                    )
                }
            </ul>
        );
    }
    if (value === undefined) {
        return "undefined";
    }
    return `${value}`;
}

const LIST_CSS = css({
    padding: "2px 2px 2px 1rem",
    border: "dotted 2px gray"
});

const OBJECT_CSS = css({
    padding: "2px 2px 2px 1rem",
    border: "dotted 1px gray",
    listStyleType: "disc"
});

