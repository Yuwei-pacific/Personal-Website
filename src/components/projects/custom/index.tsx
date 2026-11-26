// 自定义正文：项目页的页头（标题、封面、简介、资料）和页尾（署名、下一个项目）永远走模板和 Sanity；
// 这里登记的项目，中间的章节换成专门写的组件，模板自带的画廊区也不再渲染（位图由正文自己排）。
//
// 这是「模板里没有任何东西是按项目定的」唯一的例外，现在只有识别案例一页。
// 加第二个之前先问用户：每多一页，全站改版时就多一页要单独过两套主题、两种语言和各个断点。
//
// 按 slug 查，不改 Sanity 的 schema。代价是 Sanity 里改了 slug 这一页会悄悄退回空的模板正文 ——
// scripts/content-audit.mjs 读下面的 CUSTOM_BODY_SLUGS 做对照，改这里的写法时两边一起改。
import { IdentityBody } from "./identity/identity-body";
import type { CustomBodyProps } from "./types";

export type { CustomBodyProps };

export const CUSTOM_BODY_SLUGS = ["ink-holds-five-colors"] as const;

/** 这个项目有没有自定义正文；没有就照常渲染模板的章节和画廊 */
export function hasCustomBody(slug: string): boolean {
  return (CUSTOM_BODY_SLUGS as readonly string[]).includes(slug);
}

/** 按 slug 渲染对应的正文。写成分支而不是「查表拿组件」：组件不能在渲染时才决定是哪一个 */
export function CustomBody(props: CustomBodyProps) {
  switch (props.project.slug) {
    case "ink-holds-five-colors":
      return <IdentityBody {...props} />;
    default:
      return null;
  }
}
