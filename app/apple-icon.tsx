// Apple touch icon：iOS 主屏图标需要 180x180 PNG（favicon.ico 效果不佳）
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

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
          background: "#171717",
          color: "#ffffff",
          fontSize: 96,
          fontWeight: 600,
          fontFamily: "sans-serif",
          borderRadius: 36,
        }}
      >
        Y
      </div>
    ),
    size
  );
}
