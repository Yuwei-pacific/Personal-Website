"use client";

// 04 线：手画线的三种用法 —— 分隔、划出一个词、圈出一个词（手册 08）。
// 三块图版，和 02、03 章同一种写法（图版 + 下面一行图注）：分隔占一整行，划词和圈词并排。
// 试过不用图版、把三样东西按不同字号直接排在页面上：大字折成两行还落单一个词，三块各说各的，看起来很乱（用户 2026-11-26）。
// 这一章的底板用纸色（surface-base），不用别章的深一档底板：行间的淡墨线在深一档的底板上几乎看不见，
// 套上 surface-base 之后线和字的颜色都按「纸」这一面取，深浅模式自动跟着变。
// 全是普通矢量，不用墨：这一页活的墨只有 03 章一处。圈词在首页 About 是画布里的素墨，这里用同一道走法的 SVG。
// 每块图版进入视口时，里面的线从左到右露出来一次；减少动态效果时直接是画好的。
import { Fragment, useRef } from "react";

import { InkRule } from "@/components/ui/ink-rule";
import { StressedText } from "@/components/ui/stress";
import type { CaseIdentityCopy } from "@/i18n/case-identity";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/animation/scroll-trigger";

import { Plate } from "./mark-plates";

// 圈：viewBox 200 × 60，一笔画完，收笔处和起笔错开（手册 08 的样稿）
const CIRCLE =
  "M14 31C10 13 58 5 108 6C158 7 194 16 190 32C186 48 140 55 96 54C52 53 12 47 15 27C16 19 28 12 44 9";

// 纸色的底板，内容靠左上排（别章的图版是居中的图形，这里是字）
const PAPER = "surface-base bg-background items-stretch justify-start text-design-light-text-primary";
// 三块图版里的字同一个字号：Fraunces（标题用字）。划词和圈词那两句各折成两行，用 balance 折匀，不落单
const SAMPLE = "font-display text-[clamp(1.375rem,2.3vw,2rem)] leading-[1.25] tracking-display";

function Circled({ text, word }: { text: string; word: string }) {
  const at = text.indexOf(word);
  if (at < 0) return <Fragment>{text}</Fragment>;
  return (
    <Fragment>
      {text.slice(0, at)}
      {/* 左右各让出一点：圈比词宽，不让它压到相邻的字（手册 08 的样稿同样留了 0.22 em） */}
      <span className="relative mx-[0.22em] whitespace-nowrap">
        {word}
        <svg
          data-line
          aria-hidden="true"
          viewBox="0 0 200 60"
          preserveAspectRatio="none"
          className="pointer-events-none absolute -left-[0.42em] -top-[0.3em] h-[calc(100%+0.6em)] w-[calc(100%+0.84em)] overflow-visible"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
        >
          <path d={CIRCLE} vectorEffect="non-scaling-stroke" />
        </svg>
      </span>
      {text.slice(at + word.length)}
    </Fragment>
  );
}

export function LinePlates({ copy }: { copy: CaseIdentityCopy["line"] }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // 减少动态效果：不设初始状态，线从一开始就是画好的
      if (prefersReducedMotion()) return;
      gsap.utils.toArray<HTMLElement>("[data-draw]", ref.current).forEach((group) => {
        // 划词的线在 Stress 组件里，没法打标记：取它那个 svg
        const lines = group.querySelectorAll("[data-line], [data-line-host] svg");
        gsap.fromTo(
          lines,
          { clipPath: "inset(0 100% 0 0)" },
          {
            clipPath: "inset(0 0% 0 0)",
            duration: 0.6,
            ease: "power2.out",
            stagger: 0.12,
            clearProps: "clipPath",
            scrollTrigger: { trigger: group, start: "top 80%", once: true },
          },
        );
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="flex flex-col gap-10 sm:gap-14">
      <div data-draw>
        <Plate caption={copy.divide} plateClassName={PAPER}>
          {/* 主线墨色，行间淡墨线。InkRule 自己只有 1 px 高、线画在它外面，
              所以裁切加在外面这层有上下留白的盒子上，不然线会被整条裁掉 */}
          <ul className={`w-full ${SAMPLE}`}>
            {copy.rows.map((row, i) => (
              <li key={row}>
                <div data-line className="-my-1.5 py-1.5">
                  <InkRule variant={i} tone={i === 0 ? "strong" : "soft"} />
                </div>
                <p className="py-4 sm:py-5">{row}</p>
              </li>
            ))}
          </ul>
        </Plate>
      </div>

      <div className="grid gap-x-6 gap-y-10 md:grid-cols-2">
        <div data-draw className="flex">
          <Plate caption={copy.stress.label} className="flex-1" plateClassName={`${PAPER} items-center`}>
            <p className={`text-balance ${SAMPLE}`}>
              <span data-line-host>
                <StressedText text={copy.stress.text} word={copy.stress.word} />
              </span>
            </p>
          </Plate>
        </div>
        <div data-draw className="flex">
          <Plate caption={copy.circle.label} className="flex-1" plateClassName={`${PAPER} items-center`}>
            <p className={`text-balance ${SAMPLE}`}>
              <Circled text={copy.circle.text} word={copy.circle.word} />
            </p>
          </Plate>
        </div>
      </div>
    </div>
  );
}
