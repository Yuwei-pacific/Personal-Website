"use client";

// Sanity 图片专用的 next/image：挂上 sanityImageLoader，浏览器直连 Sanity CDN 取图。
// 单独做成客户端组件，是因为 loader 是函数，不能从服务端组件当 prop 传给 next/image。
// 本地静态资源（public/）继续用普通的 next/image。
import Image, { type ImageProps } from "next/image";

import { sanityImageLoader } from "@/lib/media";

export function SanityImage({ alt, ...props }: Omit<ImageProps, "loader">) {
  return <Image alt={alt} {...props} loader={sanityImageLoader} />;
}
