import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  typegen: {
    path: "./src/**/*.{ts,tsx}",
    schema: "./src/sanity/schema.json",
    generates: "./src/sanity/sanity.types.ts",
  },
});
