# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Portfolio site for Yuwei Li — Next.js 16 App Router + React 19 + TypeScript (strict), Tailwind 3,
Sanity v6 CMS with an embedded Studio. `README.md` covers setup and conventions in prose; this file
covers the commands and the cross-file architecture that is not obvious from any single file.

Source comments are written in Chinese. Match the surrounding language when editing a file.

## Commands

```bash
npm run dev            # dev server + embedded Studio at http://localhost:3000/studio
npm run build          # production build (Turbopack)
npm run build:webpack  # production build (webpack) — fallback when Turbopack misbehaves
npm run start          # serve the production build
npm run lint           # ESLint (flat config)
npm run typecheck      # tsc --noEmit
npm run check          # lint + typecheck + production build — run before calling work done
npm run smoke          # HTTP checks: locales, redirects, sitemap, every project route
npm run typegen        # regenerate src/sanity/sanity.types.ts from schemas + queries
npm run audit:content  # read-only: per project, which CMS fields / translations / alts are still missing, and which
                       # section images are too small for their slot or videos too heavy (drafts included)
```

There is no unit-test runner. `npm run smoke` is the only test, and it drives a **running** server
(`SMOKE_BASE_URL`, default `http://localhost:3000`), so start `npm run dev` or `npm run start` first.

Node 22 is required (`.nvmrc`, `engines`).

## Architecture

### Two route trees, two root layouts

There is **no `src/app/layout.tsx`**. Each route group supplies its own `<html>`/`<body>`:

- `src/app/(site)/[locale]/layout.tsx` — the public site. `<html lang>` must vary by locale, and
  `params` is only reachable from inside the segment. An earlier design read the locale from
  `headers()` in a real root layout, which made `headers()` a dynamic API call in the root and
  forced the entire tree to SSR — `export const revalidate` silently stopped working. Do not
  reintroduce a root layout or read `headers()`/`cookies()` there.
- `src/app/(studio)/layout.tsx` — the Sanity Studio, deliberately outside the locale routes.

