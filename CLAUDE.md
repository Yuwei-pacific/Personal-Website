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
default locale (`/about` → `/it/about`). It only redirects; it does not inject a locale header.
Matcher excludes `/studio`, `/_next`, and anything with a file extension.

Every public page renders `<Navbar />`, then one `<main id="main-content">` wrapping **all** of its
content, then `<Footer />`. The layout's wrapping `<div>` is only a background container — the
`main` landmark and skip-link target belong to the page, so navigation stays outside `main`.

### Data flow: GROQ query → normalizer → UI

```
page.tsx (Server Component)
  └─ sanityFetch()            src/sanity/live.ts    ← the only read path
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
  (the one exception is `fetchProjectSlugs`, which only needs static slugs).
- **The CMS is the only content source.** There is no in-repo fallback copy — when a query returns
  nothing, render an empty state.

### `sanityFetch` in `src/sanity/live.ts` is a deliberate fork

It mirrors next-sanity's `defineLive().sanityFetch` with one change: the inner data fetch gets
`revalidate: 60` instead of the upstream hardcoded `revalidate: false`. Rationale — if a `SanityLive`
event is ever missed, the Data Cache entry would otherwise never expire, and a page-level
`export const revalidate` cannot reach that inner fetch record. Sync tags are preserved exactly, so
`<SanityLive />` invalidation still works. The file documents the two conditions under which the fork
can be deleted; **re-verify against `next-sanity@13.2.1` whenever that dependency is upgraded.**

`<SanityLive />` is mounted once in the site layout with `includeDrafts={false}`, so published edits
reach open pages without a rebuild.

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

Single theme — there is no dark-mode toggle. The `design-light-*` and `design-dark-*` Tailwind
colors are fixed **surface** tokens: light sections use `design-light-*`, the Work grid and project
detail sections use `design-dark-*`. A dark section declares `data-overscroll-dark` so the body
background matches during overscroll bounce.

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
