"use client";

import { useCallback, useSyncExternalStore } from "react";

import { THEME_STORAGE_KEY } from "@/lib/theme";

export type Theme = "light" | "dark";
export { THEME_STORAGE_KEY };

const THEME_CHANGE_EVENT = "themechange";
const SYSTEM_DARK_QUERY = "(prefers-color-scheme: dark)";
// 浏览器工具栏着色：与 globals.css 里纸 / 墨的底色一致
const THEME_COLORS: Record<Theme, string> = { light: "#F5F5F3", dark: "#0C0D12" };

// 当前生效的主题：手动选择（<html data-theme>）优先，否则跟随系统
function readTheme(): Theme {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === "light" || chosen === "dark") return chosen;
  return window.matchMedia(SYSTEM_DARK_QUERY).matches ? "dark" : "light";
}

function subscribe(onChange: () => void) {
  const system = window.matchMedia(SYSTEM_DARK_QUERY);
  system.addEventListener("change", onChange);
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => {
    system.removeEventListener("change", onChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
  };
}

// SSR 不知道访客的主题：先按浅色渲染，水合后立即读到真实值
const getServerSnapshot = (): Theme => "light";

/** 读取并切换深浅模式。颜色本身由 globals.css 按 data-theme / 系统偏好切换，这里只管那个属性。 */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, getServerSnapshot);

  const setTheme = useCallback((next: Theme) => {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // 隐私模式等场景下存不了：本次会话内仍然生效，只是刷新后回到系统偏好
    }
    // layout 输出的 theme-color 是按系统偏好分的两条 meta；手动选择后两条都改成同一个色
    document
      .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
      .forEach((meta) => {
        meta.content = THEME_COLORS[next];
      });
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  return { theme, setTheme };
}
