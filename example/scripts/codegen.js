const { GraphQLStateGenerator, loadLocalSchema } = require("graphql-ts-client-codegen");
const path = require("path");

const generator = new GraphQLStateGenerator({
    schemaLoader: async() => {
      return loadLocalSchema("scripts/schema.sdl");
    },
    targetDir: path.join(__dirname, "../src/__generated")
});
generator.generate();