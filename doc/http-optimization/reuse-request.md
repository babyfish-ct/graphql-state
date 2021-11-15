# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[Documentation](../README.md)/[http optimization](./README.md)/Reuse request

```ts
import { FC, memo, Suspense } form 'react';
import { useQuery, StateManagerProvider } from 'graphql-state';
import { query$, bookStore$$, book$$, author$$ } from './generated';

export const BiggerShapeComponent: FC = memo(() => {
    const data = useQuery(
        query.findBookStores(
            bookStore$$
            .books(
                book$$
                .authors(
                    author$$
                )
            )
        )
    ); 
    
    return ...;
});

const SmallerShapeComponent: FC = memo(() => {
    const data = useQuery(
        query.findBookStores(
            bookStore$$
        )
    ); 
    
    return ...;
});

const App: FC = memo(() => {

    const stateManager = createStateManager();
    
    return (
        <StateManagerProvider stateManager={stateManager}>
            <Suspense fallback={<div>Loading...</div>}>
                <BiggerShapeComponent/>
                <SmallerShapeComponent/>
            </Suspense>
        </StateManagerProvider>
    );
});

function createStateManager() {
    return ...;
}

```

In [HTTP Optimization](./README.md), we discussed shapes and the relationship between shapes.

Obviously, in this example, the shape queried within BiggerShapeComponent includes the shape queried within SmallerShapeComponent, and the data that can be queried within SmallerShapeComponent must be included in the data returned by the internal query of BiggerShapeComponent.

In the end, SmallerShapeComponent will not send out HTTP requests. It will reuse the HTTP request of BiggerShapeComponent's internal query, steal the returned data and select the results it wants.

> Note
>
> Regardless of whether the HTTP request with lager shape has been sent out, As long as requests with larger shapes have not yet received response from the server, this optimization will take effect (if the larger shape request has already received the response, it will be optimized by cache, no chance to execute to HTTP request here)
> - If the HTTP request for a larger shape query has not been sent, please run the attached example and visit http://localhost:3000/graphState/httpOpitimizator/mergeDifferentShapes
> - For the case where the HTTP request for a larger query has been sent, please run the attached example and visit http://localhost:3000/graphState/httpOpitimizator/reusePendingQueries
-------------------------

[< Previous: Merge fragments](./merge-fragment.md) | [Back to parent: HTTP optimization](./README.md)
