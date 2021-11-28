import "reflect-metadata";
import { Field, InputType } from "type-graphql";
import { TBook } from "../../../dal/BookTable";

@InputType()
export class BookInput implements TBook {

    @Field(() => String)
    readonly id: string;

    @Field(() => String)
    readonly name: string;

    @Field(() => String, {nullable: true})
    readonly storeId?: string;

    @Field(() => [String])
    readonly authorIds: readonly string[];
}