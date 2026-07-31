import { defineType, defineField } from "sanity";
// 这个版本的 @sanity/icons 只提供子路径导出，没有顶层命名导出
import { CaseIcon } from "@sanity/icons/Case";
import { DocumentIcon } from "@sanity/icons/Document";
import { ImageIcon } from "@sanity/icons/Image";
import { ImagesIcon } from "@sanity/icons/Images";
import { TextIcon } from "@sanity/icons/Text";
import { UserIcon } from "@sanity/icons/User";

import { projectTextBlock } from "./sections";

export const project = defineType({
  name: "project",
  title: "Project",
  type: "document",
  icon: CaseIcon,

  // 表单按编辑流程分页：先填基本信息 → 传封面 → 写正文 → 补贡献 → 加画廊。
  // Contribution 单独成页而不是 fieldset —— Contributors / My Roles / Skills /
  // My contribution 描述的是同一件事（谁参与、我在项目里做了什么），详情页也把它们渲染在
  // 同一个区块下，独立分页比折叠组的归属感更强。
  groups: [
    { name: "overview", title: "Overview", icon: DocumentIcon, default: true },
    { name: "translations", title: "Translations", icon: TextIcon },
    { name: "cover", title: "Cover", icon: ImageIcon },
    { name: "content", title: "Content", icon: TextIcon },
    { name: "contribution", title: "Contribution", icon: UserIcon },
    { name: "gallery", title: "Gallery", icon: ImagesIcon },
  ],

  // 列表排序选项。第一项与前台 PROJECTS_QUERY 的排序一致，
  // 这样 Studio 里看到的顺序就是访客在作品墙上看到的顺序。
  orderings: [
    {
      title: "Year (newest first)",
      name: "yearDesc",
      by: [
        { field: "year", direction: "desc" },
        { field: "_createdAt", direction: "desc" },
      ],
    },
    { title: "Title (A–Z)", name: "titleAsc", by: [{ field: "title", direction: "asc" }] },
    {
      title: "Recently updated",
      name: "updatedDesc",
      by: [{ field: "_updatedAt", direction: "desc" }],
    },
  ],

  fields: [
    defineField({
      name: "title",
      group: "overview",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      group: "overview",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "titleTranslations",
      group: "translations",
      title: "Title translations",
      type: "localizedString",
      description:
        "Italian is the primary public language. English falls back to the legacy Title field until translated.",
    }),

    // 一句话简介，用在卡片 / meta 描述
    defineField({
      name: "summary",
      group: "overview",
      title: "Summary",
      type: "string",
      description: "One-line or short paragraph used in cards and previews.",
      validation: (Rule) => Rule.max(240),
    }),
    defineField({
      name: "summaryTranslations",
      group: "translations",
      title: "Summary translations",
      type: "localizedString",
      description: "Localized card and metadata summary (maximum 240 characters).",
      validation: (Rule) =>
        Rule.custom<{ it?: string; en?: string } | undefined>((value) =>
          [value?.it, value?.en].some((item) => (item?.length ?? 0) > 240)
            ? "Each translated summary must be 240 characters or fewer"
            : true,
        ),
    }),

    defineField({
      name: "year",
      group: "overview",
      title: "Year",
      type: "number",
      description: "e.g. 2024",
      validation: (Rule) => Rule.min(2000).max(2100).warning("Check if the year is correct"),
    }),

    defineField({
      name: "projectType",
      group: "overview",
      title: "Project type",
      type: "string",
      description: "Project type or category, e.g. 'Web App', 'Branding', etc.",
      validation: (Rule) => Rule.max(240),
    }),
    defineField({
      name: "projectTypeTranslations",
      group: "translations",
      title: "Project type translations",
      type: "localizedString",
    }),

    defineField({
      name: "contributors",
      group: "contribution",
      title: "Contributors",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),

    defineField({
      name: "role",
      group: "contribution",
      title: "My Roles",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "roleTranslations",
      group: "translations",
      title: "My roles translations",
      type: "localizedStringList",
    }),

    defineField({
      name: "tags",
      group: "contribution",
      title: "Skills",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),

    defineField({
      name: "myContribution",
      group: "contribution",
      title: "My contribution",
      type: "array",
      of: [projectTextBlock()],
    }),
    defineField({
      name: "myContributionTranslations",
      group: "translations",
      title: "My contribution translations",
      type: "localizedProjectText",
    }),

    defineField({
      name: "client",
      group: "overview",
      title: "Client / Organization",
      type: "string",
    }),
    defineField({
      name: "location",
      group: "overview",
      title: "Location",
      type: "string",
    }),
    defineField({
      name: "locationTranslations",
      group: "translations",
      title: "Location translations",
      type: "localizedString",
    }),

    defineField({
      name: "coverImage",
      group: "cover",
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
        {
          name: "altTranslations",
          title: "Alt text translations",
          type: "localizedString",
        },
      ],
      validation: (Rule) => Rule.required(),
    }),

    // 可选的封面视频：卡片 hover 时静音循环播放，封面图作为首帧/回退。
    // 社交分享图（Open Graph）与 JSON-LD 仍然只用 coverImage —— 那些场景不支持视频。
    defineField({
      name: "coverVideo",
      group: "cover",
      title: "Cover video (optional)",
      type: "file",
      options: { accept: "video/mp4,video/webm" },
      description:
        "Optional. Plays muted on hover over the project card. Keep it short and under ~10 MB; the cover image is still used everywhere a still is required.",
    }),

    // 正文：可增删、可排序的内容模块
    defineField({
      name: "sections",
      group: "content",
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
      group: "overview",
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
      group: "overview",
      title: "Links",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "label", title: "Label", type: "string" },
            {
              name: "labelTranslations",
              title: "Label translations",
              type: "localizedString",
            },
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
      group: "gallery",
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
              name: "altTranslations",
              title: "Alt text translations",
              type: "localizedString",
            },
            {
              name: "caption",
              title: "Caption",
              type: "string",
            },
            {
              name: "captionTranslations",
              title: "Caption translations",
              type: "localizedString",
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
      year: "year",
      projectType: "projectType",
      visibility: "visibility",
      sectionCount: "sections.length",
    },
    prepare({ title, media, year, projectType, visibility, sectionCount }) {
      // 隐藏的项目在列表里本来完全看不出区别，标注出来免得改半天才发现没上线
      const isHidden = visibility === false;
      const meta = [
        year ? String(year) : null,
        projectType,
        sectionCount ? `${sectionCount} sections` : "no content",
      ].filter(Boolean);

      return {
        title: isHidden ? `${title ?? "Untitled"} — hidden` : (title ?? "Untitled"),
        media,
        subtitle: meta.join(" · "),
      };
    },
  },
});
