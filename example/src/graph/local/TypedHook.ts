import { makeManagedObjectHooks } from "graphql-state";
import { Schema } from "../../__generated/TypedConfiguration";

export const { useObjects } = makeManagedObjectHooks<Schema>();