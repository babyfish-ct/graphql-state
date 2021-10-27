import 'reflect-metadata';
import { Arg, Field, Int, ObjectType } from 'type-graphql';
import { bookTable } from '../../dal/BookTable';
import { Book } from './Book';
import { TAuthor } from '../../dal/AuthorTable';
import { bookAuthorMappingTable } from '../../dal/BookAuthorMappingTable';
import { PageInfo } from './PageInfo';
import { compare } from '../../common/Comparator';
import { Any } from './Any';

@ObjectType({implements: Any})
export class Author extends Any {

    @Field(() => String)
    readonly name: string;

    constructor(row: TAuthor) {
        super(row.id);
        this.name = row.name;
    }

    @Field(() => [Book])
    books(@Arg("name", () => String, { nullable: true}) name?: string): Book[] {
        let list: Book[];
        if (name === undefined || name === null || name === "") {
            list = bookAuthorMappingTable
                .findByProp("authorId", this.id).map(mapping =>
                    new Book(bookTable.findNonNullById(mapping.bookId))
                );
        } else {
            list = bookAuthorMappingTable
                .findByProp("authorId", this.id)
                .map(mapping => {
                    const rows = bookTable.find(
                        [{prop: "id", value: mapping.bookId}],
                        row => row.name.toLowerCase().indexOf(name.toLowerCase()) !== -1
                    );
                    return rows.length !== 0 ? new Book(rows[0]) : undefined;
                })
                .filter(book => book !== undefined) as Book[];
        }
        return list.sort((a, b) => compare(a.name, b.name))
    }
}

@ObjectType()
export class AuthorConnection {

    constructor(totalCount: number, edges: readonly AuthorEdge[], pageInfo: PageInfo) {
        this.totalCount = totalCount;
        this.edges = edges;
        this.pageInfo = pageInfo;
    }

    @Field(() => Int)
    readonly totalCount: number;

    @Field(() => [AuthorEdge])
    readonly edges: readonly AuthorEdge[];

    @Field(() => PageInfo)
    readonly pageInfo: PageInfo;
}

@ObjectType()
export class AuthorEdge {

    constructor(node: Author, cursor: string) {
        this.node = node;
        this.cursor = cursor;
    }

    @Field(() => Author)
    readonly node: Author;

    @Field(() => String)
    readonly cursor: string;
}