`src/proxy.ts` (Next 16's `middleware.ts` replacement) redirects any unprefixed path to the visitor's language
with a 307: the `locale` cookie if they picked a language in the menu (set in `navbar.tsx`), otherwise the best match
in `Accept-Language`, otherwise English (`preferredLocale` / `fallbackLocale` in `i18n/config.ts`). It must stay a
temporary redirect with `Vary` — the target differs per visitor. Prefixed URLs are never redirected.
For prefixed paths it also forwards an `x-site-locale`
request header, read **only** by `src/app/global-not-found.tsx` (that document bypasses every
layout and has no `params`). Site pages must keep reading the locale from `params`.
Matcher excludes `/api`, `/studio`, `/_next`, `/apple-icon`, and anything with a file extension.

Every public page renders `<Navbar />`, then one `<main id="main-content">` wrapping **all** of its
content, then `<Footer />`. The layout's wrapping `<div>` is only a background container — the
`main` landmark and skip-link target belong to the page, so navigation stays outside `main`.

### Data flow: GROQ query → normalizer → UI

```
page.tsx (Server Component)
  └─ sanityFetch()            src/sanity/fetch.ts   ← the only read path
       └─ query               src/sanity/queries.ts ← the only place GROQ lives
  └─ normalize*()             src/lib/view-models/ ← CMS shape → UI contract
       └─ components           src/lib/view-models/types.ts ← stable UI types
```

Rules that keep this from drifting:

- **Filtering and ordering happen in GROQ only** (`order(coalesce(year,0) desc, …)`, the home Work
  section's featured / index split). There is no visibility flag: the site reads the `published`
  perspective, so unpublishing a project to a draft is how it is hidden.
  Never re-filter or re-sort in a component or view model.
- `src/sanity/queries.ts` is the single source of every query. Changing a query or a schema requires
  `npm run typegen` to regenerate `src/sanity/sanity.types.ts`.
- Normalizers return the non-nullable contracts in `src/lib/view-models/types.ts`. A normalizer may
  declare a narrow local `Raw…` shape for its projection, but that shape must not leak into UI props.
- `src/sanity/client.ts` imports `server-only` so a client component that imports it fails at build
  time instead of leaking `SANITY_READ_TOKEN`. Read data through `sanityFetch`, not the raw client
  (exceptions: `fetchProjectSlugs`, which only needs static slugs, and `sitemap.ts`, which reads
  Content Lake directly but carries the same cache tag).
- **The CMS is the only content source.** There is no in-repo fallback copy — when a query returns
  nothing, render an empty state.
- **Previewing drafts locally:** `SANITY_PREVIEW_DRAFTS=1` in `.env.local` makes `sanityFetch` read the
  `drafts` perspective, uncached, in `npm run dev` only. A production build ignores it.

### Cache invalidation: webhook + time fallback (no `<SanityLive />`)

Every Sanity read carries one Next cache tag, `SANITY_CACHE_TAG` (`src/sanity/fetch.ts`), plus a
60-second `revalidate` fallback. A Sanity publish webhook hits `src/app/api/revalidate/route.ts`,
which verifies the signature against `SANITY_REVALIDATE_SECRET` and expires that tag — the whole
content set at once, which is fine at this content size. The webhook setup is documented in that
route file; without it the site still self-heals within ~60 s.

`<SanityLive />` was removed on purpose: it shipped a Sanity client (~33 KB gzip) and a persistent
EventSource connection to every visitor only so already-open pages could refresh live. Do not
reintroduce it for the public site; `api.sanity.io` is no longer in the CSP `connect-src` either.

### Localization

`it` and `en`, both always explicitly prefixed. `it` is the content default (CMS fallback, 404); which language an
unprefixed URL opens follows the visitor (see `proxy.ts` above), with `en` as the fallback and as hreflang `x-default`. Three separate layers:

1. **Interface copy** — `src/i18n/dictionaries.ts`, read via `getDictionary(locale)`.
2. **CMS content** — one shared document per project holding media, dates and ordering, with each
   translatable field stored as a `localized*` object (`{it: "…", en: "…"}`), not as parallel
   legacy fields. `@sanity/language-filter` in `src/sanity/studio-config.ts` shows one locale at a
   time. Queries resolve it with `coalesce(select($locale == "it" => field.it, field.en), field.en, field.it)`,
   so every content query takes a `$locale` param.
3. **Routing** — `src/i18n/config.ts` + `routing.ts` (`localizedPath`, `removeLocalePrefix`,
   `replaceLocale`). Never build a localized href by string-concatenating a locale.

### Theming and design tokens

Two themes, light ("paper") and dark ("night"), following the system by default; the menu has a
manual switch (`src/hooks/use-theme.ts`) that writes `<html data-theme>` and `localStorage.theme`.
An inline script in `[locale]/layout.tsx` applies the stored choice before first paint.

Colors are layered in `src/app/globals.css`:

1. Raw values `--s-<surface>-*` for three surfaces — `base` (Paper / Ink), `alt` (Paper 2 / Ink 2),
   `inv` (the inverse). **Only this layer changes between themes.**
2. The Tailwind colors `design-light-*` and `design-dark-*`. The names are historical: they no longer
   mean light/dark, they mean **primary surface / alternate surface**. By default `design-light-*`
   reads `base` and `design-dark-*` reads `alt`.
3. `.surface-base` / `.surface-alt` / `.surface-inverse` re-point both families (and `bg-background`,
   `text-foreground`, `border-border`, `accent`) for everything inside a block. Use them on a
   section's outermost element to arrange alternation. The footer is `surface-inverse` — the one
   inverted block per page.

Whole pages follow the theme; there are no fixed dark sections. `--color-ink` and `--color-paper`
are theme-invariant, for things that must stay dark or light (the lightbox, text over the portrait,
the blend-mode cursor). Colors resolved in JS (GSAP tweens) must be re-read when the theme changes.

Brand rules that code must respect: Geist is used at Regular only (Tailwind's `font-medium|semibold|bold`
are mapped to 400 on purpose), Fraunces (`font-display`) is for titles at every level (page titles, section headings, row names, menu items) but never body or labels, and `accent`
(Cobalt in light, Coral in dark) goes on lines and dots, never on text.

Design rules live in the brand manual (a Claude artifact; chapter numbers cited in code comments as 手册 NN).
Variants that were tried and rejected, with the reason, are in `docs/decisions.md` — read it before
reintroducing something that looks like an obvious improvement.

### Ink

The "inked" effect renders with WebGL2 in `src/components/ui/ink/`: `ink-gl.ts` (renderer and shader),
`ink-surface.tsx` (sizing, theme, visibility, reduced motion), `ink-tables.ts` (mark paths, color tables,
shared metrics). When WebGL2 is unavailable a static SVG-filter version from `ink/ink-fallback.tsx` is
loaded on demand; never animate it — it rasterizes on the CPU.

- Blur fields are computed once per layout change; per frame the shader adds flow, breathing and the
  pointer "stir" field. The stir field lives in 8-bit ping-pong textures, so its decay must step at least
  one quantum per frame or small offsets get stuck.
- **Slot pattern.** Layout places empty placeholders (`data-ink="…"`); one canvas covering the section
  reads their rects and draws the ink. The hero uses it for the mark and line (`HeroInk`, `InkMarkSlot`,
  `InkLineSlot`; a second, smaller pair of slots below `lg`), Work for covers and the index rule.
- **Images in ink** (`drawImage`): Work covers, the About portrait, the "next project" thumbnail. The
  layout `<img>` only loads the file and carries the alt text; it stays transparent unless the canvas is
  confirmed unavailable. Images and videos used as textures need `crossOrigin="anonymous"`.
- **Focus** (`focusRegions` + `setFocus`): only the featured project nearest the viewport's middle blooms
  and shows color; the rest collapse to an ink rim and grayscale. Max 4 regions (shader limit), so max 4
  featured projects (`featured`, `featuredOrder` in Sanity). The focused cover's video plays in the ink.
  Once the Index heading rises above 75% of the viewport height, every featured cover collapses (`INDEX_TAKEOVER`
  in `work-ink.tsx`): whoever reads the Index should not have a bloom above it.
  The "next project" thumbnail uses the same switch (`focused` on `InkCover`): collapsed at rest, blooming on
  hover or keyboard focus; touch has no hover, so there it stays collapsed until the tap starts the transition.
- **Flow** (`flow`, `flowDrops`): the Work thread's head follows the scroll at ~82% of the viewport
  height; a pool blooms from the thread's entry point when the head reaches it. It never retracts.
- **Windowed canvases**: a section-high canvas is only 1.5–2 viewports tall. It is absolutely positioned inside
  the section and scrolls natively with the page; the renderer moves it (`viewOffset`) only when the viewport is
  about to leave it. Do not make it `position: sticky` and redraw per scroll frame — on iOS Safari scrolling runs
  off the main thread, the script's scroll position lags, and the ink trails behind the text. An offscreen canvas
  still draws one warm-up frame after each layout change, or large canvases flash blank on scroll-in.
- Reduced motion renders one static frame: no reveal, flow, breathing, stir or video.

Ink appears only where it has a job: the hero (mark, line, slogan word), Work (pools and thread), the About
portrait, the "next project" thumbnail, the project-entry transition (`projects/ink-transition.tsx`) and
one quiet hand-drawn circle on the home About title (`about-ink.tsx`). The footer and all dividers
(`ui/ink-rule.tsx`) are plain strokes with no bloom. The cursor (`ui/custom-cursor.tsx`) is not ink either: a
paper-coloured dot drawn once on a 2D canvas and difference-blended, so it inverts whatever is under it (dark on
paper, light on ink, in both themes); no bloom.

### Pages

All pages scroll normally on one edge-to-edge 12-column grid: labels and section titles in columns 1–3,
content from column 4.

- **Home**: hero, About statement and Work share one paper. The About statement has no portrait; its lower
  left is reserved for client logos.
- **About** (`sections/about/`): paper, then paper 2. The top hangs on two verticals (page edge: portrait;
  column 4: `h1` and statement) and two horizontals (row top; one ink rule from which the statement and the
  facts table hang). The portrait's ink pool is normalised to fill its box, so aligning the box aligns the
  ink. Two columns from `md`. The origin story (墨分五色) is not told on any site page.
- **Project** (`components/projects/`): title with a "type — year" kicker → cover → summary (7 columns) and
  facts (4 columns) → chapters → credits → gallery → next project. The cover is the whole original image at
  its natural ratio, never cropped or put in ink.
  Every chapter has one rhythm: text, then a landscape block of media that runs to the right edge. Media has
  two widths only, the text column or the full content width (`fullWidth` in Sanity); a media group is full
  width. Media taller than about 4:3 is not shrunk and left-aligned: it sits centred and height-capped on a
  plate that fills the slot (`section-media.tsx`), a group of such media shares one plate in the text column,
  and below `sm` that group becomes a horizontal snap strip. Section images open in a lightbox loaded on first
  click (`zoomable-image.tsx`). Figures made for print are re-exported for the web before upload — one plate
  colour, landscape pieces, no posters taller than a screen.
  All media sizing lives in `section-media.tsx` (the two slots, the CDN width caps, the tall-media threshold
  and the plate); `project-sections.tsx` only decides chapters and which column a block sits in. The same slot
  widths and threshold are repeated in `scripts/content-audit.mjs`, which flags uploads too small for their
  slot — change both together. Nothing in the template is per project: a layout change is a template change.
- **Footer**: the one inverted block per page — a solid mark and a plain line into its "i", positioned in
  CSS (`--fm-h` / `--fm-w`).
- Two line-art figures (`work/ink-figure.tsx`) sit on the Work thread. Dark mode inverts them; invert only
  line art, never photos.

Shared pieces: `ui/text-link.ts` (the accent-underlined link, every CTA), `ui/meta-list.tsx` (label / value
rows on the project header and About), `ui/ink-rule.tsx` (dividers).

Raw values are CSS variables in `src/app/globals.css`, mapped to utilities in `tailwind.config.ts`.
Use the semantic tokens rather than raw Tailwind scale values: spacing (`section`/`panel` for
vertical rhythm, `container`/`gap-section`/`stack`/`card`), radius (`card`/`button`/`tag`/`media`/`panel`),
motion (`duration-fast|base|slow|media`), type (`display`/`display-sm`/`section`/`lead`/`body`/`small`/`label`),
`tracking-display`, `max-w-content`, and layering (`z-nav`/`z-nav-logo`/`z-cursor`/`z-skip-link`).

`tailwind.config.ts` zeroes out Tailwind's default `borderRadius` scale — the site style is sharp
corners. `rounded-full` is intentionally kept: a circle is a shape, not a corner style. A visual
decision used 3+ times earns a token; one-off art direction stays inline.

### Site constants and SEO

`src/lib/site-metadata.ts` is the single source for the domain, contact address, social accounts and
role strings. Never hardcode the domain — `absoluteUrl()` and `localizedAbsoluteUrl()` build
canonical, sitemap, Open Graph and JSON-LD URLs. `languageAlternates()` emits the hreflang set.

The share image (`[locale]/opengraph-image.tsx`) follows the brand manual: ink background, bloomed mark, the name in
Fraunces and one mono line. It draws the bloom with an SVG filter and loads TTFs from `src/assets/fonts/`
(`ImageResponse` cannot use next/font's woff2). The SVG is drawn larger than the image and cropped, because the
renderer treats the canvas edge as a shape edge and blooms it. `apple-icon.tsx` is the plain mark on ink.

The three site fonts are defined once in `src/app/fonts.ts` and applied by both documents that own a `<body>`:
`[locale]/layout.tsx` and `global-not-found.tsx` (which bypasses every layout — without the variables the 404 page
falls back to the browser's serif).

`src/app/sitemap.ts` and `src/app/robots.ts` are generated; the smoke test reads the sitemap to
discover project routes, so a project missing from the sitemap is also untested.

### CSP is in `next.config.ts`

The `Content-Security-Policy` header is applied to everything **except** `/studio` — the embedded
Studio is a full third-party app (workers, blob, eval, several Sanity domains) and sharing one policy
only forces both to weaken. If you add a third-party script, font, image host or analytics endpoint,
you must add its origin to the relevant `*-src` directive or it fails silently in production. The
comment block above `contentSecurityPolicy` explains each currently-allowed origin; keep it accurate.
Dev-only relaxations (`unsafe-eval`, no `upgrade-insecure-requests`) are gated on `NODE_ENV`.

### Components

- `src/components/ui/` — animation primitives (`ScrollReveal`, `StaggerReveal`, `RevealText`,
  `masked-*`) that respect `prefers-reduced-motion`. Reduced-motion coverage is
  component-specific, not global: menu, media and route-transition effects each need their
  own guard. New animations must honor the preference explicitly. GSAP registration lives in
  `src/lib/animation/`.
- `components/layout/staggered-menu.tsx` started as a React Bits adaptation and is now owned TSX; there is no
  vendor folder any more.
- Gallery uses the maintained `react-photo-album` package; lightbox uses `yet-another-react-lightbox`.

## Skills

`.claude/skills/` holds project-local skills pinned by `skills-lock.json` — Sanity (schemas, GROQ,
Portable Text, TypeGen, Visual Editing), GSAP, Vercel/React performance, and SEO/AEO. Prefer them
over general knowledge when working in those areas. `.agents/skills/` is the same set for other
agent tooling; both are excluded from ESLint.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
