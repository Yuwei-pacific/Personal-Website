# 首页 Work 区（墨线串起作品）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal：** 把临时样稿里的首页 Work 区做成正式实现。内容包括：
- 墨线串起精选作品，封面显在墨滩里；
- 焦点决定哪个作品化开、显示彩色、播放视频；
- 目录悬停时出现墨滩预览；
- Sanity 新增「首页精选」开关和「精选顺序」字段，删除 visibility 字段。

**Architecture：**
- **数据**：GROQ 一次查询返回 `{ featured, index }` 两组项目，normalizer 输出非空的视图类型。
- **画面**：作品区用一块铺满全区的 `InkSurface`，按页面里的占位元素（`data-ink`）画墨滩和墨线。焦点、视频、悬停预览都通过渲染器已有的 `setFocus`、`setVideo`、`drawImage` 实现，这几个在样稿阶段已经加好。
- **几何**：墨滩和墨线的形状计算是纯函数，单独放一个文件。

**Tech Stack：** Next.js 16 App Router、React 19、TypeScript strict、Tailwind 3、Sanity v6（GROQ + TypeGen）、WebGL2（`src/components/ui/ink/`）。

**Spec：** `docs/superpowers/specs/2026-11-15-work-section-design.md`

## Global Constraints

- 过滤和排序只在 GROQ 里做；查询只放在 `src/sanity/queries.ts`；改了查询或 schema 必须运行 `npm run typegen`。
- normalizer 返回 `src/lib/view-models/types.ts` 里的非空类型，`Raw…` 类型不能出现在 UI 的 props 里。
- 精选最多 4 个（`[0...4]`）；第 5 个及之后的精选进目录；Studio 只提醒，不阻止保存。
- 一屏只化开一处：只有焦点作品带五色晕、显示彩色、播放视频，其余收成墨边、封面黑白。
- 强调色只用于线和点；Geist 只用 Regular；Fraunces 只用于大标题；用语义化的设计令牌，不用 Tailwind 原始数值。
- 每个动效都要照顾减弱动画：只画静止的一帧，焦点直接切换不过渡，不播视频。
- 作品区画布的 `maxDpr` 为 1.5；墨滩比封面占位外扩 32px；作品区的晕用 `tight: 3U`、`loose: 10U`（`U = 2.6`）。
- 源码注释用中文。
- 这个仓库没有单元测试框架。验证方式是 `npm run check`（lint + typecheck + build）、`npm run smoke`（要先启动服务器），以及在浏览器里检查。
- 只在用户要求时提交；推送只推到 `website-rebranding` 分支，不推到 main。

## Review Focus

1. **封面图片加载失败**（404、跨域头缺失）：WebGL 上传被污染的图片会抛出 SecurityError。这时那滩墨应该显示为纯墨，页面其他部分照常工作。属于 Task 4。
2. **精选为 0 个或超过 4 个**：0 个时只显示目录；超过 4 个时，第 5 个起出现在目录里，编号仍然连续。属于 Task 2 和 Task 4。
3. **视频自动播放被拒绝**（iOS 低电量模式、浏览器策略）：`play()` 被拒时停在彩色的静止封面上，不报错，也不留黑块。属于 Task 4。
4. **布局变化**（字体加载完、窗口缩放、意大利语标题换行）：墨滩和墨线要跟着占位元素重算，不能错位。属于 Task 4。
5. **触屏设备**：没有悬停，所以目录不出预览、点一行直接跳转；滚动时的焦点切换照常工作。属于 Task 5。

---

### Task 1：Sanity schema 与数据清理

**Files:**
- Modify: `src/sanity/schema-types/project.ts`（删除 `visibility` 字段，约 196–202 行；删除 preview 里用到它的地方，约 300–315 行；新增两个字段）
- Create: `scripts/unset-project-visibility.ts`

**Interfaces:**
- Produces：文档字段 `featured: boolean`、`featuredOrder: number`（后面 GROQ 用）

- [ ] **Step 1：新增 `featured` 字段**
  - group `"overview"`，title「Feature on home page」，`type: "boolean"`，`initialValue: false`。
  - description：「Shown large in the home Work section. Up to 4 are shown; the rest fall back to the index.」
  - validation：用 `Rule.custom` 统计已勾选的数量。当前文档是勾选状态，且 `count(*[_type=="project" && featured == true && !(_id in path("drafts.**"))])` 大于 4 时，返回 warning（不是 error）。

- [ ] **Step 2：新增 `featuredOrder` 字段**
  - `type: "number"`，title「Featured order」，`hidden: ({ document }) => !document?.featured`。
  - description：「Lower numbers come first.」

- [ ] **Step 3：删除 `visibility` 字段及 preview 中的 `visibility`、`isHidden` 逻辑**
  - preview 不再显示「隐藏」状态。
  - 把 preview 改成在副标题里显示「★ Featured」，标出已勾选精选的项目。

