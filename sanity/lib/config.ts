// Sanity 公开配置的唯一来源：projectId / dataset 本就是公开信息（NEXT_PUBLIC_ 前缀），
// 服务端 client（lib/sanity.ts）与客户端图片 builder（sanity/lib/image.ts）共用。
// 注意：不要在这里放任何 token —— token 只属于 server-only 的 lib/sanity.ts。
const readPublicConfig = (key: string, localFallback: string) => {
  const value = process.env[key]?.trim();
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error(`Missing required Sanity environment variable: ${key}`);
  }
  return localFallback;
};

export const projectId = readPublicConfig("NEXT_PUBLIC_SANITY_PROJECT_ID", "ubdc9y57");
export const dataset = readPublicConfig("NEXT_PUBLIC_SANITY_DATASET", "personal_website");
export const apiVersion = readPublicConfig("NEXT_PUBLIC_SANITY_API_VERSION", "2024-01-01");
