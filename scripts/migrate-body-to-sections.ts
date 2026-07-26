// 把项目正文 body（Portable Text）搬进 sections 的一个富文本模块。
//
// 纯机械搬运：块内容原样保留，不拆分、不改写、顺序不变。
// body 字段本身不动（schema 里已是 readOnly 的迁移期字段），前端在 sections
// 非空时优先渲染 sections——所以即使只迁了一半也不会出现空白页。
//
// 幂等：只处理「有 body 且 sections 为空」的文档，重复执行不会产生第二份内容。
// 草稿与已发布版本各自独立处理，避免之后发布草稿时把迁移结果覆盖掉。
//
// 用法（需要 Sanity CLI 已登录）：
//   npx sanity exec scripts/migrate-body-to-sections.ts --with-user-token
//   npx sanity exec scripts/migrate-body-to-sections.ts --with-user-token -- --apply
import { getCliClient } from "sanity/cli";

const APPLY = process.argv.includes("--apply");

const client = getCliClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim() || "ubdc9y57",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || "personal_website",
  apiVersion: "2024-01-01",
});

type PortableTextBlock = { _type: string; _key?: string };

type Candidate = {
  _id: string;
  title: string | null;
  body: PortableTextBlock[];
  sectionCount: number;
};

// 数组成员需要稳定的 _key；由文档 id 派生，重复运行得到同一个值
const sectionKey = (documentId: string) =>
  `migrated-body-${documentId.replace(/[^a-zA-Z0-9]/g, "").slice(-12)}`;

async function main() {
  const candidates: Candidate[] = await client.fetch(
    `*[_type == "project" && count(body) > 0]{
      _id,
      title,
      body,
      "sectionCount": count(sections)
    } | order(_id asc)`
  );

  const pending = candidates.filter((doc) => !doc.sectionCount);
  const skipped = candidates.filter((doc) => doc.sectionCount > 0);

  console.log(`\n模式: ${APPLY ? "写入 (--apply)" : "预演 (dry run)"}`);
  console.log(`数据集: ${client.config().dataset}\n`);

  if (skipped.length) {
    console.log(`跳过 ${skipped.length} 个已有 sections 的文档:`);
    for (const doc of skipped) {
      console.log(`  - ${doc.title ?? doc._id} (${doc.sectionCount} 个模块)`);
    }
    console.log("");
  }

  if (!pending.length) {
    console.log("没有需要迁移的文档。");
    return;
  }

  console.log(`将迁移 ${pending.length} 个文档:\n`);
  for (const doc of pending) {
    const isDraft = doc._id.startsWith("drafts.");
    const styles = [...new Set(doc.body.map((block) => (block as { style?: string }).style))]
      .filter(Boolean)
      .join(", ");
    console.log(
      `  ${doc.title ?? "(无标题)"}${isDraft ? " [草稿]" : ""}\n` +
        `    ${doc.body.length} 个块 → richTextSection (styles: ${styles || "—"})\n` +
        `    _key: ${sectionKey(doc._id)}`
    );
  }

  if (!APPLY) {
    console.log(`\n这是预演，未写入任何数据。`);
    console.log(`确认无误后加 -- --apply 执行。\n`);
    return;
  }

  console.log("\n开始写入…");
  let transaction = client.transaction();
  for (const doc of pending) {
    transaction = transaction.patch(doc._id, (p) =>
      p.setIfMissing({ sections: [] }).insert("after", "sections[-1]", [
        {
          _type: "richTextSection",
          _key: sectionKey(doc._id),
          content: doc.body,
        },
      ])
    );
  }

  await transaction.commit({ visibility: "async" });
  console.log(`完成：${pending.length} 个文档已迁移。\n`);
}

main().catch((error) => {
  console.error("\n迁移失败:", error.message);
  process.exit(1);
});
