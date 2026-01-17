# Personal Website

## 🚀 Tech Stack


| Technology                                    | Purpose                              |
| --------------------------------------------- | ------------------------------------ |
| [Next.js 16](https://nextjs.org/)             | React framework with Turbopack       |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe JavaScript                 |
| [Tailwind CSS](https://tailwindcss.com/)      | Utility-first CSS framework          |
| [Sanity CMS](https://www.sanity.io/)          | Headless content management system   |
| [Tone.js](https://tonejs.org/)                | Web audio synthesis (Guitar Trainer) |

## 📁 Project Structure

```
Personal-Website/
├── app/                                 # Next.js App Router
│   ├── page.tsx                        # Home page
│   ├── layout.tsx                      # Root layout
│   ├── globals.css                     # Global styles
│   ├── guitar-fretboard-trainer/       # Guitar trainer app
│   │   └── page.tsx
│   └── projects/
│       └── [slug]/                     # Dynamic project pages
│           └── page.tsx
│
├── components/                         # Reusable React components
│   ├── layout/
│   │   └── navbar.tsx                  # Navigation bar
│   ├── sections/
│   │   ├── hero.tsx                    # Hero section
│   │   ├── about-section.tsx           # About section
│   │   └── projects-section.tsx        # Projects section
│   ├── projects/
│   │   └── project-gallery.tsx         # Project gallery component
│   └── ui/
│       └── button.tsx                  # Reusable button component
│
├── lib/                                # Utility functions & services
│   ├── sanity.ts                       # Sanity client configuration
│   └── utils.ts                        # Helper functions
│
├── public/                             # Static assets
│   ├── Logo.svg                        # Logo (SVG)
│   ├── Logo&name.svg                   # Logo with name (SVG)
│   ├── Profile_Yuwei.webp              # Profile image
│   ├── hero_mg.svg                     # Hero section graphic
│   ├── arrow_1.svg                     # Arrow graphic
│   ├── diamond_1.svg & diamond_2.svg   # Diamond graphics
│   └── favicon.ico                     # Website favicon
│
├── sanity/                             # Sanity CMS configuration
│   └── personal-website/
│       ├── schemaTypes/
│       │   ├── index.ts                # Schema exports
│       │   └── project.ts              # Project schema definition
│       ├── sanity.config.ts            # Sanity configuration
│       ├── sanity.cli.ts               # Sanity CLI configuration
│       └── package.json                # Sanity dependencies
│
├── .vscode/                            # VS Code settings
├── Configuration files
│   ├── next.config.ts                  # Next.js configuration
│   ├── tsconfig.json                   # TypeScript configuration
│   ├── tailwind.config.ts              # Tailwind CSS configuration
│   ├── postcss.config.mjs              # PostCSS configuration
│   ├── eslint.config.mjs               # ESLint configuration
│   └── components.json                 # UI component registry
└── package.json                        # Project dependencies

```

## 🎯 Features

- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Dark Mode Support** - Theme switching capability
- **Dynamic Content** - Sanity CMS integration for project management
- **Guitar Fretboard Trainer** - Interactive music learning tool with audio synthesis
- **SEO Optimized** - Next.js metadata and structured content
- **Type-Safe** - Full TypeScript support across the project

## ⚙️ Prerequisites

- **Node.js** v20 or later
- **npm** v10 or later

## 🔧 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/your_username/Personal-Website.git
cd Personal-Website
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01
```

### 3. Run Development Server

```bash
# Run the website (Port 3000)
npm run dev

# In another terminal, run Sanity Studio
cd sanity/personal-website
npm run dev
```

Open browser:

- **Website**: [http://localhost:3000](http://localhost:3000)
- **Sanity Studio**: [http://localhost:3333](http://localhost:3333)

## 📦 Available Scripts

### Root Directory

```bash
npm run dev       # Start Next.js development server
npm run build     # Build for production
npm start         # Start production server
npm run lint      # Run ESLint
```

### Sanity Directory (`sanity/personal-website`)

```bash
npm run dev       # Start Sanity Studio development server
npm run build     # Build Sanity Studio for production
npm start         # Start production Sanity Studio
```

## 🎨 Components

### Pages

- **`/`** - Home page with hero, about, and projects sections
- **`/guitar-fretboard-trainer`** - Interactive guitar learning tool
- **`/projects/[slug]`** - Dynamic project detail pages

### Key Components

- **Navbar** - Navigation with responsive menu
- **Hero Section** - Landing section with call-to-action
- **About Section** - Personal introduction
- **Projects Section** - Featured projects showcase
- **Project Gallery** - Project listing with filtering
- **Guitar Fretboard Trainer** - Find-all-notes and ear-training modes

## 🚀 Deployment

### Deploy on Vercel (Recommended)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables
5. Click "Deploy"

```bash
# Alternatively, use Vercel CLI
npm i -g vercel
vercel
```

### Deploy on Other Platforms

Refer to [Next.js Deployment Documentation](https://nextjs.org/docs/app/building-your-application/deploying)

## 📝 Environment Variables

Required environment variables:


| Variable                         | Description         | Example      |
| -------------------------------- | ------------------- | ------------ |
| `NEXT_PUBLIC_SANITY_PROJECT_ID`  | Sanity project ID   | `ubdc9y57`   |
| `NEXT_PUBLIC_SANITY_DATASET`     | Sanity dataset name | `production` |
| `NEXT_PUBLIC_SANITY_API_VERSION` | Sanity API version  | `2024-01-01` |

## 🛠️ Development Tips

- Use `npm run lint` regularly to maintain code quality
- Check TypeScript errors: `npx tsc --noEmit`
- Format code with Prettier (configured in ESLint)
- Test responsive design using VS Code's device emulation

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Sanity Documentation](https://www.sanity.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 📄 License

This project is private and for personal use.

## 👤 Author

**Yuwei Li**

- Portfolio: [https://yuweili.site](https://yuweili.site)
- GitHub: [@Yuwei-pacific](https://github.com/Yuwei-pacific)
- Email: snowtime200801@gmail.com
