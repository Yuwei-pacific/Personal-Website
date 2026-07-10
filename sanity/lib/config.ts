// Sanity 公开配置的唯一来源：projectId / dataset 本就是公开信息（NEXT_PUBLIC_ 前缀），
// 服务端 client（lib/sanity.ts）与客户端图片 builder（sanity/lib/image.ts）共用。
// 使用静态 env 访问让 Next.js 能在客户端 bundle 中正确内联；部署环境未配置时，
// 使用仓库中已公开记录的项目默认值。任何 token 仍只属于 server-only 的 lib/sanity.ts。
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim() || "ubdc9y57";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || "personal_website";
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() || "2024-01-01";
