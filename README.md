# Personal Website

A portfolio website built with Next.js, TypeScript, and Sanity CMS.

## 🚀 Tech Stack

- **Next.js 16** - React framework with Turbopack
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Responsive styling
- **Sanity CMS** - Headless content management
- **Tone.js** - Audio synthesis for guitar trainer
- **Anime.js** - Scroll-triggered animations

## 📂 Project Structure

```
Personal-Website/
├─ app/
│  ├─ globals.css              # Global Tailwind styles and CSS variables
│  ├─ layout.tsx               # Root layout with providers
│  ├─ page.tsx                 # Landing page
│  ├─ guitar-fretboard-trainer/page.tsx
│  └─ projects/[slug]/page.tsx # Dynamic project detail pages
├─ components/
│  ├─ layout/                  # Layout primitives (navbar, etc.)
│  ├─ projects/                # Project cards, gallery, hover previews
│  ├─ providers/               # Animation provider
│  ├─ sections/                # Page sections (hero, about, projects)
│  ├─ seo/                     # Structured data helpers
│  └─ ui/                      # Reusable UI elements (buttons)
├─ hooks/                      # Animation and scroll hooks
├─ lib/                        # Sanity client and shared utilities
├─ public/                     # Static assets
├─ sanity/personal-website/    # Sanity Studio configuration and schemas
└─ types/                      # Shared TypeScript types
```

## ⚙️ Setup

### Prerequisites
- Node.js v20+ and npm v10+

### Installation

```bash
git clone <repository>
cd Personal-Website
npm install
```

### Configuration

Create `.env.local`:
```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01
```

### Development

```bash
# Terminal 1: Website
npm run dev          # http://localhost:3000

# Terminal 2: Sanity Studio
cd sanity/personal-website
npm run dev          # http://localhost:3333
```

## 📦 Scripts

```bash
npm run dev       # Development server
npm run build     # Production build
npm start         # Production server
npm run lint      # ESLint
```

## 📄 License & Author

**Yuwei Li** - [Portfolio](https://yuweili.site) | [GitHub](https://github.com/Yuwei-pacific)
