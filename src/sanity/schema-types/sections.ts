// 项目正文的内容模块（page builder）。
//
// 与 gallery 的取舍：gallery 沿用匿名内联对象（已有 45 条数据不带 _type，
// 换成命名类型会失效）；sections 是全新字段，没有历史包袱，所以用命名类型 +
// _type 判别联合——TypeGen 能生成干净的类型，以后也能复用到别的文档类型上。
//
// 命名原则：字段按「含义」而非「外观」命名。mediaPosition 只有 left/right
// 两个受约束的取值，属于编辑决策；绝不引入 marginTop 之类的自由样式字段，
// 那会让 schema 变成样式表、以后改设计就得动数据。
import { defineType, defineField, defineArrayMember } from "sanity";
// 这个版本的 @sanity/icons 只提供子路径导出，没有顶层命名导出
import { BlockquoteIcon } from "@sanity/icons/Blockquote";
import { ImageIcon } from "@sanity/icons/Image";
import { ImagesIcon } from "@sanity/icons/Images";
import { SplitVerticalIcon } from "@sanity/icons/SplitVertical";
import { TextIcon } from "@sanity/icons/Text";

export const projectTextBlock = () =>
  defineArrayMember({
    type: "block",
    styles: [
      { title: "Normal", value: "normal" },
      { title: "H3", value: "h3" },
      { title: "Quote", value: "blockquote" },
    ],
    lists: [
      { title: "Bullet list", value: "bullet" },
      { title: "Numbered list", value: "number" },
    ],
    marks: {
      decorators: [
        { title: "Bold", value: "strong" },
        { title: "Italic", value: "em" },
      ],
      annotations: [
        {
          name: "link",
          title: "Link",
          type: "object",
          fields: [
            defineField({
              name: "href",
              title: "URL",
              type: "url",
              validation: (Rule) =>
                Rule.uri({ scheme: ["http", "https", "mailto", "tel"] }),
            }),
          ],
        },
      ],
    },
  });

/** 模块内的单个媒体位：图片 / GIF 必填，可选挂视频（与 gallery 条目同构） */
const sectionMedia = defineType({
  name: "sectionMedia",
  title: "Media",
  type: "object",
  icon: ImageIcon,
  fields: [
    defineField({
      name: "image",
      title: "Image / GIF",
      type: "image",
      options: { hotspot: true },
      description:
        "Shown in the layout. If you also attach a video below, this doubles as its poster frame. Required either way — it sets the aspect ratio.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "video",
      title: "Video (optional)",
      type: "file",
      options: { accept: "video/mp4,video/webm" },
      description:
        "Optional. When set, the image becomes the poster and the video plays in place. MP4 or WebM, ideally under ~10 MB.",
    }),
    defineField({
      name: "alt",
      title: "Alt text (optional)",
      type: "string",
      description:
        "Describe the media for screen readers and SEO. Leave empty for purely decorative shots.",
    }),
    defineField({
      name: "altTranslations",
      title: "Alt text translations",
      type: "localizedString",
    }),
    defineField({
      name: "caption",
      title: "Caption (optional)",
      type: "string",
    }),
    defineField({
      name: "captionTranslations",
      title: "Caption translations",
      type: "localizedString",
    }),
  ],
  preview: {
    select: { media: "image", title: "caption", alt: "alt", video: "video" },
    prepare({ media, title, alt, video }) {
      return {
        title: title || alt || "Media",
        subtitle: video ? "Image + video" : undefined,
        media,
      };
    },
  },
});

/** 纯文字模块：现有 body 内容的迁移目标 */
const richTextSection = defineType({
  name: "richTextSection",
  title: "Text",
  type: "object",
  icon: TextIcon,
  fields: [
    defineField({ name: "heading", title: "Heading (optional)", type: "string" }),
    defineField({
      name: "headingTranslations",
      title: "Heading translations",
      type: "localizedString",
    }),
    defineField({
      name: "content",
      title: "Content",
      type: "array",
      of: [projectTextBlock()],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "contentTranslations",
      title: "Content translations",
      type: "localizedProjectText",
    }),
  ],
  preview: {
    select: { heading: "heading", content: "content" },
    prepare({ heading, content }) {
      const firstBlock = Array.isArray(content)
        ? content.find((block: { _type?: string }) => block._type === "block")
        : undefined;
      const excerpt = (firstBlock as { children?: { text?: string }[] } | undefined)?.children
        ?.map((child) => child.text ?? "")
        .join("");

      return { title: heading || excerpt?.slice(0, 60) || "Text", subtitle: "Text" };
    },
  },
});

