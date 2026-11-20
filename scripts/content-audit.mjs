// 内容体检：逐个项目列出 Sanity 里哪些字段填了、哪些还缺。只读，不改任何内容。
//
// 读的是 raw 视图（已发布 + 草稿都看），所以能看出「已发布但有未发布改动」和「只有草稿」的项目。
// 用 .env.local 里的项目配置和只读 token；没有 token 时只能看到已发布的文档。
//
//   npm run audit:content
import { createClient } from "@sanity/client";

try {
  process.loadEnvFile(".env.local");
} catch {
  // 没有 .env.local 时直接读进程环境变量（比如 CI 里注入的）
}

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
if (!projectId || !dataset) {
  console.error("缺少 NEXT_PUBLIC_SANITY_PROJECT_ID / NEXT_PUBLIC_SANITY_DATASET");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  token: process.env.SANITY_READ_TOKEN,
  useCdn: false,
  perspective: "raw",
});

// 体检阈值：封面超过这个大小就提示压缩
const COVER_MAX_MB = 1.5;
// 正文里的视频超过这个大小就提示压缩（Studio 里的说明也是这个数）
const VIDEO_MAX_MB = 10;

// 正文图片够不够大。和 src/components/projects/section-media.tsx 是同一套规则，那边改了这里要跟着改：
// - 两种位置在 1440 宽屏幕上的显示宽度（CSS 像素）：正文栏约 1015，通栏约 1360；媒体组按个数平分
// - 上传的图至少要有显示宽度的 1.5 倍，不然在高分屏上是糊的
// - 宽高比小于 1.3 的算偏高，页面上限高显示，不查宽度；有偏高媒体的组排在正文栏
const SLOT_WIDTH = { column: 1015, full: 1360 };
const MIN_DENSITY = 1.5;
const TALL_ASPECT = 1.3;

// 一个媒体位里体检要看的东西
const MEDIA = `{
  "width": image.asset->metadata.dimensions.width,
  "height": image.asset->metadata.dimensions.height,
  "videoSize": video.asset->size,
  "alt": altTranslations
}`;

const docs = await client.fetch(`*[_type == "project"] | order(coalesce(year, 0) desc, _id asc){
  _id, year, featured, featuredOrder, client, contributors, tags,
  "slug": slug.current,
  titleTranslations, summaryTranslations, projectTypeTranslations,
  roleTranslations, locationTranslations, myContributionTranslations,
  "coverAlt": coverImage.altTranslations,
  "cover": coverImage.asset->{ mimeType, size, "width": metadata.dimensions.width },
  "hasVideo": defined(coverVideo.asset),
  "sections": sections[]._type,
  "sectionMedia": sections[]{
    _type, fullWidth,
    "media": media${MEDIA},
    "items": items[]${MEDIA}
  },
  "galleryCount": count(gallery),
  // length(null) 是 null，取反仍是 null，会被当成「不满足」—— 先 coalesce 成 0
  "galleryNoAlt": count(gallery[coalesce(length(altTranslations.it), 0) == 0 && coalesce(length(altTranslations.en), 0) == 0]),
  "linkCount": count(links)
}`);

// 与 queries.ts 的 localized() 同一判断：空串 / 空数组算没填
const filled = (value) => (value == null ? false : typeof value === "string" ? value.trim().length > 0 : Array.isArray(value) ? value.length > 0 : true);
const langs = (field) => `${filled(field?.it) ? "it" : "--"}/${filled(field?.en) ? "en" : "--"}`;
const complete = (field) => filled(field?.it) && filled(field?.en);
const gap = (label, field) =>
  filled(field?.it) || filled(field?.en) ? `${label} 缺翻译（${langs(field)}）` : `${label} 没填`;

const translatable = {
  title: "titleTranslations",
  summary: "summaryTranslations",
  type: "projectTypeTranslations",
  role: "roleTranslations",
  location: "locationTranslations",
  myContribution: "myContributionTranslations",
};

const publishedIds = new Set(docs.filter((d) => !d._id.startsWith("drafts.")).map((d) => d._id));
const draftIds = new Set(docs.filter((d) => d._id.startsWith("drafts.")).map((d) => d._id.slice(7)));

function status(id) {
  if (id.startsWith("drafts.")) return publishedIds.has(id.slice(7)) ? null : "仅草稿";
  return draftIds.has(id) ? "已发布 · 有未发布改动" : "已发布";
}

