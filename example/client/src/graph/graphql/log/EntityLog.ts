import {EntityEvictEvent, EntityChangeEvent, makeStateFactory} from "graphql-state";
import { Schema } from "../../__generated_graphql_schema__";

let idSequence = 0;
const { createState } = makeStateFactory<Schema>();

export interface EntityLog {
    readonly id: number;
    readonly time: Date;
    readonly event: EntityEvictEvent | EntityChangeEvent;
}

export function publishEntityLog(
    event: EntityEvictEvent | EntityChangeEvent
): number {
    const id = idSequence++;
    window.dispatchEvent(
        new CustomEvent("entity-event", { 
            detail: {
                log: {
                    id,
                    time: new Date(),
                    event
                }
            } 
        })
    ); 
    return id;
}

export const entityLogListState = createState<ReadonlyArray<EntityLog>>(
    "graphql-demo-entityLogs", 
    [], 
    {
        mount: ctx => {
            const onEntityEvent = (e: CustomEvent) => {
                const arr = [...ctx(), e.detail.log];
                if (arr.length > 50) {
                    arr.splice(0, arr.length - 50);
                }
                ctx(arr);
            };
            const win = window as any;
            win.addEventListener("entity-event", onEntityEvent);
            return () => {
                win.removeEventListener("entity-event", onEntityEvent);
            }
        }
    }
);
