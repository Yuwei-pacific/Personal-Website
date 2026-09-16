// 所有 GROQ 查询的唯一出处。
// 规则（避免前端与查询各做一遍的双重逻辑）：
// - 可见性过滤只在 GROQ 里做（visibility != false），前端不再二次过滤
// - 排序只在 GROQ 里做：项目按年份倒序（无年份的排最后），同年按创建时间倒序
// - 本地化字段一律走下面的 localized()，不要手写 coalesce（见该函数注释）
// 修改查询后运行 `npm run typegen` 重新生成 sanity.types.ts。
import { defineQuery } from "next-sanity";

// 本地化字段取值 + 回退。
//
// 为什么不用 coalesce：coalesce 只在 null 时回退，而 GROQ 里空串和空数组都不算 null。
// 编辑把某一语言的字段删空（长度变 0）后，coalesce 会照常选中它，于是该语言页面
// 拿到空值：标题变成兜底文案、富文本整段消失、图片 alt 变成装饰性。另一种语言却正常。
//
// length() 对字符串 / 数组 / null 行为一致（空 → 0，null → null，两者都使 > 0 为假），
// 所以一个谓词就能同时覆盖短文本、富文本和字符串数组三种字段。
//
// 回退方向与原先的 coalesce(select($locale == "it" => .it, .en), .en, .it) 完全一致：
// 优先当前语言，其次另一语言，最后当前语言。差别仅在于空值现在会正确回退。
// 字段可传嵌套路径（如 "coverImage.altTranslations"）。
//
// 返回类型必须标成模板字面量类型，这不是装饰：next-sanity 的 ClientReturn 是拿
// 「查询字符串字面量」去查 SanityQueries 映射的，而普通函数的返回类型会被放宽成
// string，插值进模板后会让整个 defineQuery 失去字面量类型 —— 后果是查询结果
// 静默退化成 unknown，调用方全部报错。
//
// 例外：PROJECT_QUERY 即使标了字面量类型仍然对不上 —— 它约有 15 处插值，
// 生成的查询串约 7.5k 字符，超出 TypeScript 对模板字面量类型的替换量预算，
// 类型被降级后与 typegen 的 key 不再逐字符相等。该查询在调用处显式传入
// typegen 类型（见 projects/[slug]/project-data.ts）。
type LocalizedQuery<F extends string> = `select(
    $locale == "it" && length(${F}.it) > 0 => ${F}.it,
    length(${F}.en) > 0 => ${F}.en,
    length(${F}.it) > 0 => ${F}.it,
    null
  )`;

const localized = <F extends string>(field: F): LocalizedQuery<F> =>
  `select(
    $locale == "it" && length(${field}.it) > 0 => ${field}.it,
    length(${field}.en) > 0 => ${field}.en,
    length(${field}.it) > 0 => ${field}.it,
    null
  )` as LocalizedQuery<F>;

// Project images, GIFs, and videos share one projection contract. Array
// callers add `_key` so live reordering can retain stable item identity.
const PROJECT_MEDIA_PROJECTION = /* groq */ `
  "alt": ${localized("altTranslations")},
  "caption": ${localized("captionTranslations")},
  "image": image.asset->{
    url,
    mimeType,
    "width": metadata.dimensions.width,
    "height": metadata.dimensions.height
  },
  "video": video.asset->{ url, mimeType }
`;

// 首页项目列表
export const PROJECTS_QUERY = defineQuery(`*[_type == "project" && visibility != false]
  | order(coalesce(year, 0) desc, _createdAt desc){
  _id,
  "title": ${localized("titleTranslations")},
  "summary": ${localized("summaryTranslations")},
  year,
  "projectType": ${localized("projectTypeTranslations")},
  "slug": slug.current,
  "coverImage": coverImage{
    ...,
    "alt": ${localized("altTranslations")},
    asset->{
      _id,
      url,
      mimeType
    }
  },
  "coverVideo": coverVideo.asset->{ url, mimeType }
}`);

// 技能分类列表
export const SKILLS_QUERY = defineQuery(`*[_type == "skillCategory"] | order(order asc){
  _id,
  "title": ${localized("titleTranslations")},
  order,
  skills
}`);

// 简历（education + experience 共用 "education" 文档类型，历史命名，见 schema 注释）
export const RESUME_QUERY = defineQuery(`*[_type == "education"] | order(order desc){
  _id,
  type,
  institution,
  "degree": ${localized("degreeTranslations")},
  "location": ${localized("locationTranslations")},
  "period": ${localized("periodTranslations")},
  "details": ${localized("detailsTranslations")},
  order
}`);

// 项目详情页
export const PROJECT_QUERY = defineQuery(`*[_type == "project" && slug.current == $slug && visibility != false][0]{
  _id,
  "title": ${localized("titleTranslations")},
  "summary": ${localized("summaryTranslations")},
  "role": ${localized("roleTranslations")},
  tags,
  contributors,
  "slug": slug.current,
  year,
  "projectType": ${localized("projectTypeTranslations")},
  client,
  "location": ${localized("locationTranslations")},
  "links": links[]{
    _key,
    url,
    "label": ${localized("labelTranslations")}
  },
  "coverImage": {
    "url": coalesce(coverImage.asset->url, ""),
    "alt": ${localized("coverImage.altTranslations")},
    "mimeType": coverImage.asset->mimeType
  },
  "coverVideo": coverVideo.asset->{ url, mimeType },
  "gallery": gallery[]{
    _key,
    ${PROJECT_MEDIA_PROJECTION}
  },
  "myContribution": ${localized("myContributionTranslations")},
  "sections": sections[]{
    _type,
    _key,
    _type == "richTextSection" => {
      "heading": ${localized("headingTranslations")},
      "content": ${localized("contentTranslations")}
    },
    _type == "quoteSection" => {
      "quote": ${localized("quoteTranslations")},
      "attribution": ${localized("attributionTranslations")}
    },
    _type == "mediaTextSection" => {
      "heading": ${localized("headingTranslations")},
      "content": ${localized("contentTranslations")},
      mediaPosition,
      "media": media{
        ${PROJECT_MEDIA_PROJECTION}
      }
    },
    _type == "mediaSection" => {
      fullWidth,
      "media": media{
        ${PROJECT_MEDIA_PROJECTION}
      }
    },
    _type == "mediaGroupSection" => {
      "caption": ${localized("captionTranslations")},
      "items": items[]{
        _key,
        ${PROJECT_MEDIA_PROJECTION}
      }
    }
  }
}`);

// generateStaticParams：所有可见项目的 slug
export const PROJECT_SLUGS_QUERY = defineQuery(
  `*[_type == "project" && defined(slug.current) && visibility != false].slug.current`
);

// sitemap：slug + 最近更新时间
export const PROJECT_SITEMAP_QUERY = defineQuery(`*[_type == "project" && defined(slug.current) && visibility != false]{
  "slug": slug.current,
  _updatedAt
}`);