/** 图文模块：一个媒体 + 一段文字，媒体左右由编辑者决定 */
const mediaTextSection = defineType({
  name: "mediaTextSection",
  title: "Media + text",
  type: "object",
  icon: SplitVerticalIcon,
  fields: [
    defineField({ name: "heading", title: "Heading (optional)", type: "string" }),
    defineField({
      name: "headingTranslations",
      title: "Heading translations",
      type: "localizedString",
    }),
    defineField({
      name: "media",
      title: "Media",
      type: "sectionMedia",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "content",
      title: "Content",
      type: "array",
      of: [projectTextBlock()],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "contentTranslations",
      title: "Content translations",
      type: "localizedProjectText",
    }),
    defineField({
      name: "mediaPosition",
      title: "Media position",
      type: "string",
      options: {
        list: [
          { title: "Left", value: "left" },
          { title: "Right", value: "right" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "left",
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { heading: "heading", media: "media.image", position: "mediaPosition" },
    prepare({ heading, media, position }) {
      return {
        title: heading || "Media + text",
        subtitle: `Media + text · media ${position ?? "left"}`,
        media,
      };
    },
  },
});

/** 单媒体模块：一张大图 / 一段视频独占一段 */
const mediaSection = defineType({
  name: "mediaSection",
  title: "Media",
  type: "object",
  icon: ImageIcon,
  fields: [
    defineField({
      name: "media",
      title: "Media",
      type: "sectionMedia",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "fullWidth",
      title: "Full width",
      type: "boolean",
      description: "Break out of the text column and span the full content width.",
      initialValue: false,
    }),
  ],
  preview: {
    select: { media: "media.image", caption: "media.caption", fullWidth: "fullWidth" },
    prepare({ media, caption, fullWidth }) {
      return {
        title: caption || "Media",
        subtitle: fullWidth ? "Media · full width" : "Media",
        media,
      };
    },
  },
});

/** 媒体组模块：2–3 个媒体并排 */
const mediaGroupSection = defineType({
  name: "mediaGroupSection",
  title: "Media group",
  type: "object",
  icon: ImagesIcon,
  fields: [
    defineField({
      name: "items",
      title: "Media",
      type: "array",
      of: [defineArrayMember({ type: "sectionMedia" })],
      description: "Two or three items shown side by side.",
      validation: (Rule) => Rule.required().min(2).max(3),
    }),
    defineField({ name: "caption", title: "Caption (optional)", type: "string" }),
    defineField({
      name: "captionTranslations",
      title: "Caption translations",
      type: "localizedString",
    }),
  ],
  preview: {
    select: { items: "items", media: "items.0.image", caption: "caption" },
    prepare({ items, media, caption }) {
      const count = Array.isArray(items) ? items.length : 0;
      return { title: caption || "Media group", subtitle: `Media group · ${count} items`, media };
    },
  },
});

/** 引言模块：现有正文里已经在用 blockquote，单独成型 */
const quoteSection = defineType({
  name: "quoteSection",
  title: "Quote",
  type: "object",
  icon: BlockquoteIcon,
  fields: [
    defineField({
      name: "quote",
      title: "Quote",
      type: "text",
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "quoteTranslations",
      title: "Quote translations",
      type: "localizedText",
    }),
    defineField({ name: "attribution", title: "Attribution (optional)", type: "string" }),
    defineField({
      name: "attributionTranslations",
      title: "Attribution translations",
      type: "localizedString",
    }),
  ],
  preview: {
    select: { quote: "quote", attribution: "attribution" },
    prepare({ quote, attribution }) {
      return { title: quote?.slice(0, 60) || "Quote", subtitle: attribution || "Quote" };
    },
  },
});

export const sectionTypes = [
  sectionMedia,
  richTextSection,
  mediaTextSection,
  mediaSection,
  mediaGroupSection,
  quoteSection,
];
