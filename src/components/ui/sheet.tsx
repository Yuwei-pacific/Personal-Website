"use client";

// 叠纸（试验中）：每个大区块是一张纸，滚动时下一张滑上来盖住上一张。
//
// 做法是 position: sticky —— 不是动画，不改变文档高度，也不劫持滚动：
// - 一张纸先正常滚动，直到它的底边到达视口底边，然后钉住；
// - 后面的纸照常往上滚，于是盖在它上面。
// 「底边到达视口底边才钉住」等价于 top = 视口高度 − 自身高度（比视口高的纸是负值），
// 而 sticky 的 top 无法用 CSS 引用自身高度，所以由这里量出来写进 --sheet-top。
//
// 限制：
// - 只在 md 起、且未开启「减弱动画」时生效；其余情况就是普通的上下堆叠。
// - sticky 的活动范围是父元素，所以一组纸必须是同一个父元素的直接子元素；
//   最后一张后面没有兄弟，不会被盖住（页脚在 <main> 之外，沿用它自己的入场效果）。
// - 会被后面的纸盖住的纸至少一屏高（md:min-h-[100svh]），否则钉住时会露出下面那张纸的一截。
//   一组里的最后一张不会被盖住，可以传 fill={false} 按内容高度走。
import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Sheet({
  children,
  className,
  fill = true,
}: {
  children: ReactNode;
  /** 是否至少撑满一屏。只有一组里的最后一张可以关掉 */
  fill?: boolean;
  /** 表面与底色放在这一层（如 "surface-alt bg-background"）：纸比内容高时，多出的部分也要是纸色 */
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sheet = ref.current;
    if (!sheet) return;

    const update = () => {
      const overflow = sheet.offsetHeight - window.innerHeight;
      sheet.style.setProperty("--sheet-top", `${Math.min(0, -overflow)}px`);
    };

    const observer = new ResizeObserver(update);
    observer.observe(sheet);
    window.addEventListener("resize", update);
    update();

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      ref={ref}
      // isolate：每张纸自成层叠上下文，内部的 z-index 不会穿到别的纸上面；
      // 纸与纸之间按文档顺序叠放，后面的盖住前面的。
      // 顶边一条淡墨细线：两张同色的纸叠在一起时，靠它看出边缘（第一张不需要）。
      className={cn(
        "relative isolate border-t border-design-light-border first:border-t-0 md:motion-safe:sticky md:motion-safe:top-[var(--sheet-top,0px)]",
        fill && "md:min-h-[100svh]",
        className,
      )}
    >
      {children}
    </div>
  );
}
