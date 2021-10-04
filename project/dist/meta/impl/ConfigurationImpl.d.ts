import { Fetcher } from "graphql-ts-client-api";
import { Configuration } from "../Configuration";
import { ScheamType } from "../SchemaType";
export declare function newConfiguration<TSchema extends ScheamType>(...fethers: Fetcher<any, {}, {}>[]): Configuration<TSchema>;
