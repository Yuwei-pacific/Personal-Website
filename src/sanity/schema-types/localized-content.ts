import { defineArrayMember, defineField, defineType } from "sanity";

import { projectTextBlock } from "./sections";

/** Named Portable Text alias used by localized rich-text values. */
export const projectText = defineType({
  name: "projectText",
  title: "Project rich text",
  type: "array",
  of: [projectTextBlock()],
});

/** Named tag-list alias used for localized role lists. */
export const stringList = defineType({
  name: "stringList",
  title: "String list",
  type: "array",
  of: [defineArrayMember({ type: "string" })],
  options: { layout: "tags" },
});

// Keep the same editor-friendly shape used by Urlo Creativo:
// { _type: "localizedString", it: "…", en: "…" }.
// @sanity/language-filter then shows only the selected language field.
const localizedString = defineType({
  name: "localizedString",
  title: "Localized short text",
  type: "object",
  fields: [
    defineField({ name: "it", title: "Italiano", type: "string" }),
    defineField({ name: "en", title: "English", type: "string" }),
  ],
  preview: {
    select: { it: "it", en: "en" },
    prepare: ({ it, en }) => ({ title: it || en || "—" }),
  },
});

const localizedText = defineType({
  name: "localizedText",
  title: "Localized long text",
  type: "object",
  fields: [
    defineField({ name: "it", title: "Italiano", type: "text", rows: 4 }),
    defineField({ name: "en", title: "English", type: "text", rows: 4 }),
  ],
  preview: {
    select: { it: "it", en: "en" },
    prepare: ({ it, en }) => ({ title: it || en || "—" }),
  },
});

const localizedProjectText = defineType({
  name: "localizedProjectText",
  title: "Localized rich text",
  type: "object",
  fields: [
    defineField({ name: "it", title: "Italiano", type: "projectText" }),
    defineField({ name: "en", title: "English", type: "projectText" }),
  ],
});

const localizedStringList = defineType({
  name: "localizedStringList",
  title: "Localized string list",
  type: "object",
  fields: [
    defineField({ name: "it", title: "Italiano", type: "stringList" }),
    defineField({ name: "en", title: "English", type: "stringList" }),
  ],
});

export const localizedContentTypes = [
  projectText,
  stringList,
  localizedString,
  localizedText,
  localizedProjectText,
  localizedStringList,
];
