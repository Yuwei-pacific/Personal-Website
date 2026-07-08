// Sanity 数据客户端（仅服务端使用）。
// "server-only"：任何客户端组件误 import 本文件都会在构建期报错，
// 防止 SANITY_READ_TOKEN 泄漏进浏览器 bundle。
import "server-only";
import { createClient } from "@sanity/client";
import { projectId, dataset, apiVersion } from "@/sanity/lib/config";

const token = process.env.SANITY_READ_TOKEN?.trim() || undefined;

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: !token && process.env.NODE_ENV === "production",
  perspective: "published",
  token,
});
