import { defineType, defineField } from "sanity";

export const project = defineType({
  name: "project",
  title: "Project",
  type: "document",
  // Roles / Skills / My contribution 描述的是同一件事——「我在这个项目里做了什么」，
  // 详情页也早已把三者渲染在同一个区块下。这里让表单结构追上既有的渲染事实。
  fieldsets: [
    {
      name: "contribution",
      title: "My contribution",
      options: { collapsible: true, collapsed: false },
    },
  ],
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
      description: "Project type or category, e.g. 'Web App', 'Branding', etc.",
      validation: (Rule) => Rule.max(240),
    }),

    defineField({
      name: "contributors",
      title: "Contributors",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),

    defineField({
      name: "role",
      title: "Roles",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
      fieldset: "contribution",
    }),

    defineField({
      name: "tags",
      title: "Tags / Skills",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
      fieldset: "contribution",
    }),

    defineField({
      name: "myContribution",
      title: "My contribution",
      type: "array",
      of: [{ type: "block" }],
      fieldset: "contribution",
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
      name: "coverImage",
      title: "Cover image",
      type: "image",
      options: { hotspot: true },
      description:
        "Still image or animated GIF. Always required: this is what social shares and structured data use.",
      fields: [
        {
          name: "alt",
          title: "Alt text",
          type: "string",
          description: "Describe the image for screen readers and SEO.",
          validation: (Rule) => Rule.required(),
        },
      ],
      validation: (Rule) => Rule.required(),
    }),

    // 可选的封面视频：卡片 hover 时静音循环播放，封面图作为首帧/回退。
    // 社交分享图（Open Graph）与 JSON-LD 仍然只用 coverImage —— 那些场景不支持视频。
    defineField({
      name: "coverVideo",
      title: "Cover video (optional)",
      type: "file",
      options: { accept: "video/mp4,video/webm" },
      description:
        "Optional. Plays muted on hover over the project card. Keep it short and under ~10 MB; the cover image is still used everywhere a still is required.",
    }),

    // 正文：可增删、可排序的内容模块
    defineField({
      name: "sections",
      title: "Content sections",
      type: "array",
      of: [
        { type: "richTextSection" },
        { type: "mediaTextSection" },
        { type: "mediaSection" },
        { type: "mediaGroupSection" },
        { type: "quoteSection" },
      ],
      description: "Context, process, outcome — built from reorderable modules.",
    }),

    defineField({
      name: "visibility",
      title: "Project visibility",
      type: "boolean",
      initialValue: true,
    }),

    // defineField({
    //   name: "order",
    //   title: "Manual order",
    //   type: "number",
    //   description: "Lower numbers appear first in lists.",
    // }),

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

    // 画廊条目：每条都以一张图片为视觉锚点，可选地再挂一个视频。
    //
    // 图片必填的原因不只是「要有东西显示」：视频文件没有尺寸元数据，而 justified
    // 布局必须知道宽高比，所以图片同时承担了缩略图、视频封面帧、布局尺寸三个职责。
    // 这样就不存在「传了两个反而什么都不显示」的状态——不需要互斥校验。
    //
    // 沿用原来的匿名内联对象结构（不改成多类型联合数组），因为已有条目在库里
    // 不带 _type 字段，换成联合类型会让它们全部失效。
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
              title: "Image / GIF",
              type: "image",
              options: { hotspot: true },
              description:
                "Shown in the gallery grid. If you also attach a video below, this doubles as its poster frame. Required either way — it sets this entry's aspect ratio in the layout.",
              validation: (Rule) => Rule.required(),
            },
            {
              name: "video",
              title: "Video (optional)",
              type: "file",
              options: { accept: "video/mp4,video/webm" },
              description:
                "Optional. When set, the thumbnail gets a play badge and the video plays in the lightbox. MP4 or WebM, ideally under ~10 MB.",
            },
            {
              name: "alt",
              title: "Alt text (optional)",
              type: "string",
              description:
                "Describe the media for screen readers and SEO. Leave empty for purely decorative shots — the entry is then marked decorative and skipped by screen readers.",
            },
            {
              name: "caption",
              title: "Caption",
              type: "string",
            },
          ],
          preview: {
            select: { media: "image", title: "caption", alt: "alt", video: "video" },
            prepare({ media, title, alt, video }) {
              return {
                title: title || alt || "Gallery item",
                subtitle: video ? "Image + video" : undefined,
                media,
              };
            },
          },
        },
      ],
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
