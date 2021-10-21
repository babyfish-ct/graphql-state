import 'reflect-metadata';
import { Field, ObjectType } from 'type-graphql';

@ObjectType()
export class PageInfo {

    @Field(() => Boolean)
    readonly hasNextPage: boolean;

    @Field(() => Boolean)
    readonly hasPreviousPage: boolean;ß
}