import { Link } from "next-view-transitions";

import { AboutInk } from "./about-ink";
import { MaskedTextHeading } from "@/components/ui/masked-text-heading";
import { RevealText } from "@/components/ui/reveal-text";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { localizedPath } from "@/i18n/routing";

export function AboutPreview({
  locale,
  dictionary,
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const content = dictionary.home.aboutPreview;

  return (
    <section id="about" className="relative z-10 w-full bg-background">
      {/* 唯一的一处墨：把标题里的一个词手画圈起来（见 about-ink.tsx） */}
      <AboutInk />
      {/* 一句话的声明，不是「标题 + 正文」的版块：标题与首屏口号同一个字号、同样贴页边，一行横贯整页
          （首屏口号 → 这一句 → Progetti，三道大衬线字沿着左页边往下排）。
          正文和 CTA 是挂在这句话右端下面的一条附注，落在 Work 12 栏网格的第 8 栏起（与 01 项目的文字栏
          同一条线），Work 的墨线正好从它下方起笔 —— 视线走的是：标题从左到右 → 右下的附注 → 墨线往左下流进作品。
          这里不放人像（用户 2026-11-16 的决定）：照片只在 About 页出现一次；首页上代表「人」的是
          Work 里的线稿。之前居中限宽、正文压在人像上的版本，夹在两个贴页边的区块之间像另一套版式 */}
      <div className="px-edge py-section sm:px-edge-sm sm:pt-section-sm">
        {/* data-ink：about-ink.tsx 按它量标题里的词。
            data-ink-word：圈起来的那个词的序号 —— 两种语言都是第 2 个词（disegno / design） */}
        <div data-ink="about-title" data-ink-word="1">
          <MaskedTextHeading
            text={content.title}
            className="text-balance font-display text-display-sm leading-[1.1] tracking-display text-design-light-text-primary lg:text-[clamp(3.75rem,7vw,8rem)] lg:leading-[1.02]"
          />
        </div>

        <div className="mt-8 lg:mt-14 lg:grid lg:grid-cols-12 lg:gap-x-6">
          <div className="flex flex-col gap-8 lg:col-[8/13] xl:col-[8/12]">
            <RevealText
              as="p"
              text={content.body}
              className="text-pretty text-lead tracking-display lg:text-2xl lg:leading-snug lg:tracking-normal"
            />
            <Link
              href={localizedPath(locale, "/about")}
              className="relative inline-flex min-h-11 w-fit touch-manipulation items-center border-b-2 border-accent text-lg leading-[1.15] tracking-[-0.04em] text-design-light-text-primary transition-opacity duration-base hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 lg:min-h-0 lg:text-2xl"
            >
              {content.cta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
