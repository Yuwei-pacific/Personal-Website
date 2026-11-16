// Apple touch icon：iOS 主屏图标需要 180x180 PNG（favicon.ico 效果不佳）。
// 墨的状态的 L·i 标志：墨底、纸色（品牌手册 02：favicon 这类日常场合都用没化开的标志）。
// 标志约占六成高度，四周留白大于「i」那一点高度的两倍；iOS 会自己裁圆角。
import { ImageResponse } from "next/og";

import { MARK_PATHS } from "@/components/ui/ink/ink-tables";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const mark = `
  <svg xmlns="http://www.w3.org/2000/svg" width="96" height="109" viewBox="8 7 36 41" fill="#F2F2EF">
    ${MARK_PATHS.map((d) => `<path d="${d}"/>`).join("")}
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
        <img src={markDataUrl} alt="" width={96} height={109} />
      </div>
    ),
    size
  );
}
