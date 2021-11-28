import "reflect-metadata";
import { Field, InputType } from "type-graphql";
import { TAuthor } from "../../../dal/AuthorTable";

@InputType()
export class AuthorInput implements TAuthor {

    @Field(() => String)
    readonly id: string;

    @Field(() => String)
    readonly name: string;

    @Field(() => [String])
    readonly bookIds: readonly string[];
}