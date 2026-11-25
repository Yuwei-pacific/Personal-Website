// 从标志路径生成两个静态文件（改了 ink-tables.ts 里的标志之后重跑：node scripts/build-icons.mjs）：
//   src/app/favicon.ico  浏览器标签页图标，16 / 32 / 48 px。几何版标志放在墨色的方块里，占方块高度的七成
//                        （品牌手册 02：20 px 以下用几何版；不放进圆里，圆会再吃掉四个角的像素）。
//                        几何版画在 22 × 22 的方格上：标志的边长取 11 的倍数（11 / 22 / 33 px，都是 68.75%）、
//                        偏移取整数，笔画就正好落在像素上，不发灰
//   public/Logo.svg      结构化数据（JSON-LD）里的 logo：墨色方块上纸色的墨迹版标志
// apple-icon 和分享图不在这里，它们在构建时由 src/app 下的路由生成。
import { readFile, writeFile } from "node:fs/promises";

import sharp from "sharp";

const tables = await readFile(new URL("../src/components/ui/ink/ink-tables.ts", import.meta.url), "utf8");
const constant = (name) => {
  const match = tables.match(new RegExp(`export const ${name} =\\s*"([^"]+)"`));
  if (!match) throw new Error(`ink-tables.ts 里找不到 ${name}`);
  return match[1];
};
const INK = "#0C0D12";
const PAPER = "#F2F2EF";

// 几何版：路径画在 10–109 的方格里（99 × 99）
const geo = constant("MARK_GEO_PATH");
const favicon = (size) => {
  const mark = Math.round((size * 0.7) / 11) * 11;
  const scale = mark / 99;
  // 16 和 48 px 时两边差一个像素，多的那一个留在右边和下边
  const offset = Math.floor((size - mark) / 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${INK}"/>
  <path transform="translate(${offset} ${offset}) scale(${scale}) translate(-10 -10)" fill="${PAPER}" d="${geo}"/>
</svg>`;
};

// ICO 容器：文件头 + 每张图一条目录 + PNG 数据（Vista 起 ICO 里可以直接放 PNG）
const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map((size) => sharp(Buffer.from(favicon(size))).png().toBuffer()));
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = 6 + 16 * sizes.length;
const entries = sizes.map((size, i) => {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size, 0);
  entry.writeUInt8(size, 1);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(pngs[i].length, 8);
  entry.writeUInt32LE(offset, 12);
  offset += pngs[i].length;
  return entry;
});
await writeFile(new URL("../src/app/favicon.ico", import.meta.url), Buffer.concat([header, ...entries, ...pngs]));

// 墨迹版：外框约 34.9 × 35.1，放在 64 × 64 的方块正中，占高度的 56%
const ink = constant("MARK_PATH");
const logo = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="${INK}"/>
  <path transform="translate(14.2 14.08) scale(1.0211) translate(-8.475 -10.264)" fill="${PAPER}" fill-rule="evenodd" d="${ink}"/>
</svg>
`;
await writeFile(new URL("../public/Logo.svg", import.meta.url), logo);

console.log(`favicon.ico（${sizes.join(" / ")} px）和 public/Logo.svg 已生成`);
