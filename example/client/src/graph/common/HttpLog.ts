import { makeStateFactory } from "graphql-state";
import { produce } from "immer";

let idSequence = 0;
const { createState } = makeStateFactory();

export interface HttpLog {
    readonly id: number;
    readonly time: Date;
    readonly response?: any;

    // GraphQL HTTP request fields
    readonly body?: string; // always be undefined for REST demo
    readonly variables?: any; // always be undefined for REST demo
    
    // REST HTTP reqeust fields
    readonly url?: string; // always be undefined for GraphQL demo
    readonly method?: "GET" | "PUT" | "DELETE"; // always be undefined for GraphQL demo
}

export function publishGraphQLRequestLog(
    body: string,
    variables: any
): number {
    const id = idSequence++;
    window.dispatchEvent(
        new CustomEvent("http-request-event", { 
            detail: {
                log: {
                    id,
                    time: new Date(),
                    body,
                    variables
                }
            } 
        })
    ); 
    return id;
}

export function publishRESTRequestLog(
    url: string,
    method?: "GET" | "PUT" | "DELETE"
): number {
    const id = idSequence++;
    window.dispatchEvent(
        new CustomEvent("http-request-event", { 
            detail: {
                log: {
                    id,
                    time: new Date(),
                    url,
                    method: method ?? "GET"
                }
            } 
        })
    ); 
    return id;
}

export function publishResponseLog(
    id: number,
    response: any
) {
    window.dispatchEvent(
        new CustomEvent("http-response-event", { 
            detail: {
                id,
                response
            } 
        })
    );
}

export const httpLogListState = createState<ReadonlyArray<HttpLog>>(
    "graphql-demo-httpLogs", 
    [], 
    {
        mount: ctx => {
            const onRequest = (e: CustomEvent) => {
                const arr = [...ctx(), e.detail.log];
                if (arr.length > 50) {
                    arr.splice(0, arr.length - 50);
                }
                ctx(arr);
            };
            const onResponse = (e: CustomEvent) => {
                ctx(produce(ctx(), draft => {
                    const log = draft.find(log => log.id === e.detail.id);
                    if (log !== undefined) {
                        if (log.url !== undefined && typeof e.detail.response === "object") {
                            // Deeply clone the response for REST mode,
                            // Because immer will freeze the object
                            // which will be changed by RESTLoader later
                            log.response = JSON.parse(JSON.stringify(e.detail.response));
                        } else {
                            log.response = e.detail.response;
                        }
                    }
                }));
            };
            const win = window as any;
            win.addEventListener("http-request-event", onRequest);
            win.addEventListener("http-response-event", onResponse);
            return () => {
                win.removeEventListener("http-request-event", onRequest);
                win.removeEventListener("http-response-event", onResponse);
            }
        }
    }
);
