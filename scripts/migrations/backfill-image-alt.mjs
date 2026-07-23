// 一次性回填脚本：给存量项目补齐 coverImage.alt 与 gallery[].alt 占位文案。
// schema 已把 alt 设为必填，未回填的旧文档在 Studio 里一编辑就会被验证卡住。
//
// 用法：
//   1. 在 https://sanity.io/manage 给项目创建一个 Editor 权限的 token
//   2. 预览将要写入的内容（不写库）：
//        SANITY_WRITE_TOKEN=xxx node scripts/migrations/backfill-image-alt.mjs
//   3. 确认无误后真正写入：
//        SANITY_WRITE_TOKEN=xxx node scripts/migrations/backfill-image-alt.mjs --apply
//
// 占位文案是「标题 — project cover / gallery image N」，回填后建议在 Studio
// 里把重要图片的 alt 改成真正的描述性文字。
import { createClient } from "@sanity/client";

const token = process.env.SANITY_WRITE_TOKEN?.trim();
if (!token) {
  console.error("Missing SANITY_WRITE_TOKEN (needs Editor permissions).");
  process.exit(1);
}

const apply = process.argv.includes("--apply");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim() || "ubdc9y57",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || "personal_website",
  apiVersion: "2024-01-01",
  useCdn: false,
  token,
});

const projects = await client.fetch(`*[_type == "project"]{
  _id,
  title,
  "coverAlt": coverImage.alt,
  "gallery": gallery[]{ _key, alt }
}`);

let patchCount = 0;

for (const project of projects) {
  const title = project.title?.trim() || "Project";
  const set = {};

  if (!project.coverAlt?.trim()) {
    set["coverImage.alt"] = `${title} — project cover`;
  }

  (project.gallery ?? []).forEach((item, index) => {
    if (item._key && !item.alt?.trim()) {
      set[`gallery[_key=="${item._key}"].alt`] = `${title} — gallery image ${index + 1}`;
    }
  });

  const fields = Object.keys(set);
  if (!fields.length) continue;

  patchCount += fields.length;
  console.log(`${title} (${project._id}): ${fields.length} field(s)`);
  for (const [path, value] of Object.entries(set)) {
    console.log(`  ${path} = "${value}"`);
  }

  if (apply) {
    await client.patch(project._id).set(set).commit();
  }
}

console.log(
  apply
    ? `Done — ${patchCount} field(s) written.`
    : `Dry run — ${patchCount} field(s) would be written. Re-run with --apply to write.`
);
