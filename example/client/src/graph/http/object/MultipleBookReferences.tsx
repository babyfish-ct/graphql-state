import { makeManagedObjectHooks } from "graphql-state";
import { FC, memo } from "react";
import { ComponentDecorator } from "../../../common/ComponentDecorator";
import { RawValueView } from "../../../common/RawValueView";
import { author$$, book$$ } from "../../__generated_graphql_schema__/fetchers";

const { useObjects } = makeManagedObjectHooks();

export const MultipleBookReferences: FC<{
    readonly ids: ReadonlyArray<string>,
}> = memo(({ids}) => {

    const books = useObjects(
        book$$.authors(author$$), 
        ids,
        { objectStyle: "optional" }
    );

    return (
        <ComponentDecorator name="MultipleBookReferences">
            <RawValueView value={books}/>
        </ComponentDecorator>
    );
});