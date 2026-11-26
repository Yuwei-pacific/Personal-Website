// 主题存储键与首帧初始化脚本：由 [locale]/layout.tsx、global-not-found.tsx 与 hooks/use-theme.ts 共用。
// 单独放在非 "use client" 模块里，服务端组件和客户端 hook 都能直接引用，避免两处脚本漂移。
export const THEME_STORAGE_KEY = "theme";

// 首帧之前把手动选择的主题写到 <html data-theme>，避免先按系统主题画一帧再跳变。
// 没有手动选择时不写属性，由 globals.css 的 prefers-color-scheme 跟随系统。
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
