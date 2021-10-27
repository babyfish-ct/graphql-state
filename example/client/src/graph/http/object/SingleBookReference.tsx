import { makeManagedObjectHooks } from "graphql-state";
import { FC, memo } from "react";
import { ComponentDecorator } from "../../../common/ComponentDecorator";
import { RawValueView } from "../../../common/RawValueView";
import { author$$, book$$ } from "../../__generated_graphql_schema__/fetchers";

const { useObject } = makeManagedObjectHooks();

export const SingleBookReference: FC<{
    readonly id: string,
}> = memo(({id}) => {

    const book = useObject(
        book$$.authors(author$$), 
        id,
        { objectStyle: "optional" }
    );

    return (
        <ComponentDecorator name="SingleBookReference">
            <RawValueView value={book}/>
        </ComponentDecorator>
    );
});