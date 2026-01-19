# Personal Website

A portfolio website built with Next.js, TypeScript, and Sanity CMS.

## 🚀 Tech Stack

- **Next.js 16** - React framework with Turbopack
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Responsive styling
- **Sanity CMS** - Headless content management
- **Tone.js** - Audio synthesis for guitar trainer
- **Anime.js** - Scroll-triggered animations

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
