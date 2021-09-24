import { SchemaMetadata } from "./SchemaMetadata";

export class TypeMetadata {

    constructor(
        readonly schema: SchemaMetadata,
        readonly category: TypeMetadataCategory, 
        readonly name: string,
    ) {}
}

export type TypeMetadataCategory = "OBJECT" | "CONNECTION" | "EDGE";