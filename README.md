# A new react state management framework

### Notes, this is a new framework so that you can see nothing, the master branch will not be modified until the first version is ready

------

### 1. GraphQL style but not only GraphQL
   
1. If the server is not implemented based on GraphQL, the client will simulate a GraphQL implementation based on REST requests.

2. All the data, including the data returned by the GraphQL server, the data returned by the REST server, and the data unique to the client, are unified and managed together and GraphQL semantic APIs are provided.

### 2. Not only normalized cache, more database-like solution

1. Provide complete constraints to guarantee data integrity.

2. Cascade operations are supported.

3. Bidirectonal association is supported and the symmetry of bidirectonal association is strictly guaranteed. Developers can modify one end of the  bidirectonal association at will. If the other end has been cached, the other one will be automatically updated to guarantee the symmetry of the association and the consistency of the data. This solution can greatly reduce the probability that users have to implement customized updaters.

4. Supports behaviors similar to database row-level triggers, facilitating linkage modifications that cannot be automated by the framework because the business is too complex. In addition, this solution can concentrate all the update logic originally scattered in different UI components into the data model, reducing the redundancy of customized update logic.

### 3 Http request optimization


### 4. Not only gobal state, scopes are supported

Although global state can facilitate sharing of state across component boundaries, the cost is loss of isolation.

In a common case, when you need to maintain some selected state (for example: selectedData, currentData), the loss of isolation is a headache because the selection states of different components interfere with each other. Of course, you can choose to add more and more selection states to the global state to avoid this problem, but this will increase the complexity and reduce the maintainability.

This framework introduces a scope similar to most programming languages. In addition to the global scope, any react component can choose to open a child scope, and the child scope can inherit and override the state of the parent scope.

This solution allows users to no longer be limited to global state and local state, and users can balance between these two extremes at will.

### Next version. Transaction, SavePoint and Undo/Redo

1. Transaction: Similar to database transactions, you can rollback all uncommitted changes.

2. SavePoint: Unlike the SavePoint of the database, the SavePoint discussed here is outside of the transaction, so it can be used to simulate "long transactions" caused by asynchronous behavior.  Optimistic updates are easy to implement with this feature.

3. Undo/Redo: You can make your application support undo/redo. What needs to be reminded is that all undo logs will be automatically cleared by the framework after the data is modified by server-side, undo/redo is only for the temporary state of the client and is safe.
