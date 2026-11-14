// 首屏底部的「Scroll Down」环形徽章：一圈沿圆周排的文字，中间一个向下的箭头。
// 文字环缓慢旋转（20 秒一圈），减弱动画时静止。整个徽章是指向作品区的链接。
// 纯 SVG + CSS 动画，不需要客户端脚本。
import { cn } from "@/lib/utils";

// 文字环：半径 38 的整圆（从左侧起笔、顺时针），文字用 textLength 均匀铺满一整圈
const RING_RADIUS = 38;
const RING_PATH = `M 50,50 m -${RING_RADIUS},0 a ${RING_RADIUS},${RING_RADIUS} 0 1,1 ${RING_RADIUS * 2},0 a ${RING_RADIUS},${RING_RADIUS} 0 1,1 -${RING_RADIUS * 2},0`;
const RING_LENGTH = Math.floor(2 * Math.PI * RING_RADIUS);

export function ScrollBadge({
  href,
  label,
  className,
}: {
  href: string;
  /** 环上的文字，同时作为链接的可读名称，如「Scroll down」 */
  label: string;
  className?: string;
}) {
  // 两遍文字各跟一个星号分隔，正好一圈
  const ring = `${label} * ${label} * `;

  return (
    <a
      href={href}
      aria-label={label}
      className={cn(
        "group block text-design-light-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4",
        className,
      )}
    >
      <svg viewBox="0 0 100 100" aria-hidden="true" className="h-full w-full overflow-visible">
        <defs>
          <path id="scroll-badge-ring" d={RING_PATH} />
        </defs>
        <g className="origin-center animate-[spin_20s_linear_infinite] motion-reduce:animate-none">
          <text
            className="fill-current font-sans"
            style={{ fontSize: 11, letterSpacing: "0.02em" }}
          >
            <textPath href="#scroll-badge-ring" textLength={RING_LENGTH} lengthAdjust="spacing">
              {ring}
            </textPath>
          </text>
        </g>
        {/* 中间的箭头：悬停时往下挪一点 */}
        <g
          className="fill-none stroke-current transition-transform duration-base ease-design-out group-hover:translate-y-[3px] motion-reduce:transition-none"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M50 34 V64" />
          <path d="M41 55 L50 64 L59 55" />
        </g>
      </svg>
    </a>
  );
}
