// Sanity Studio 的 root layout。
//
// Studio 不在 [locale] 语言路由里，所以它需要自己的 <html>/<body>。这里刻意保持
// 最小：不挂站点字体、Lenis、自定义光标、view transitions 或 SanityLive ——
// Studio 自带完整的 UI 与内部滚动容器，站点那套外壳只会和它抢滚轮与指针。
// （拆分之前这些都是靠各 provider 里的 pathname.startsWith("/studio") 运行时判断
// 绕开的；现在由路由边界本身保证，Studio 根本不会渲染它们。）
//
// 后台界面是英文的，lang 固定为 en。
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sanity Studio",
  // 后台不该进搜索索引；robots.ts 里也已经 disallow 了 /studio
  robots: { index: false, follow: false },
};

export default function StudioLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // NextStudio 渲染出来的根元素是 height:auto，自己不会撑满视口 —— 拆分前它是靠
    // 站点 root layout 的 min-h-screen 才铺满的。这里必须自带一条完整的高度链，
    // 否则 Studio 会缩成左上角一小块。背景色同时兜住登录页之外的空白区域。
    <html lang="en" style={{ height: "100%" }}>
      <body
        style={{
          margin: 0,
          height: "100%",
          // Studio 深色主题的底色，避免未绘制区域露出浏览器默认白
          background: "#13141b",
        }}
      >
        <div style={{ minHeight: "100dvh" }}>{children}</div>
      </body>
    </html>
  );
}
