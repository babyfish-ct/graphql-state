import 'reflect-metadata';
import { Field, ID, InterfaceType } from 'type-graphql';

@InterfaceType({ autoRegisterImplementations: false })
export abstract class Any {

    @Field(() => String)
    readonly id: string;

    constructor(id: string) {
        this.id = id;
    }
}
