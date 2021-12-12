import { StateManager } from "graphql-state";
import UUIDClass from "uuidjs";
import { author$, author$$, book$, book$$, bookStore$, bookStore$$, query$ } from "../__generated_local_schema__/fetchers";
import { Schema } from "../__generated_local_schema__";

export function initializeDefaultData(stateManager: StateManager<Schema>) {

    stateManager.save(
        query$.bookStores(
            bookStore$$
            .books(book$.id)
        ),
        {
            bookStores: [
                { 
                    id: oreillyId, 
                    name: "O'REILLY", 
                    books: [{id: learningGraphQLId}, {id: effectiveTypeScriptId}, {id: programmingTypeScriptId}] 
                },
                { 
                    id: manningId, 
                    name: "MANNING", 
                    books: [{id: graphQLInActionId}] 
                }
            ]
        }
    );

    stateManager.save(
        query$.books(
            book$$
            .store(bookStore$.id)
            .authors(author$.id)
        ),
        {
            books: [
                { 
                    id: learningGraphQLId, 
                    name: "Learning GraphQL",
                    store: { id: oreillyId },
                    authors: [{ id: evePorcelloId }, { id: alexBanksId }]
                },
                { 
                    id: effectiveTypeScriptId, 
                    name: "Effective TypeScript",
                    store: { id: oreillyId },
                    authors: [{ id: danVanderkamId }]
                },
                { 
                    id: programmingTypeScriptId, 
                    name: "Programming TypeScript",
                    store: { id: oreillyId },
                    authors: [{ id: borisChernyId }]
                },
                { 
                    id: graphQLInActionId, 
                    name: "GraphQL in Action",
                    store: { id: manningId },
                    authors: [{ id: samerBunaId }]
                }
            ]
        }
    );

    stateManager.save(
        query$.authors(
            author$$
            .books(book$.id)
        ),
        {
            authors: [
                { 
                    id: evePorcelloId, 
                    name: "Eve Procello",
                    books: [{ id: learningGraphQLId }]
                },
                { 
                    id: alexBanksId, 
                    name: "Alex Banks",
                    books: [{ id: learningGraphQLId }]
                },
                { 
                    id: danVanderkamId, 
                    name: "Dan Vanderkam",
                    books: [{ id: effectiveTypeScriptId }]
                },
                { 
                    id: borisChernyId, 
                    name: "Boris Cherny",
                    books: [{ id: programmingTypeScriptId }]
                },
                { 
                    id: samerBunaId, 
                    name: "Samer Buna",
                    books: [{ id: graphQLInActionId }]
                }
            ]
        }
    );
}

const oreillyId = UUIDClass.generate();
const manningId = UUIDClass.generate();

const learningGraphQLId = UUIDClass.generate();
const effectiveTypeScriptId = UUIDClass.generate();
const programmingTypeScriptId = UUIDClass.generate();
const graphQLInActionId = UUIDClass.generate();

const evePorcelloId = UUIDClass.generate();
const alexBanksId = UUIDClass.generate();
const danVanderkamId = UUIDClass.generate();
const borisChernyId = UUIDClass.generate();
const samerBunaId = UUIDClass.generate();