- [ ] **Step 4：写清理脚本 `scripts/unset-project-visibility.ts`**
  - 用 `sanity exec` 运行，通过 `getCliClient()` 取得 client。
  - 查询 `*[_type == "project" && defined(visibility)]._id`，在一个 transaction 里对每个文档执行 `patch(id).unset(["visibility"])`，然后打印处理的数量和 id 列表。
  - 草稿（`drafts.` 开头的 id）同样处理。

- [ ] **Step 5：运行清理（用户已经同意清理 visibility 的旧值）**
  - 运行：`npx sanity exec scripts/unset-project-visibility.ts --with-user-token`
  - 预期输出：「Unset visibility on 5 document(s)」（如果有草稿，数量会更多）。
  - 如果提示没有登录：请用户运行 `npx sanity login` 后再执行，不要用其他办法绕过。

- [ ] **Step 6：验证**
  - 再查询一次 `count(*[_type=="project" && defined(visibility)])`，预期结果为 `0`。写法：用 `.env.local` 里的 `SANITY_READ_TOKEN`，写一个一次性的 `@sanity/client` 脚本，放在仓库根目录，运行完立即删除。
  - 运行 `npm run typecheck`，预期通过；Task 2 会运行 typegen。

### Task 2：查询、类型与 normalizer

**Files:**
- Modify: `src/sanity/queries.ts`（新增 `HOME_WORK_QUERY`；删除 5 处 `visibility != false`；`PROJECTS_QUERY` 如果之后没人用就删掉）
- Modify: `src/lib/view-models/types.ts`、`src/lib/view-models/home.ts`
- Modify: `src/app/(site)/[locale]/page.tsx`
- Regenerate: `src/sanity/sanity.types.ts`

**Interfaces:**
- Consumes：Task 1 的 `featured`、`featuredOrder`
- Produces：
  - `Project` 新增 `roles: string[]`。
  - `normalizeHomeWork(raw: HOME_WORK_QUERY_RESULT): { featured: Project[]; index: Project[] }`，导出自 `src/lib/view-models/home.ts`。
  - 首页 `<ProjectsSection featured={…} index={…} locale dictionary />`。

- [ ] **Step 1：写 `HOME_WORK_QUERY`（`defineQuery`，参数 `$locale`）**
  - 投影沿用 `PROJECTS_QUERY` 现有的字段，再加 `"roles": coalesce(select($locale == "it" => roleTranslations.it, roleTranslations.en), roleTranslations.en, roleTranslations.it, [])`。
  - 返回结构：

```groq
{
  "featured": *[_type == "project" && featured == true]
    | order(coalesce(featuredOrder, 999) asc, coalesce(year, 0) desc, _createdAt desc)[0...4]{ …投影 },
  "index": *[_type == "project" && !(_id in *[_type == "project" && featured == true]
    | order(coalesce(featuredOrder, 999) asc, coalesce(year, 0) desc, _createdAt desc)[0...4]._id)]
    | order(coalesce(year, 0) desc, _createdAt desc){ …投影 }
}
```

  投影写成一个共享的 GROQ 片段常量，两处复用。

- [ ] **Step 2：删除 `PROJECT_QUERY`、slug 查询、sitemap 查询里的 `visibility != false`（共 5 处）**
  - 运行：`grep -n "visibility" src/sanity/queries.ts`
  - 预期：没有输出。

- [ ] **Step 3：运行 `npm run typegen`**
  - 预期：`sanity.types.ts` 里出现 `HOME_WORK_QUERY_RESULT`，并且里面没有 `visibility`。

- [ ] **Step 4：在 `Project` 里加 `roles: string[]`，实现 `normalizeHomeWork`**
  - 复用现有的单项目 normalizer。
  - `roles` 去掉空字符串；为 null 时给 `[]`。

- [ ] **Step 5：首页 `page.tsx` 改用 `HOME_WORK_QUERY` 和 `normalizeHomeWork`**
  - 本任务里，`ProjectsSection` 先接收 `featured` 和 `index` 两个 props，内部暂时把两组拼起来，交给原来的卡片渲染，保证这一步可以单独验证。

- [ ] **Step 6：验证**
  - 运行：`npm run check`，预期全部通过。
  - 启动 dev 服务器后运行 `npm run smoke`，预期「Smoke check passed」，10 条项目路由。

### Task 3：几何与媒体工具（纯函数）

**Files:**
- Create: `src/components/sections/home/work/ink-geometry.ts`（从样稿迁移并整理）
- Create: `src/components/sections/home/work/cover-media.ts`

