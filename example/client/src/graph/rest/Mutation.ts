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
    await execute('/bookStore', 'PUT', input);
    return {
        id: input.id,
        name: input.name,
        books: input.bookIds?.map(id => ({id}))
    };
}

export async function deleteBookStore(id: string) {
    await execute(`/bookStore/${encodeURIComponent(id)}`, 'DELETE');
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
    await execute('/book', 'PUT', input);
    return {
        id: input.id,
        name: input.name,
        store: input.storeId !== undefined ? {id: input.storeId} : undefined,
        authors: input.authorIds?.map(id => ({id}))
    };
}

export async function deleteBook(id: string) {
    await execute(`/book/${encodeURIComponent(id)}`, 'DELETE');
}

//--------------------------------------------------------

export const AUTHOR_EDIT_INFO = author$$.books(book$.id);

export type AuthorInput = ModelType<typeof author$$> & {
    readonly bookIds: readonly string[];
};

export async function saveAuthor(
    input: AuthorInput
): Promise<ModelType<typeof BOOK_STORE_EDIT_INFO>> {
    await execute('/author', 'PUT', input);
    return {
        id: input.id,
        name: input.name,
        books: input.bookIds?.map(id => ({id}))
    };
}

export async function deleteAuthor(id: string) {
    await execute(`/author/${encodeURIComponent(id)}`, 'DELETE');
}

//--------------------------------------------------------

async function execute(path: string, method: "PUT" | "DELETE", body?: any) {
    const url = combine(BASE_URL, path);
    const logId = publishRESTRequestLog(url, method, body);
    const response = await fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: body !== undefined ? JSON.stringify(body) : undefined
    });
    publishResponseLog(logId, response.text());
    if (response.status !== 200) {
        throw new Error(`Cannot ${method} ${url}`);
    }
}

function combine(baseUrl: string, path: string): string {
    if (baseUrl.endsWith("/") && path.startsWith("/")) {
        return baseUrl + path.substring(1);
    }
    if (baseUrl.endsWith("/") || path.startsWith("/")) {
        return baseUrl + path;
    }
    return baseUrl + '/' + path;
}