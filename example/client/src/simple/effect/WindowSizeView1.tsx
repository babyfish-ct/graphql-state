import { FC, memo } from "react";
import { useStateValue } from "graphql-state";
import { windowSizeState1 } from "./State";
import { css } from "@emotion/css";
import { ComponentDecorator } from "../../common/ComponentDecorator";

export const WindowSizeView1: FC = memo(() => {
    const { width, height } = useStateValue(windowSizeState1);

    return (
        <ComponentDecorator name="WindowSizeView1">
            <h1 className={ROW_CLASS}>Please resize the browser</h1>
            <div className={ROW_CLASS}>Current window width: {width}</div>
            <div className={ROW_CLASS}>Current window height: {height}</div>
        </ComponentDecorator>
    );
});

const ROW_CLASS = css({margin: "1rem"});