**Interfaces:**
- Produces（`ink-geometry.ts`）：
  - `type Rect = { x: number; y: number; width: number; height: number }`
  - `type Sample = { x: number; y: number; f: number }`
  - `POOL_PAD = 32`、`U = 2.6`，以及墨线常量（`BAND = 20 * U`、`PEAK = 0.68`、`FALLOFF = 1.4`、`HALO = 7 * U`、`HALO_INNER = 0.34`、`CORE = 4`）
  - `poolPath(rect: Rect, seed: number): Path2D`
  - `threadSamples(width: number, covers: Rect[], ruleY: number, mobile: boolean): Sample[]`
  - `strokeSamples(ctx, samples, half, ink: (d: number) => number): void`
  - `strokeCore(ctx, samples): void`
  - `drawCover(ctx, source: CanvasImageSource & { width?: number }, natural: { width: number; height: number }, rect: Rect): void`
- Produces（`cover-media.ts`）：
  - `loadCoverImage(url: string): Promise<HTMLImageElement | null>`：设置 `crossOrigin="anonymous"`；失败时返回 `null`，不抛错。
  - `coverVideo(id: string, url: string): HTMLVideoElement`：带缓存；muted、loop、playsInline、crossOrigin；`preload="none"`，第一次播放时才开始加载。
  - `playOnly(active: HTMLVideoElement | null): void`：`play()` 返回的 promise 被拒绝时吞掉，不抛出。

- [ ] **Step 1：从 `mockup-work/work-ink-mockup.tsx` 迁移上述函数，补上中文注释（说明为什么这样做）**
  - `threadSamples` 增加 `mobile` 参数：为 true 时，每段只在相邻两滩墨之间竖直往下流，S 形的横向摆幅最多是宽度的 0.15，进出点都在墨滩横向中点。
  - `drawCover` 改成接收 natural 尺寸，这样图片和视频的首帧可以共用。

- [ ] **Step 2：验证**
  - 运行 `npm run typecheck`，预期通过。
  - 这些函数暂时没有调用方，lint 不应报「未使用的导出」。

### Task 4：Work 区（桌面）

**Files:**
- Create: `src/components/sections/home/work/work-section.tsx`（服务端组件：标题、精选、目录的版式与占位）
- Create: `src/components/sections/home/work/work-ink.tsx`（客户端组件：画布、焦点、视频）
- Create: `src/components/sections/home/work/work-index.tsx`（客户端组件：目录行与悬停状态）
- Create: `src/components/sections/home/work/index-preview.tsx`（客户端组件：悬停预览的墨滩）
- Modify: `src/components/sections/home/projects-section.tsx`（改为直接渲染 `WorkSection`，或删除文件并由 `page.tsx` 直接引入 `WorkSection`；选后者）
- Modify: `src/i18n/dictionaries.ts`（`home.projects.index`：意大利语 `"Indice"`，英语 `"Index"`）

**Interfaces:**
- Consumes：Task 2 的 `{ featured, index }`；Task 3 的全部导出；渲染器的 `InkSurface` props `build / buildKey / watch / focus / video`，以及 `InkParams` 的 `focusRegions / maxDpr / revealDuration / revealPause / replayReveal / blurScale`
- Produces：`<WorkSection featured index locale dictionary />`

- [ ] **Step 1：`WorkSection`**
  - 版式照样稿：
    - section 根元素为 `id="work"`、`relative isolate overflow-hidden`，底色由外层的 Sheet 决定。
    - 精选按三种位置循环：
      1. 封面 `md:col-start-2 md:col-span-5`，文字 `md:col-start-8 md:col-span-4`；
      2. 封面 `md:col-start-7 md:col-span-5 md:row-start-1`，文字 `md:col-start-2 md:col-span-4 md:row-start-1`；
      3. 封面 `md:col-start-3 md:col-span-5`，文字 `md:col-start-9 md:col-span-4`。
  - 精选的文字依次是：编号、标题（`h3`）、summary、`roles.join(" · ")` 加 ` — {year}`。
  - 封面占位 `data-ink="cover"`、`data-id`，比例 16/10。占位里放：
    - sr-only 的替代文字；
    - 一张 `<img data-cover-transition>`，平时 `opacity-0`，点击时用于共享过渡。
  - 精选为空时不渲染精选块；两组都为空时，显示 `dictionary.home.projects.empty`。

- [ ] **Step 2：`WorkInk`**
  - 实现：
    - `InkSurface absolute inset-0`；
    - build 读取父元素里的 `[data-ink="cover"]` 和 `[data-ink="rule"]`；
    - 封面图片加载完成后，改变 `buildKey` 触发重建；
    - 加载失败的封面不画进图像层，墨滩是纯墨；
    - 焦点：滚动时用 rAF 节流，选出离视口中线 0.55 个视口高度以内、最近的那个；
    - 焦点作品有视频且没有开启减弱动画时，调用 `playOnly(video)` 并传 `video={{ element, rect }}`，rect 是占位外扩 32px。
  - 参数：`tight 3U`、`loose 10U`、`displacement 4U`、`warpFrequency 0.011/U`、`weightFrequency 0.005/U`、`spreadBias 0`、`reveal null`、`maxDpr 1.5`、`focusRegions` 为各个封面的 rect。

