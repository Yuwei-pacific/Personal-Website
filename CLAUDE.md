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

`src/proxy.ts` (Next 16's `middleware.ts` replacement) 308-redirects any unprefixed path to the
default locale (`/about` → `/it/about`). For prefixed paths it also forwards an `x-site-locale`
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

- **Filtering and ordering happen in GROQ only** (`visibility != false`, `order(coalesce(year,0) desc, …)`).
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

`it` (default) and `en`, both always explicitly prefixed. Three separate layers:

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
are mapped to 400 on purpose), Fraunces (`font-display`) is for large titles only, and `accent`
(Cobalt in light, Coral in dark) goes on lines and dots, never on text.

The "inked" effect (the bloomed L·i mark, the hero ink line and the inked slogan word) renders with
WebGL2 in `src/components/ui/ink/` (`ink-gl.ts` renderer, `ink-surface.tsx` wrapper); `ui/ink-mark.tsx`
exposes `InkMark` / `InkWord` and keeps the old SVG-filter version only as a static fallback
when WebGL2 is unavailable. Do not animate the SVG filter version — it rasterizes on the CPU and drops
frames. Blur fields are computed once per resize; per frame the shader adds slow flow, a "breathing"
noise that thickens and thins the bloom, and the pointer "stir" field: moving the cursor (no clicks)
pushes the ink aside and cuts a gap along its path, which decays so the ink flows back together.
The stir field lives in 8-bit ping-pong textures, so its decay must step at least one quantum per
frame or small offsets get stuck. Reduced motion renders one static frame. Colors come from the shared
tables in `ui/ink/ink-tables.ts`.

The hero draws the mark and the ink line on **one** canvas (`HeroInk`, covering the section) so their
blooms merge where the line runs into the "i" stem. Layout only places two empty slots,
`InkMarkSlot` (`data-ink="mark"`, the ink box) and `InkLineSlot` (`data-ink="line"`, the line runs on
its vertical center); `buildHero` reads their rects and ends the line on the stem's centerline. When
WebGL2 is missing, `HeroInk` renders nothing and the slots show the SVG fallbacks.

`src/components/ui/sheet.tsx` (experimental, home page only) stacks sections like sheets of paper
with `position: sticky`; siblings must share one parent and each sheet is at least one viewport tall.

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
  `Parallax`, `masked-*`) that respect `prefers-reduced-motion`. Reduced-motion coverage is
  component-specific, not global: vendor, menu, media and route-transition effects each need their
  own guard. New animations must honor the preference explicitly. GSAP registration lives in
  `src/lib/animation/`.
- `src/components/vendor/` — low-touch React Bits adaptations kept in JS with local `.d.ts`
  declarations and `src/components/vendor/README.md` documenting the workflow. Import DOM-heavy
  ones dynamically with `ssr: false`. A component that starts owning core behavior gets migrated to
  TSX instead — `components/layout/staggered-menu.tsx` already crossed that line and is owned TSX.
- Gallery uses the maintained `react-photo-album` package; lightbox uses `yet-another-react-lightbox`.

## Skills

`.claude/skills/` holds project-local skills pinned by `skills-lock.json` — Sanity (schemas, GROQ,
Portable Text, TypeGen, Visual Editing), GSAP, Vercel/React performance, and SEO/AEO. Prefer them
over general knowledge when working in those areas. `.agents/skills/` is the same set for other
agent tooling; both are excluded from ESLint.
