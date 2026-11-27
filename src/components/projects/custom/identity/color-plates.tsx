// 03 五色：五个色块，和化开的标志在纸上、在夜里的两块静态样稿。
// 两块样稿是这套颜色的一条规则：纸上墨芯是墨色，夜里墨芯是纸色（白），晕都是同样的四色往外化开。
// 它们是不动的图，不是活的墨：和别处同一个渲染器，只画一帧（InkMark 的 still），色表固定（mode），不流动、不能搅。
// 全页活的墨只有上一章作图动画结尾那一处（mark-motion.tsx）。
// 试过用 SVG 滤镜那一版（ink-fallback.tsx）：240 px 下颗粒太粗，和上一章活的墨看起来像两种效果。
// 原先这两块放的是素标志，和「尺寸」「和名字的组合」重复，也和颜色无关（2026-11-27 换掉）。
import { InkMark } from "@/components/ui/ink-mark";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import type { CaseIdentityCopy } from "@/i18n/case-identity";

import { Plate } from "./mark-plates";

// 五色，由中心到边缘（手册 03）。顺序和色值固定。
// 全站只有这里把 Cobalt、Cyan、Amber 单独拿出来用 —— 它们本来只活在化开的地方（手册 12）；
// 案例页是讲这套识别的地方，是那条规则唯一的例外。别的页面不要引用这个数组。
const FIVE = ["#070B24", "#1B3FD6", "#35C2D8", "#FF9A1F", "#FF5A4E"] as const;

// 化开的标志不小于 240 px（手册 02：再小墨芯就被晕吃掉了）。盒子只框住字形，晕画在盒子外面、底板的留白里
const BLOOM = "aspect-[34.865/35.099] h-60";
// 上下留白比别的图版多：要装下晕
const SPECIMEN = "py-14 sm:py-16";

export function ColorPlates({ copy }: { copy: CaseIdentityCopy["colors"] }) {
  return (
    <>
      <ScrollReveal>
        <ol className="grid grid-cols-5">
          {FIVE.map((hex, i) => (
            <li key={hex} className="flex min-w-0 flex-col gap-2">
              <span aria-hidden="true" className="block h-[5.5rem]" style={{ backgroundColor: hex }} />
              <span className="flex flex-col pr-2 text-small leading-snug text-design-dark-text-primary">
                {copy.names[i]}
                <span className="font-mono text-xs text-design-dark-text-muted">{hex}</span>
              </span>
            </li>
          ))}
        </ol>
      </ScrollReveal>

      {/* 两块固定底色的样稿：用不随主题变的纸色和墨色，色表也固定（mode），浅色深色模式下都是「一纸一夜」。
          lg 起并排；再窄每块装不下 240 px 的标志和它的晕，改成一列 */}
      <ScrollReveal className="grid gap-x-6 gap-y-10 lg:grid-cols-2">
        <Plate caption={copy.onPaper} plateClassName={`bg-[hsl(var(--color-paper))] ${SPECIMEN}`}>
          <InkMark mode="light" still className={BLOOM} />
        </Plate>
        <Plate caption={copy.atNight} plateClassName={`bg-[hsl(var(--color-ink))] ${SPECIMEN}`}>
          <InkMark mode="dark" still className={BLOOM} />
        </Plate>
      </ScrollReveal>
    </>
  );
}
