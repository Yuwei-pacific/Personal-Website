// 划出一个词：标题里的重音用一道手画的 Coral 线划出来（品牌手册 06、08）。
// 一个标题最多划一个词，一屏最多一处；划的是这句话里最要紧的那个词，不是最长的那个。
// 划了线的词不再用斜体（重音不给两次）。它不是链接的下划线 —— 链接用直的细线（ui/text-link.ts）。
//
// 线是固定的手画路径，不是 CSS 的波浪线，也不是荧光笔那样的色块：粗细约为字号的十四分之一，
// 在基线下方约 0.1em，比词左右各长出一点；碰到 g、y 的尾巴就穿过去，不为它断开。不带晕，不化开。
import { Fragment, type ReactNode } from "react";

// viewBox 200 × 12：闭合的形，头尾收细
const PATHS = [
  "M1 6.5C22 3.8 44 8.2 70 5.6S118 3.6 146 6.2S186 5 199 4.2C199.6 5.2 199.4 6.4 198.6 7.2C176 8.6 150 9.6 122 7.4S76 9.4 52 9.2S16 8 2 9.6C0.8 8.8 0.4 7.4 1 6.5Z",
  "M2 7.2C30 4.6 58 4.2 92 6.4S150 8.4 198 4.8C199 5.8 198.8 7 198 7.8C160 10.4 124 10.2 94 8.8S40 7.6 3 10C1.6 9.2 1.2 8 2 7.2Z",
  "M1 5.4C26 7.6 50 4 84 5.2S140 7.8 170 6S190 4.6 199 5.6C199.4 6.6 199 7.6 198 8.2C180 7.8 164 9.6 138 9.4S86 7.4 60 8.4S20 9.8 2 8.2C1 7.4 0.6 6.2 1 5.4Z",
];

/** 被划线的那个词。行内元素：盒子是字体的内容区，线按它的下缘往上定位，落在基线下方约 0.1em */
export function Stress({ children, variant = 0 }: { children: ReactNode; variant?: number }) {
  return (
    <span className="relative whitespace-nowrap">
      {children}
      <svg
        aria-hidden="true"
        viewBox="0 0 200 12"
        preserveAspectRatio="none"
        className="pointer-events-none absolute -left-[2%] bottom-[0.02em] h-[0.28em] w-[104%] fill-accent"
      >
        <path d={PATHS[((variant % PATHS.length) + PATHS.length) % PATHS.length]} />
      </svg>
    </span>
  );
}

/**
 * 一句标题，其中一个词划线：word 是要划的那个词（按字面在句子里找第一处）。
 * 找不到（比如文案改了）就原样输出整句，不划线。
 */
export function StressedText({ text, word, variant }: { text: string; word?: string; variant?: number }) {
  const at = word ? text.indexOf(word) : -1;
  if (!word || at < 0) return <Fragment>{text}</Fragment>;
  return (
    <Fragment>
      {text.slice(0, at)}
      <Stress variant={variant}>{word}</Stress>
      {text.slice(at + word.length)}
    </Fragment>
  );
}
