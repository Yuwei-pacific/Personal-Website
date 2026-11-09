import Image from "next/image";
import { Link } from "next-view-transitions";

import { Parallax } from "@/components/ui/parallax";
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
      {/* 限宽并居中：这是一段阅读型文字，宽屏下左对齐会在右侧留出一大片空白。
          视口窄于限宽时，左边缘自然落在与 Hero / Work / 页脚相同的页面边距上。
          上下留白不对称：上方与 Hero 底部的定位文案同为白底、字号相近，只能靠距离分段，
          sm 起用 section-sm；下方紧接深色区，色块切换本身就是分隔，保持 section 基础档 */}
      <div className="mx-auto w-full max-w-content px-edge py-section sm:px-edge-sm sm:pt-section-sm">
        <div className="relative flex flex-col gap-8 lg:min-h-[22.9375rem] lg:gap-6">
          {/* 窄屏按底边定位：人像下方的标签要落在 CTA 那一行右侧的空位里。
              按顶边定位的话，标签会压在正文最后几行上（英文版正文更长，直接重叠） */}
          <div className="pointer-events-none absolute bottom-0 right-0 z-0 w-[46%] max-w-44 lg:-top-[1.875rem] lg:bottom-auto lg:right-0 lg:w-[30%] lg:max-w-[20.6875rem]">
            <Parallax offset={-160} mobileOffset={-64}>
              {/* 抠像人像直接落在页面白底上：不加卡片底色与阴影 */}
              <div className="relative aspect-square overflow-hidden">
                <Image
                  id="about-preview-portrait-mask"
                  src="/Profile_Yuwei.webp"
                  alt={dictionary.common.portraitAlt}
                  fill
                  sizes="(min-width: 1024px) 331px, 45vw"
                  className="object-cover object-top"
                />
              </div>
              {/* 所在地标签：人像的图注，放在 Parallax 内部，跟着人像一起上浮。
                  靠右对齐，避开从左侧穿过人像的正文。文案仍取自 hero 字典键（OG 图也在用） */}
              {/* 窄屏限宽：人像只占半栏，标签收成更窄的一列，不伸进左侧正文的行尾 */}
              <p className="ml-auto mt-3 max-w-[7.75rem] text-balance text-right lg:max-w-none text-[0.6875rem] font-semibold uppercase leading-[1.35] tracking-[0.18em] text-design-light-text-primary lg:text-xs">
                {dictionary.home.hero.basedIn}
              </p>
            </Parallax>
          </div>

          <div className="relative">
            <MaskedTextHeading
              text={content.title}
              className="text-balance text-display-sm font-semibold leading-[1.1] tracking-display text-design-light-text-primary lg:text-display"
            />
            {/* 右侧留白给人像让位：不留的话正文会整段压在人像上，
                穿过轮廓的反差字太多反而看不清。lg 起人像更小、文字有 max-w 限宽，不需要 */}
            <div className="relative z-10 w-full pr-[12.5%] sm:pr-[7.5%] lg:max-w-[63rem] lg:pr-0">
              <RevealText
                as="p"
                text={content.body}
                maskTargetId="about-preview-portrait-mask"
                maskImageSrc="/Profile_Yuwei_mask.webp"
                className="mt-4 text-pretty text-lead font-semibold tracking-display lg:text-display-sm lg:leading-[1.245]"
              />
            </div>
          </div>

          <Link
            href={localizedPath(locale, "/about")}
            className="relative z-20 inline-flex min-h-11 w-fit touch-manipulation items-center border-b-2 border-current text-lg font-semibold leading-[1.15] tracking-[-0.04em] text-design-light-text-primary transition-opacity duration-base hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 lg:min-h-0 lg:text-[2.5rem]"
          >
            {content.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
