import { ChangeEvent, FC, memo, useCallback } from "react";
import { useStateAccessor } from "graphql-state";
import { textState } from "./State";
import { ComponentDecorator } from "../../common/ComponentDecorator";
import { Input } from "antd";

export const InputView: FC = memo(() => {

    const text = useStateAccessor(textState);

    const onTextChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        text(e.target.value);
    }, [text]);

    return (
        <ComponentDecorator name="InputView">
            <Input value={text()} onChange={onTextChange}/>
        </ComponentDecorator>
    );
});