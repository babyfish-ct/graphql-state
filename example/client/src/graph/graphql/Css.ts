import { css } from "@emotion/css";

export const INFORMATION_CLASS = css({
    border: "dotted 1px drakgreen",
    borderRadius: 4,
    color: "gray",
    fontSize: "12px",
    backgroundColor: "#ffe"
});

export const ACTION_CLASS = css({
    borderLeft: "solid 3px gray",
    paddingLeft: "1rem"
});

export const NOTE_CLASS = css({
    fontStyle: "italic",
    color: "gray"
});

export const DELETE_CONFIRM_CLASS = css({
    fontSize: "1.5rem"
});

export const DELETING_ROW_CLASS = css({
    textDecoration: "line-through",
    backgroundColor: "lightgray"
});