- [ ] **Step 3：`WorkIndex` 与 `IndexPreview`**
  - 行的结构照样稿。
  - 悬停或获得键盘焦点（`onFocus`）时，记录行的中线并显示预览；移开或失焦时淡出。
  - 预览尺寸 340×240，`padding 56`，`blurScale 1`，`loose 8U`；显影 0.9 秒，`pause 0`，`replayReveal`；有视频就播放。
  - `md` 以下不渲染预览（触屏没有悬停）。

- [ ] **Step 4：共享过渡**
  - 精选链接点击时：先把占位里的 `<img>` 设为 `opacity-100`，再调用 `claimCoverTransition(img)`（来自 `src/components/projects/cover-transition.tsx`）。
  - 目录行点击时，对预览不认领过渡，退回普通的页面切换。

- [ ] **Step 5：验证**
  - 运行 `npm run check`，预期通过。
  - 在浏览器 1440×900 下逐项检查：
    - 焦点切换时彩色和黑白随之变化；
    - Dance Connect 和 Cloud Atlas 获得焦点时视频播放，失去焦点后停下；
    - 目录悬停时墨滩预览出现，Source Bound 播放视频；
    - 划过之后能完全合回；
    - 浅色、深色两种主题都正常。
  - 把某个封面 URL 临时改成 404 地址，确认那滩墨显示为纯墨，控制台没有未捕获的错误。检查完改回。

### Task 5：手机版、减弱动画与降级

**Files:**
- Modify: Task 4 的四个文件；Task 3 的 `threadSamples(…, mobile)`

**Interfaces:**
- Consumes：Task 3 和 Task 4 的全部内容

- [ ] **Step 1：手机（`md` 以下）**
  - 单列，封面全宽。
  - `WorkInk` 用 `window.matchMedia("(min-width: 768px)")` 决定 `mobile` 参数，并把它放进 `buildKey`。

- [ ] **Step 2：减弱动画**
  - 渲染器的 `start(false)` 已经保证只画静止的一帧。另外确认三点：
    - 焦点直接切换，不过渡；
    - 不调用 `play()`；
    - 预览不显影，直接出现。

- [ ] **Step 3：不支持 WebGL2 时**
  - 用 `useInkSupported()` 判断。不支持时 `WorkInk` 不渲染画布，占位里的 `<img>` 改为可见。
  - CSS 加上 `grayscale` 和 `transition-[filter]`；焦点作品用 `grayscale-0`。
  - 预览改为普通 `<img>`。

- [ ] **Step 4：验证**
  - 在 375×812（mobile 预设）下：单列，滚动时焦点照常切换，点目录行直接跳转。
  - 系统开启减弱动画后：画面静止，没有视频。
  - 用 javascript_tool 临时把 `HTMLCanvasElement.prototype.getContext` 改成对 `"webgl2"` 返回 null，然后刷新：显示普通图片的版式，没有报错。

### Task 6：清理与文档

**Files:**
- Delete: `src/app/(site)/[locale]/mockup-work/`
- Delete（确认没有引用后）：`src/components/projects/project-card.tsx`、`src/components/ui/masked-section-heading.tsx`；如果 `PROJECTS_QUERY` 和 `normalizeHomeData` 已经没人用，一并删除
- Modify: `CLAUDE.md`（ink 一节：作品区画布、`focusRegions` 和 `setFocus`、`drawImage`、`setVideo`）、`docs/superpowers/specs/2026-11-14-brand-rollout-notes.md`

- [ ] **Step 1：删除上述文件**
  - 运行：`grep -rn "project-card\|masked-section-heading\|mockup-work\|PROJECTS_QUERY\|normalizeHomeData" src`
  - 预期：没有输出（或只剩确实需要保留的引用）。
- [ ] **Step 2：更新文档；`npm run typegen` 后确认 `sanity.types.ts` 没有残留的类型**
- [ ] **Step 3：最终验证**
  - 运行 `npm run check` 和 `npm run smoke`，预期都通过。
  - 帧率：滚动并持续划动 3 秒，在 120Hz 屏上 ≥ 110fps（屏幕本身被限制在 60Hz 时，以 GPU 计时为准）。
  - 用 `EXT_disjoint_timer_query_webgl2` 测作品区画布，每帧 < 2ms。
- [ ] **Step 4：通知品牌手册会话**
  - 用 SendMessage 发给 `local_a2e545fc-2790-42c1-9881-e93e888f5c23`，请它补上两条：作品区「一次只化开一处」的焦点规则，以及「封面在墨里」的做法。
