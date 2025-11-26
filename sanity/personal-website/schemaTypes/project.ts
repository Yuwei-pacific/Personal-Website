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

    // 一句话简介，用在卡片 / meta 描述
    defineField({
      name: "summary",
      title: "Summary",
      type: "string",
      description: "One-line or short paragraph used in cards and previews.",
      validation: (Rule) => Rule.max(240),
    }),

    // 正文
    defineField({
      name: "body",
      title: "Description body",
      type: "array",
      of: [{ type: "block" }],
      description: "Full content: context, process, outcome.",
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
      validation: (Rule) => Rule.min(2000).max(2100).warning("Check if the year is correct"),
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
      title: "Roles",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),

    defineField({
      name: "tags",
      title: "Tags / Skills",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),

    defineField({
      name: "gallery",
      title: "Gallery",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "image",
              title: "Image",
              type: "image",
              options: { hotspot: true },
            },
            {
              name: "alt",
              title: "Alt text",
              type: "string",
            },
            {
              name: "caption",
              title: "Caption",
              type: "string",
            },
          ],
          preview: {
            select: { media: "image", title: "caption" },
          },
        },
      ],
    }),

    defineField({
      name: "links",
      title: "Links",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "label", title: "Label", type: "string" },
            { name: "url", title: "URL", type: "url" },
          ],
        },
      ],
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
      name: "isFeatured",
      title: "Featured project",
      type: "boolean",
      initialValue: false,
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