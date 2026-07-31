import { languageFilter } from "@sanity/language-filter";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";

import { defaultLocale, localeLabels, locales } from "../i18n/config";
import { dataset, projectId } from "./config";
import { schemaTypes } from "./schema-types";

export default defineConfig({
  basePath: "/studio",
  projectId,
  dataset,

  plugins: [
    structureTool(),
    languageFilter({
      supportedLanguages: locales.map((locale) => ({
        id: locale,
        title: localeLabels[locale],
      })),
      defaultLanguages: [defaultLocale],
      documentTypes: ["project", "education", "skillCategory"],
      filterField: (enclosingType, member, selectedLanguages) =>
        !enclosingType.name.startsWith("localized") ||
        ("kind" in member &&
          member.kind === "field" &&
          selectedLanguages.includes(member.name)),
    }),
  ],

  schema: {
    types: schemaTypes,
  },
});
