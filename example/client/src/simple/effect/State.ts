import { makeStateFactory } from "graphql-state";

const { createState, createComputedState } = makeStateFactory();

export const windowSizeState1 = createComputedState<WindowSize>(
    "effect-demo-window-size1", 
    () => {
        return { width: window.innerWidth, height: window.innerHeight };
    }, 
    {
        mount: ctx => {
            const onResize = () => { ctx.invalidate(); };
            window.addEventListener("resize", onResize);
            return () => {
                window.removeEventListener("resize", onResize);
            }
        }
    }
);

export const windowSizeState2 = createState<WindowSize>(
    "effect-demo-window-size2", 
    { 
        width: window.innerWidth, 
        height: window.innerHeight
    }, 
    {
        mount: ctx => {
            const onResize = () => { 
                ctx({ 
                    width: window.innerWidth, 
                    height: window.innerHeight
                });
            };
            window.addEventListener("resize", onResize);
            return () => {
                window.removeEventListener("resize", onResize);
            }
        }
    }
);

export interface WindowSize {
    readonly width: number,
    readonly height: number,
}