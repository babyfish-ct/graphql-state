import { makeStateFactory } from "graphql-state";

const { createComputedState } = makeStateFactory();

export const windowSizeState = createComputedState<{
    readonly width: number,
    readonly height: number,
}>(() => {
    return { width: window.innerWidth, height: window.innerHeight };
}, {
    mount: ctx => {
        const onResize = () => { ctx.invalidate(); };
        window.addEventListener("resize", onResize);
        return () => {
            window.removeEventListener("resize", onResize);
        }
    }
});