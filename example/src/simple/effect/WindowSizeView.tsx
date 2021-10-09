import { FC, memo } from "react";
import { useStateValue } from "graphql-state";
import { windowSizeState } from "./State";
import { css } from "@emotion/css";

export const WindowSizeView: FC = memo(() => {
    const { width, height } = useStateValue(windowSizeState);

    return (
        <div>
            <h1 className={ROW_CLASS}>Please resize the browser</h1>
            <div className={ROW_CLASS}>Current window width: {width}</div>
            <div className={ROW_CLASS}>Current window height: {height}</div>
        </div>
    );
});

const ROW_CLASS = css({margin: "1rem"});