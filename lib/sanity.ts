// Sanity 数据客户端（仅服务端使用）。
// "server-only"：任何客户端组件误 import 本文件都会在构建期报错，
// 防止 SANITY_READ_TOKEN 泄漏进浏览器 bundle。
import "server-only";
import { createClient } from "@sanity/client";

// projectId / dataset 是公开信息（本就带 NEXT_PUBLIC_ 前缀），这里内置默认值，
// 因此客户端总是可用；环境变量仅用于在其他 dataset / 项目间切换。
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim() || "ubdc9y57";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || "personal_website";
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() || "2024-01-01";
const token = process.env.SANITY_READ_TOKEN?.trim() || undefined;

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: !token && process.env.NODE_ENV === "production",
  perspective: "published",
  token,
});
