const { GraphStateGenerator, loadLocalSchema } = require("graphql-ts-client-codegen");
const path = require("path");
const generator = new GraphStateGenerator({
    schemaLoader: async() => {
      return loadLocalSchema("src/__tests__/schema.sdl");
    },
    targetDir: path.join(__dirname, "../src/__tests__/__generated")
});
generator.generate();