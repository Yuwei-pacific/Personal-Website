// 标志的「墨迹」状态：雨，一条固定的轮廓（品牌手册 02）。导航、页脚这类日常场合都用它。
// 不带底：圆和方块只是头像、图标的容器，不是标志的一部分。颜色跟文字色走（currentColor）——
// 它是黑，或者反白，不填别的颜色。最小 20 px；更小的地方（浏览器标签页图标）用几何版。
// 化开的状态在 ui/ink-mark.tsx。
import type { CSSProperties } from "react";

import { MARK_PATH, MARK_VIEWBOX } from "./ink/ink-tables";

export function Mark({ className, style, label }: { className?: string; style?: CSSProperties; label?: string }) {
  return (
    <svg
      viewBox={MARK_VIEWBOX}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={className}
      style={style}
      fill="currentColor"
    >
      <path fillRule="evenodd" d={MARK_PATH} />
    </svg>
  );
}
