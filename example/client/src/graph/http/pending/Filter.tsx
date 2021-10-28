import { Input } from "antd";
import { useStateAccessor } from "graphql-state";
import { ChangeEvent, FC, memo, useCallback } from "react";
import { ComponentDecorator } from "../../../common/ComponentDecorator";
import { bookNameState } from "./State";

export const Filter: FC = memo(() => {
    
    const name = useStateAccessor(bookNameState);
    
    const onNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        name(e.target.value);
    }, [name]);

    return (
        <ComponentDecorator name="Filter">
            <Input value={name()} 
            onChange={onNameChange} 
            placeholder="Please input name to filter books..."/>
        </ComponentDecorator>
    );
});