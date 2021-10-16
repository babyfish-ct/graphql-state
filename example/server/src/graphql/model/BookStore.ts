import 'reflect-metadata';
import { Arg, Field, ObjectType } from 'type-graphql';
import { bookTable } from '../../dal/BookTable';
import { TBookStore } from '../../dal/BookStoreTable';
import { Book } from './Book';

@ObjectType()
export class BookStore {

    @Field(() => String)
    readonly id: string;

    @Field(() => String)
    readonly name: string;

    constructor(row: TBookStore) {
        this.id = row.id;
        this.name = row.name;
    }

    @Field(() => [Book])
    books(@Arg("name", () => String, { nullable: true}) name?: string): Book[] {
        if (name === undefined || name === "") {
            return bookTable
                .findByProp("storeId", this.id)
                .map(row => new Book(row));
        }
        return bookTable
            .find(
                [{prop: "storeId", value: this.id}], 
                row => row.name.toLowerCase().indexOf(name.toLowerCase()) !== -1
            )
            .map(row => new Book(row));
    }
}
