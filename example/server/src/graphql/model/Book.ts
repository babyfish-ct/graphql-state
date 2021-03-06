import 'reflect-metadata';
import { Arg, Field, Int, ObjectType } from 'type-graphql';
import { TBook } from '../../dal/BookTable';
import { bookStoreTable, TBookStore } from '../../dal/BookStoreTable';
import { BookStore } from './BookStore';
import { Author } from './Author';
import { bookAuthorMappingTable } from '../../dal/BookAuthorMappingTable';
import { authorTable } from '../../dal/AuthorTable';
import { PageInfo } from './PageInfo';
import { compare } from '../../common/Comparator';
import { Any } from './Any';

@ObjectType({implements: Any})
export class Book extends Any {

    @Field(() => String)
    readonly name: string;

    readonly storeId?: string;

    constructor(row: TBook) {
        super(row.id);
        this.name = row.name;
        this.storeId = row.storeId;
    }

    @Field(() => BookStore, { nullable: true })
    store(): BookStore | undefined {
        if (this.storeId === undefined) {
            return undefined;
        }
        return new BookStore(bookStoreTable.findNonNullById(this.storeId));
    }

    @Field(() => [Author])
    authors(@Arg("name", () => String, { nullable: true}) name?: string): Author[] {
        let list: Author[];
        if (name === undefined || name === "") {
            list = bookAuthorMappingTable
                .findByProp("bookId", this.id).map(mapping =>
                    new Author(authorTable.findNonNullById(mapping.authorId))
                );
        } else {
            list = bookAuthorMappingTable
                .findByProp("bookId", this.id)
                .map(mapping => {
                    const rows = authorTable.find(
                        [{prop: "id", value: mapping.authorId}],
                        row => row.name.toLowerCase().indexOf(name.toLowerCase()) !== -1
                    );
                    return rows.length !== 0 ? new Author(rows[0]) : undefined;
                })
                .filter(author => author !== undefined) as Author[];
        }
        return list.sort((a, b) => compare(a.name, b.name));
    }
}

@ObjectType()
export class BookConnection {

    constructor(totalCount: number, edges: readonly BookEdge[], pageInfo: PageInfo) {
        this.totalCount = totalCount;
        this.edges = edges;
        this.pageInfo = pageInfo;
    }

    @Field(() => Int)
    readonly totalCount: number;

    @Field(() => [BookEdge])
    readonly edges: readonly BookEdge[];

    @Field(() => PageInfo)
    readonly pageInfo: PageInfo;
}

@ObjectType()
export class BookEdge {

    constructor(node: Book, cursor: string) {
        this.node = node;
        this.cursor = cursor;
    }

    @Field(() => Book)
    readonly node: Book;

    @Field(() => String)
    readonly cursor: string;
}
