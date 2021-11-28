import 'reflect-metadata';
import { Arg, Field, ObjectType } from 'type-graphql';
import { bookTable } from '../../dal/BookTable';
import { TBookStore } from '../../dal/BookStoreTable';
import { Book } from './Book';
import { compare } from '../../common/Comparator';
import { Any } from './Any';

@ObjectType({implements: Any})
export class BookStore extends Any {

    @Field(() => String)
    readonly name: string;

    constructor(row: TBookStore) {
        super(row.id);
        this.name = row.name;
    }

    @Field(() => [Book])
    books(@Arg("name", () => String, { nullable: true}) name?: string): Book[] {
        let list: Book[];
        if (name === undefined || name === "") {
            list = bookTable
                .findByProp("storeId", this.id)
                .map(row => new Book(row));
        } else {
            list = bookTable
                .find(
                    [{prop: "storeId", value: this.id}], 
                    row => row.name.toLowerCase().indexOf(name.toLowerCase()) !== -1
                )
                .map(row => new Book(row));
        }
        return list.sort((a, b) => compare(a.name, b.name));
    }
}
