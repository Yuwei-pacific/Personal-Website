// schemas/project.ts
import { defineType, defineField } from "sanity";

export const project = defineType({
  name: "project",
  title: "Project",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "subtitle",
      title: "Subtitle",
      type: "string",
      description: "One-line summary of the project.",
    }),
    defineField({
      name: "coverImage",
      title: "Cover image",
      type: "image",
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "year",
      title: "Year",
      type: "number",
      description: "e.g. 2024",
    }),
    defineField({
      name: "projectType",
      title: "Project type",
      type: "string",
      options: {
        list: [
          { title: "Client", value: "client" },
          { title: "School", value: "school" },
          { title: "Personal", value: "personal" },
          { title: "Collaboration", value: "collab" },
        ],
        layout: "radio",
      },
    }),
    defineField({
      name: "role",
      title: "Role",
      type: "array",
      of: [{ type: "string" }],
      options: {
        layout: "tags",
      },
    }),
    defineField({
      name: "overview",
      title: "Overview",
      type: "array",
      of: [{ type: "block" }],
      description: "Short intro to the project.",
    }),
    defineField({
      name: "problem",
      title: "Problem / Context",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "goals",
      title: "Goals",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "processSections",
      title: "Process sections",
      type: "array",
      of: [
        {
          type: "object",
          name: "section",
          fields: [
            { name: "title", title: "Title", type: "string" },
            {
              name: "body",
              title: "Body",
              type: "array",
              of: [{ type: "block" }],
            },
            {
              name: "image",
              title: "Image",
              type: "image",
              options: { hotspot: true },
            },
          ],
        },
      ],
    }),
    defineField({
      name: "gallery",
      title: "Gallery",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
    }),
    defineField({
      name: "urls",
      title: "URLs",
      type: "string",
    }),
    defineField({
      name: "client",
      title: "Client / Organization",
      type: "string",
    }),
    defineField({
      name: "location",
      title: "Location",
      type: "string",
    }),
    defineField({
      name: "myContribution",
      title: "My contribution",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "order",
      title: "Manual order",
      type: "number",
      description: "Lower numbers appear first in lists.",
    }),
  ],

  preview: {
    select: {
      title: "title",
      media: "coverImage",
      subtitle: "year",
    },
    prepare({ title, media, subtitle }) {
      return {
        title,
        media,
        subtitle: subtitle ? String(subtitle) : "",
      };
    },
  },
});
// End of file: sanity/personal-website/schemaTypes/project.ts