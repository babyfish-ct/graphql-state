import { StateManager } from "graphql-state";
import UUIDClass from "uuidjs";
import { author$, author$$, book$, book$$, bookStore$, bookStore$$ } from "../../__generated/fetchers";
import { Schema } from "../../__generated/TypedConfiguration";

export function initializeDefaultData(stateManager: StateManager<Schema>) {

    stateManager.save(
        bookStore$$
        .books(book$.id), 
        [
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
    );

    stateManager.save(
        book$$
        .store(bookStore$.id)
        .authors(author$.id), 
        [
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
    );

    stateManager.save(
        author$$
        .books(book$.id), 
        [
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
            },
        ]
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

export const defaultData = {
    storeIds: [ oreillyId, manningId ],
    bookIds: [ learningGraphQLId, effectiveTypeScriptId, programmingTypeScriptId, graphQLInActionId ],
    authorIds: [ evePorcelloId, alexBanksId, danVanderkamId, borisChernyId, samerBunaId ]
};