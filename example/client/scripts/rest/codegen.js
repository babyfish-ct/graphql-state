const { GraphQLStateGenerator, loadLocalSchema } = require("graphql-ts-client-codegen");
const path = require("path");

const generator = new GraphQLStateGenerator({
    schemaLoader: async() => {
      return loadLocalSchema("scripts/rest/schema.sdl");
    },
    targetDir: path.join(__dirname, "../../src/graph/__generated_rest_schema__")
});
generator.generate();