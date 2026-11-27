// 03 五色：五个色块，纸上和夜里两块静态样稿。
// 化开的标志不在这一章：它是上一章作图动画的结尾（mark-motion.tsx），全页活的墨只有那一处。
import { Mark } from "@/components/ui/mark";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import type { CaseIdentityCopy } from "@/i18n/case-identity";

import { Plate } from "./mark-plates";

// 五色，由中心到边缘（手册 03）。顺序和色值固定。
// 全站只有这里把 Cobalt、Cyan、Amber 单独拿出来用 —— 它们本来只活在化开的地方（手册 12）；
// 案例页是讲这套识别的地方，是那条规则唯一的例外。别的页面不要引用这个数组。
const FIVE = ["#070B24", "#1B3FD6", "#35C2D8", "#FF9A1F", "#FF5A4E"] as const;

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

      <ScrollReveal className="grid gap-x-6 gap-y-10 sm:grid-cols-2">
        {/* 两块固定底色的样稿：用不随主题变的墨色和纸色，浅色深色模式下都是「一纸一夜」 */}
        <Plate
          caption={copy.onPaper}
          plateClassName="bg-[hsl(var(--color-paper))] text-[hsl(var(--color-ink))] sm:py-14"
        >
          <Mark className="h-24 w-auto" />
        </Plate>
        <Plate
          caption={copy.atNight}
          plateClassName="bg-[hsl(var(--color-ink))] text-[hsl(var(--color-paper))] sm:py-14"
        >
          <Mark className="h-24 w-auto" />
        </Plate>
      </ScrollReveal>
    </>
  );
}
