// 所有 GROQ 查询的唯一出处。
// 规则（避免前端与查询各做一遍的双重逻辑）：
// - 可见性过滤只在 GROQ 里做（visibility != false），前端不再二次过滤
// - 排序只在 GROQ 里做：项目按年份倒序（无年份的排最后），同年按创建时间倒序
// 修改查询后运行 `npm run typegen` 重新生成 sanity.types.ts。
import { defineQuery } from "next-sanity";

// 首页项目列表
export const PROJECTS_QUERY = defineQuery(`*[_type == "project" && visibility != false]
  | order(coalesce(year, 0) desc, _createdAt desc){
  _id,
  title,
  summary,
  year,
  projectType,
  "slug": slug.current,
  "coverImage": coverImage{
    ...,
    asset->{
      _id,
      url
    }
  }
}`);

// 技能分类列表
export const SKILLS_QUERY = defineQuery(`*[_type == "skillCategory"] | order(order asc){
  _id,
  title,
  order,
  skills
}`);

// 简历（education + experience 共用 "education" 文档类型，历史命名，见 schema 注释）
export const RESUME_QUERY = defineQuery(`*[_type == "education"] | order(order desc){
  _id,
  type,
  institution,
  degree,
  location,
  period,
  details,
  order
}`);

// 项目详情页
export const PROJECT_QUERY = defineQuery(`*[_type == "project" && slug.current == $slug && visibility != false][0]{
  _id,
  title,
  summary,
  role,
  tags,
  contributors,
  "slug": slug.current,
  year,
  projectType,
  client,
  location,
  links,
  "coverImage": { "url": coalesce(coverImage.asset->url, ""), "alt": coverImage.alt },
  "gallery": gallery[]{
    "url": coalesce(image.asset->url, ""),
    alt,
    caption,
    "width": image.asset->metadata.dimensions.width,
    "height": image.asset->metadata.dimensions.height
  },
  body,
  myContribution
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
