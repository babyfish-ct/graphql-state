import { FC, memo } from "react";
import { useStateValue } from "graphql-state";
import { windowSizeState2 } from "./State";
import { css } from "@emotion/css";
import { ComponentDecorator } from "../../common/ComponentDecorator";

export const WindowSizeView2: FC = memo(() => {
    const { width, height } = useStateValue(windowSizeState2);

    return (
        <ComponentDecorator name="WindowSizeView2">
            <h1 className={ROW_CLASS}>Please resize the browser</h1>
            <div className={ROW_CLASS}>Current window width: {width}</div>
            <div className={ROW_CLASS}>Current window height: {height}</div>
        </ComponentDecorator>
    );
});

const ROW_CLASS = css({margin: "1rem"});