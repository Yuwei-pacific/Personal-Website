// Apple touch icon：iOS 主屏图标需要 180x180 PNG（favicon.ico 效果不佳）。
// 墨迹的状态的雨标志：墨底、纸色（品牌手册 02：应用图标这类日常场合用墨迹的状态，不用化开的）。
// 标志占 56% 的高度，四周的留白远大于两个笔画；左右对称、上下分量接近，居中放，不做偏移。iOS 会自己裁圆角。
import { ImageResponse } from "next/og";

import { MARK_PATH, MARK_VIEWBOX } from "@/components/ui/ink/ink-tables";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const MARK_SIZE = 100;

const mark = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${MARK_SIZE}" height="${MARK_SIZE}" viewBox="${MARK_VIEWBOX}" fill="#F2F2EF">
    <path fill-rule="evenodd" d="${MARK_PATH}"/>
  </svg>
`;

const markDataUrl = `data:image/svg+xml,${encodeURIComponent(mark)}`;

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0C0D12",
        }}
      >
        <img src={markDataUrl} alt="" width={MARK_SIZE} height={MARK_SIZE} />
      </div>
    ),
    size
  );
}
