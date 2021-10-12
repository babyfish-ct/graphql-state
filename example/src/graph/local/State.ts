import { makeStateFactory } from "graphql-state"
import { AuthorChangeEvent, BookChangeEvent, BookStoreChangeEvent } from "../../__generated/triggers";
import { Schema } from "../../__generated/TypedConfiguration";
import { stateManager } from "./App";
import { defaultData } from "./InitializeDefaultData";

const { createState } = makeStateFactory<Schema>();

export const bookStoreIdListState = createState(defaultData.storeIds, {
    mount: ctx => {
        const onBookStoreDelete = (e: BookStoreChangeEvent) => {
            if (e.changedType === "DELETE") {
                ctx(ctx().filter(id => id !== e.id));
            }
        };
        stateManager.addListeners({ "BookStore": onBookStoreDelete });
        return () => {
            stateManager.removeListeners({ "BookStore": onBookStoreDelete });
        }
    }
});

export const bookIdListState = createState(defaultData.bookIds, {
    mount: ctx => {
        const onBookDelete = (e: BookChangeEvent) => {
            if (e.changedType === "DELETE") {
                ctx(ctx().filter(id => id !== e.id));
            }
        };
        stateManager.addListeners({ "Book": onBookDelete });
        return () => {
            stateManager.removeListeners({ "Book": onBookDelete });
        }
    }
});

export const authorIdListState = createState(defaultData.authorIds, {
    mount: ctx => {
        const onAuthorDelete = (e: AuthorChangeEvent) => {
            if (e.changedType === "DELETE") {
                ctx(ctx().filter(id => id !== e.id));
            }
        };
        stateManager.addListeners({ "Author": onAuthorDelete });
        return () => {
            stateManager.removeListeners({ "Author": onAuthorDelete });
        }
    }
});

