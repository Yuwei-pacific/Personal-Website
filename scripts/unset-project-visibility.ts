// 一次性数据清理：项目的「Project visibility」字段已从 schema 删除（不想公开就撤回成草稿），
// 这里把库里残留的旧值删掉，免得 Studio 在每个项目上提示「未知字段」。
// 运行：npx sanity exec scripts/unset-project-visibility.ts --with-user-token
import { getCliClient } from "sanity/cli";

// sanity.cli.ts 只配了 typegen，没有 api 段：项目与数据集直接给出（与 src/sanity/config.ts 的默认值一致）
const client = getCliClient({ apiVersion: "2024-01-01", projectId: "ubdc9y57", dataset: "personal_website" });

// sanity exec 按 CommonJS 打包，不支持顶层 await
async function main() {
  const ids = await client.fetch<string[]>(`*[_type == "project" && defined(visibility)]._id`);
  if (ids.length === 0) {
    console.log("Nothing to unset.");
  } else {
    const transaction = client.transaction();
    ids.forEach((id) => transaction.patch(id, (patch) => patch.unset(["visibility"])));
    await transaction.commit();
    console.log(`Unset visibility on ${ids.length} document(s):\n${ids.join("\n")}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
