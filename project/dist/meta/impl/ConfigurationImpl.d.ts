import { Fetcher } from "graphql-ts-client-api";
import { Configuration } from "../Configuration";
import { SchemaType } from "../SchemaType";
export declare function newConfiguration<TSchema extends SchemaType>(...fetchers: Fetcher<string, object, object>[]): Configuration<TSchema>;
