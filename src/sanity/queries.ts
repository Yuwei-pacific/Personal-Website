// 所有 GROQ 查询的唯一出处。
// 规则（避免前端与查询各做一遍的双重逻辑）：
// - 可见性过滤只在 GROQ 里做（visibility != false），前端不再二次过滤
// - 排序只在 GROQ 里做：项目按年份倒序（无年份的排最后），同年按创建时间倒序
// 修改查询后运行 `npm run typegen` 重新生成 sanity.types.ts。
import { defineQuery } from "next-sanity";

// Project images, GIFs, and videos share one projection contract. Array
// callers add `_key` so live reordering can retain stable item identity.
const PROJECT_MEDIA_PROJECTION = /* groq */ `
  "alt": coalesce(
    select($locale == "it" => altTranslations.it, altTranslations.en),
    altTranslations.en,
    alt,
    altTranslations.it
  ),
  "caption": coalesce(
    select($locale == "it" => captionTranslations.it, captionTranslations.en),
    captionTranslations.en,
    caption,
    captionTranslations.it
  ),
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
  "title": coalesce(
    select($locale == "it" => titleTranslations.it, titleTranslations.en),
    titleTranslations.en,
    title,
    titleTranslations.it
  ),
  "summary": coalesce(
    select($locale == "it" => summaryTranslations.it, summaryTranslations.en),
    summaryTranslations.en,
    summary,
    summaryTranslations.it
  ),
  year,
  "projectType": coalesce(
    select($locale == "it" => projectTypeTranslations.it, projectTypeTranslations.en),
    projectTypeTranslations.en,
    projectType,
    projectTypeTranslations.it
  ),
  "slug": slug.current,
  "coverImage": coverImage{
    ...,
    "alt": coalesce(
      select($locale == "it" => altTranslations.it, altTranslations.en),
      altTranslations.en,
      alt,
      altTranslations.it
    ),
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
  "title": coalesce(
    select($locale == "it" => titleTranslations.it, titleTranslations.en),
    titleTranslations.en,
    title,
    titleTranslations.it
  ),
  order,
  skills
}`);

// 简历（education + experience 共用 "education" 文档类型，历史命名，见 schema 注释）
export const RESUME_QUERY = defineQuery(`*[_type == "education"] | order(order desc){
  _id,
  type,
  institution,
  "degree": coalesce(
    select($locale == "it" => degreeTranslations.it, degreeTranslations.en),
    degreeTranslations.en,
    degree,
    degreeTranslations.it
  ),
  "location": coalesce(
    select($locale == "it" => locationTranslations.it, locationTranslations.en),
    locationTranslations.en,
    location,
    locationTranslations.it
  ),
  "period": coalesce(
    select($locale == "it" => periodTranslations.it, periodTranslations.en),
    periodTranslations.en,
    period,
    periodTranslations.it
  ),
  "details": coalesce(
    select($locale == "it" => detailsTranslations.it, detailsTranslations.en),
    detailsTranslations.en,
    details,
    detailsTranslations.it
  ),
  order
}`);

// 项目详情页
export const PROJECT_QUERY = defineQuery(`*[_type == "project" && slug.current == $slug && visibility != false][0]{
  _id,
  "title": coalesce(
    select($locale == "it" => titleTranslations.it, titleTranslations.en),
    titleTranslations.en,
    title,
    titleTranslations.it
  ),
  "summary": coalesce(
    select($locale == "it" => summaryTranslations.it, summaryTranslations.en),
    summaryTranslations.en,
    summary,
    summaryTranslations.it
  ),
  "role": coalesce(
    select($locale == "it" => roleTranslations.it, roleTranslations.en),
    roleTranslations.en,
    role,
    roleTranslations.it
  ),
  tags,
  contributors,
  "slug": slug.current,
  year,
  "projectType": coalesce(
    select($locale == "it" => projectTypeTranslations.it, projectTypeTranslations.en),
    projectTypeTranslations.en,
    projectType,
    projectTypeTranslations.it
  ),
  client,
  "location": coalesce(
    select($locale == "it" => locationTranslations.it, locationTranslations.en),
    locationTranslations.en,
    location,
    locationTranslations.it
  ),
  "links": links[]{
    _key,
    url,
    "label": coalesce(
      select($locale == "it" => labelTranslations.it, labelTranslations.en),
      labelTranslations.en,
      label,
      labelTranslations.it
    )
  },
  "coverImage": {
    "url": coalesce(coverImage.asset->url, ""),
    "alt": coalesce(
      select($locale == "it" => coverImage.altTranslations.it, coverImage.altTranslations.en),
      coverImage.altTranslations.en,
      coverImage.alt,
      coverImage.altTranslations.it
    ),
    "mimeType": coverImage.asset->mimeType
  },
  "coverVideo": coverVideo.asset->{ url, mimeType },
  "gallery": gallery[]{
    _key,
    ${PROJECT_MEDIA_PROJECTION}
  },
  "myContribution": coalesce(
    select($locale == "it" => myContributionTranslations.it, myContributionTranslations.en),
    myContributionTranslations.en,
    myContribution,
    myContributionTranslations.it
  ),
  "sections": sections[]{
    _type,
    _key,
    _type == "richTextSection" => {
      "heading": coalesce(
        select($locale == "it" => headingTranslations.it, headingTranslations.en),
        headingTranslations.en,
        heading,
        headingTranslations.it
      ),
      "content": coalesce(
        select($locale == "it" => contentTranslations.it, contentTranslations.en),
        contentTranslations.en,
        content,
        contentTranslations.it
      )
    },
    _type == "quoteSection" => {
      "quote": coalesce(
        select($locale == "it" => quoteTranslations.it, quoteTranslations.en),
        quoteTranslations.en,
        quote,
        quoteTranslations.it
      ),
      "attribution": coalesce(
        select($locale == "it" => attributionTranslations.it, attributionTranslations.en),
        attributionTranslations.en,
        attribution,
        attributionTranslations.it
      )
    },
    _type == "mediaTextSection" => {
      "heading": coalesce(
        select($locale == "it" => headingTranslations.it, headingTranslations.en),
        headingTranslations.en,
        heading,
        headingTranslations.it
      ),
      "content": coalesce(
        select($locale == "it" => contentTranslations.it, contentTranslations.en),
        contentTranslations.en,
        content,
        contentTranslations.it
      ),
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
      "caption": coalesce(
        select($locale == "it" => captionTranslations.it, captionTranslations.en),
        captionTranslations.en,
        caption,
        captionTranslations.it
      ),
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
