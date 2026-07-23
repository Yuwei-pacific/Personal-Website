import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";

import { dataset, projectId } from "./config";
import { schemaTypes } from "./schema-types";

export default defineConfig({
  basePath: "/studio",
  projectId,
  dataset,

  plugins: [structureTool()],

  schema: {
    types: schemaTypes,
  },
});
