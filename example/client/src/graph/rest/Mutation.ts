import { ModelType } from "graphql-ts-client-api";
import { publishResponseLog, publishRESTRequestLog } from "../common/HttpLog";
import { author$, author$$, book$, book$$, bookStore$, bookStore$$ } from "../__generated_rest_schema__/fetchers";
import { BASE_URL } from "./Contants";

export const BOOK_STORE_EDIT_INFO = bookStore$$.books(book$.id);

export type BookStoreInput = ModelType<typeof bookStore$$> & {
    readonly bookIds: readonly string[];
};

export async function saveBookStore(
    input: BookStoreInput
): Promise<ModelType<typeof BOOK_STORE_EDIT_INFO>> {
    const url = combine(BASE_URL, '/bookStore');
    const logId = publishRESTRequestLog(url, "PUT");
    const response = await fetch(url, {
        method: "PUT",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(input)
    });
    publishResponseLog(logId, response.text());
    if (response.status !== 200) {
        throw new Error('Failed to save BookStore');
    }
    return {
        id: input.id,
        name: input.name,
        books: input.bookIds?.map(id => ({id}))
    };
}

export async function deleteBookStore(id: string) {
    const url = combine(BASE_URL, `/bookStore/${encodeURIComponent(id)}`);
    const logId = publishRESTRequestLog(url, "DELETE");
    const response = await fetch(url, {
        method: "DELETE",
        headers: {
            'Content-Type': 'application/json',
        },
    });
    publishResponseLog(logId, response.text());
    if (response.status !== 200) {
        throw new Error('Failed to delete BookStore');
    }
}

//--------------------------------------------------------

export const BOOK_EDIT_INFO = book$$.store(bookStore$.id).authors(author$.id);

export type BookInput = ModelType<typeof bookStore$$> & {
    readonly storeId?: string;
    readonly authorIds: readonly string[];
};

export async function saveBook(
    input: BookInput
): Promise<ModelType<typeof BOOK_EDIT_INFO>> {
    const url = combine(BASE_URL, '/book');
    const logId = publishRESTRequestLog(url, "PUT");
    const response = await fetch(url, {
        method: "PUT",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(input)
    });
    publishResponseLog(logId, response.text());
    if (response.status !== 200) {
        throw new Error('Failed to save Book');
    }
    return {
        id: input.id,
        name: input.name,
        store: input.storeId !== undefined ? {id: input.storeId} : undefined,
        authors: input.authorIds?.map(id => ({id}))
    };
}

export async function deleteBook(id: string) {
    const url = combine(BASE_URL, `/book/${encodeURIComponent(id)}`);
    const logId = publishRESTRequestLog(url, "DELETE");
    const response = await fetch(url, {
        method: "DELETE",
        headers: {
            'Content-Type': 'application/json',
        },
    });
    publishResponseLog(logId, response.text());
    if (response.status !== 200) {
        throw new Error('Failed to delete Book');
    }
}

//--------------------------------------------------------

export const AUTHOR_EDIT_INFO = author$$.books(book$.id);

export type AuthorInput = ModelType<typeof author$$> & {
    readonly bookIds: readonly string[];
};

export async function saveAuthor(
    input: AuthorInput
): Promise<ModelType<typeof BOOK_STORE_EDIT_INFO>> {
    const url = combine(BASE_URL, '/author');
    const logId = publishRESTRequestLog(url, "PUT");
    const response = await fetch(url, {
        method: "PUT",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(input)
    });
    publishResponseLog(logId, response.text());
    if (response.status !== 200) {
        throw new Error('Failed to save Author');
    }
    return {
        id: input.id,
        name: input.name,
        books: input.bookIds?.map(id => ({id}))
    };
}

export async function deleteAuthor(id: string) {
    const url = combine(BASE_URL, `/author/${encodeURIComponent(id)}`);
    const logId = publishRESTRequestLog(url, "DELETE");
    const response = await fetch(url, {
        method: "DELETE",
        headers: {
            'Content-Type': 'application/json',
        },
    });
    publishResponseLog(logId, response.text());
    if (response.status !== 200) {
        throw new Error('Failed to delete Author');
    }
}

//--------------------------------------------------------

function combine(baseUrl: string, path: string): string {
    if (baseUrl.endsWith("/") && path.startsWith("/")) {
        return baseUrl + path.substring(1);
    }
    if (baseUrl.endsWith("/") || path.startsWith("/")) {
        return baseUrl + path;
    }
    return baseUrl + '/' + path;
}