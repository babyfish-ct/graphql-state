const { GraphQLStateGenerator, loadLocalSchema } = require("graphql-ts-client-codegen");
const path = require("path");

const generator = new GraphQLStateGenerator({
    schemaLoader: async() => {
      return loadLocalSchema("scripts/local/schema.sdl");
    },
    targetDir: path.join(__dirname, "../../src/graph/__generated_local_schema__")
});
generator.generate();