const isTall = (media) => media.width / media.height < TALL_ASPECT;

// 正文媒体的待办：图偏小、视频偏大、没有 alt。模块序号从 1 起，和 Studio 里的顺序一致
function sectionMediaTodos(sections) {
  const todos = [];
  let noAlt = 0;
  let total = 0;

  (sections ?? []).forEach((section, index) => {
    const items = (section.items ?? [section.media]).filter((media) => media?.width && media?.height);
    if (!items.length) return;

    const isGroup = Boolean(section.items);
    const slot = isGroup ? (items.some(isTall) ? "column" : "full") : section.fullWidth ? "full" : "column";
    const needed = Math.round((SLOT_WIDTH[slot] / items.length) * MIN_DENSITY);
    const where = isGroup ? `${items.length} 个一组` : slot === "full" ? "通栏" : "正文栏";

    for (const media of items) {
      total += 1;
      if (!filled(media.alt?.it) && !filled(media.alt?.en)) noAlt += 1;
      if (!isTall(media) && media.width < needed) {
        todos.push(`模块 ${index + 1} 的图只有 ${media.width}px 宽（${where}至少要 ${needed}px），高分屏上会糊`);
      }
      const videoMb = (media.videoSize ?? 0) / 1024 / 1024;
      if (videoMb > VIDEO_MAX_MB) todos.push(`模块 ${index + 1} 的视频 ${videoMb.toFixed(1)} MB，建议压缩`);
    }
  });

  if (noAlt) todos.push(`正文 ${noAlt}/${total} 个媒体没有 alt`);
  return todos;
}

let shown = 0;
let withTodos = 0;
for (const d of docs) {
  const state = status(d._id);
  // 已发布文档另有草稿时，只显示草稿那份（那才是正在编辑的版本）
  if (state === null) continue;
  const doc = state === "已发布 · 有未发布改动" ? docs.find((x) => x._id === `drafts.${d._id}`) : d;
  shown += 1;

  const todos = [];
  for (const [label, field] of Object.entries(translatable)) {
    if (!complete(doc[field])) todos.push(gap(label, doc[field]));
  }
  if (!doc.cover) todos.push("缺封面");
  else {
    if (!complete(doc.coverAlt)) todos.push(gap("封面 alt", doc.coverAlt));
    const mb = doc.cover.size / 1024 / 1024;
    if (mb > COVER_MAX_MB) todos.push(`封面 ${mb.toFixed(1)} MB，建议压缩`);
  }
  const sectionCount = doc.sections?.length ?? 0;
  if (sectionCount <= 1) todos.push(`正文只有 ${sectionCount} 个模块`);
  todos.push(...sectionMediaTodos(doc.sectionMedia));
  if (doc.galleryNoAlt) todos.push(`画廊 ${doc.galleryNoAlt}/${doc.galleryCount} 张没有 alt`);
  if (todos.length) withTodos += 1;

  const featured = doc.featured ? ` ★${doc.featuredOrder ?? "?"}` : "";
  const sections = (doc.sections ?? []).map((t) => t.replace(/Section$/, "")).join(", ");
  const cover = doc.cover
    ? `${doc.cover.mimeType} ${doc.cover.width}px ${(doc.cover.size / 1024 / 1024).toFixed(1)} MB`
    : "—";

  console.log(`\n${doc.slug ?? "(无 slug)"}  ${doc.year ?? "无年份"}${featured}  [${state}]`);
  console.log(
    `  ${Object.entries(translatable).map(([label, field]) => `${label} ${langs(doc[field])}`).join(" | ")}`,
  );
  console.log(
    `  client ${doc.client ?? "—"} | contributors ${doc.contributors?.length ?? 0} | skills ${doc.tags?.length ?? 0} | links ${doc.linkCount ?? 0}`,
  );
  console.log(`  封面 ${cover} | 封面视频 ${doc.hasVideo ? "有" : "—"}`);
  console.log(`  正文 ${sectionCount} 个模块${sections ? ` [${sections}]` : ""} | 画廊 ${doc.galleryCount ?? 0} 张`);
  console.log(todos.length ? `  待办：${todos.join("；")}` : "  ✓ 没有待办");
}

console.log(`\n共 ${shown} 个项目，${withTodos} 个有待办。`);
