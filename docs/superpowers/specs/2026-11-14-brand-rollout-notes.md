# 品牌识别落地：进度与待办

品牌手册（私有）：https://claude.ai/artifact/3oy2KQ8MXcSUQgerVMrjDt
实现约定见仓库根目录 `CLAUDE.md` 的 Theming 一节。

## 已落地

- 墨与纸两套配色，深浅模式跟随系统，菜单内可手动切换。
- 区块在纸 / 纸 2 之间交替，页脚反转。
- 标题用 Fraunces，Geist 只用 Regular。
- 强调色：浅色 Cobalt、深色 Coral，只用于链接下划线。
- 叠纸（`src/components/ui/sheet.tsx`）：首页、About、项目详情页，桌面端生效。用户看过首页后认可。

## 待办（用户提出，尚未处理）

- **首页 About 区块有点空。** 用户原话：「这个about section 有点空」。原因是叠纸要求每张纸至少一屏高，
  而这一块的内容只有半屏左右，现在是垂直居中、上下留空。留到首屏 / About 重新设计时一起解决。
- **深色模式下人像的反差字看不出来。** 计算和遮罩仍在运行，但正文和压在人像上的字都是浅色，没有差别。
  要恢复效果需要一张浅调的人像（或换一种处理方式）。同样留到重新设计时定。

## 首屏（2026-11-14 定稿并实现）

用户在 Figma「04 Utilities」页自己排定（画板 Hero — Light / Dark），选了「口号 + 墨线」那一版，
没选「一段大字介绍句」那一版（与 Rajrupa Biswas 的首页结构太近，长句用 Fraunces 读起来累）。

- 口号 Bring color to the / ordinary.，其中 color 化开（`InkWord`）。
- 一道墨线从页面左缘流进标志（`InkLine`）：是标志笔画上边缘的切片，上面是晕、下面是墨芯。
- 右侧放大的化开标志（`InkMark`），墨迹右缘贴近视口右缘。
- 墨线下方：身份段（墨色 + 淡墨两段）和 Get in touch；底部居中半露的 Scroll Down 环形徽章。
- 入场：口号浮现 → 墨线从标志向左流出 → 身份段与联系方式。
- 品牌手册例外：首屏一屏三处化开（标志、墨线、color），视为同一滴墨。手册需补这条。

## 还没做

- Scroll Down 徽章的字体与是否旋转：用户尚未回答，先按 Geist、20 秒一圈慢转实现。
- 标志「化开」在其他位置的出现（页脚互动、404、分享图、favicon）。
- 旧首屏遗留：`components/vendor/DotFieldImage`、`DecryptedText` 与 `public/hero_mg*.svg` 已无引用，待确认后删除。
- 手机端是否也做叠纸。
- 令牌改名：`design-light-*` / `design-dark-*` 现在表示「主表面 / 交替表面」，名字待方向定稿后统一改。
