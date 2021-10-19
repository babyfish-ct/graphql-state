import "reflect-metadata";
import { Field, InputType } from "type-graphql";
import { TBookStore } from "../../../dal/BookStoreTable";

@InputType()
export class BookStoreInput implements TBookStore {

    @Field(() => String)
    readonly id: string;

    @Field(() => String)
    readonly name: string;

    @Field(() => [String])
    readonly bookIds: readonly string[];
}