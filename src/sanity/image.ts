// Sanity 图片 URL builder：按目标尺寸裁切时会应用编辑者在 Studio 里标注的
// hotspot（焦点）与 crop（裁切框），代替"从图片中心盲裁"。
// 客户端安全：只依赖公开的 projectId / dataset。
import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";
import { projectId, dataset } from "./config";

const builder = createImageUrlBuilder({ projectId, dataset });

export const urlFor = (source: SanityImageSource) => builder.image(source);
