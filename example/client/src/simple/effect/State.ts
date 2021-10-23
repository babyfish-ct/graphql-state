import { makeStateFactory } from "graphql-state";

const { createState, createComputedState } = makeStateFactory();

export const windowSizeState1 = createComputedState<WindowSize>(
    "windowSize1", 
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
    "windowSize2", 
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