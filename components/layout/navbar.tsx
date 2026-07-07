"use client";

// 导航：React Bits StaggeredMenu 全屏交错菜单
// - vendor 自带 logo 不可点击，用站点自己的 Link 替代（vendor logo 通过 globals.css 隐藏）
// - toggle 按钮与 logo 用 mix-blend-difference 自适应深浅背景（hero 浅色 / work 深色）
import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Link } from "next-view-transitions";
import type { ComponentType } from "react";

type StaggeredMenuItem = { label: string; ariaLabel?: string; link: string };
type StaggeredMenuSocialItem = { label: string; link: string };
type StaggeredMenuProps = {
  position?: "left" | "right";
  colors?: string[];
  items?: StaggeredMenuItem[];
  socialItems?: StaggeredMenuSocialItem[];
  displaySocials?: boolean;
  displayItemNumbering?: boolean;
  className?: string;
  logoUrl?: string;
  menuButtonColor?: string;
  openMenuButtonColor?: string;
  accentColor?: string;
  changeMenuColorOnOpen?: boolean;
  isFixed?: boolean;
  closeOnClickAway?: boolean;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
};

// vendor .jsx 的默认值会被 TS 推断成 never[]，这里显式标注 props 类型；
// 组件在 effect 里操作 DOM，关闭 SSR 避免 useLayoutEffect 服务端警告
const StaggeredMenu = dynamic(() => import("@/components/StaggeredMenu"), {
  ssr: false,
}) as ComponentType<StaggeredMenuProps>;

const menuItems: StaggeredMenuItem[] = [
  { label: "Home", ariaLabel: "Go to home", link: "/#home" },
  { label: "About", ariaLabel: "About Yuwei Li", link: "/#about" },
  { label: "Work", ariaLabel: "View selected work", link: "/#work" },
];

const socialItems: StaggeredMenuSocialItem[] = [
  { label: "GitHub", link: "https://github.com/Yuwei-pacific" },
  { label: "LinkedIn", link: "https://www.linkedin.com/in/yuwei081/" },
  { label: "Instagram", link: "https://www.instagram.com/yuwei081/" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);

  // 差值混合开关：菜单关闭时开启（toggle 白字反色自适应深浅背景，与 logo 同款）；
  // 打开时关闭混合（否则白色面板会被反色），按钮文字由 vendor 的开/关变色逻辑切成深色。
  // vendor 容器自身是隔离层叠上下文，混合必须加在它外面这层 div 上才能透出页面。
  const [blendActive, setBlendActive] = useState(true);
  const blendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMenuOpen = useCallback(() => {
    if (blendTimerRef.current) clearTimeout(blendTimerRef.current);
    setBlendActive(false);
  }, []);

  const handleMenuClose = useCallback(() => {
    // 等面板滑出动画（0.32s）结束再恢复混合，避免白色面板在退场时被反色成黑块
    if (blendTimerRef.current) clearTimeout(blendTimerRef.current);
    blendTimerRef.current = setTimeout(() => setBlendActive(true), 400);
  }, []);

  useEffect(() => {
    return () => {
      if (blendTimerRef.current) clearTimeout(blendTimerRef.current);
    };
  }, []);

  // 面板链接点击：同页锚点平滑滚动 / 跨页用 router 跳转；
  // vendor 未暴露关闭 API，通过模拟点击 toggle 收起菜单
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a.sm-panel-item");
      if (!anchor) return;

      const href = anchor.getAttribute("href") || "";
      if (href.startsWith("/#")) {
        e.preventDefault();
        if (pathname === "/") {
          const el = document.getElementById(href.slice(2));
          if (el) {
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
            window.history.pushState(null, "", href);
          }
        } else {
          router.push(href);
        }
      }

      const toggle = wrapRef.current?.querySelector<HTMLButtonElement>(".sm-toggle");
      if (toggle?.getAttribute("aria-expanded") === "true") toggle.click();
    },
    [pathname, router]
  );

  return (
    <div ref={wrapRef} onClick={handleClick}>
      {/* 站点 Logo：invert 转白后配合差值混合，在深浅背景上都可读 */}
      <Link href="/" aria-label="Home" className="fixed left-6 top-6 z-50 mix-blend-difference sm:left-8 sm:top-6">
        <Image src="/Logo.svg" alt="Yuwei Li" width={48} height={48} className="h-12 w-12 invert" priority />
      </Link>
      {/* relative z-40 必不可少：加了混合后整组会被压平成静态层级、被页面内容盖住，
          需要显式抬回页面之上，混合才能以页面为底进行反色 */}
      <div className={blendActive ? "relative z-40 mix-blend-difference" : "relative z-40"}>
        <StaggeredMenu
          isFixed
          position="right"
          items={menuItems}
          socialItems={socialItems}
          displaySocials
          displayItemNumbering
          logoUrl="/Logo.svg"
          menuButtonColor="#ffffff"
          openMenuButtonColor="#171717"
          changeMenuColorOnOpen
          accentColor="#737373"
          colors={["#dbe4ee", "#171717"]}
          onMenuOpen={handleMenuOpen}
          onMenuClose={handleMenuClose}
        />
      </div>
    </div>
  );
}
