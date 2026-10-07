# The Stack House — Portfolio

Michael Walton's portfolio: a 3D entry gate (`/`), a conventional portfolio (`/portfolio`), and **The Stack House** (`/house`), a first-person 3D house that surfaces the work in-world. Built with Next.js, React Three Fiber, and Three.js.

Before changing anything, read:

- [`STATUS.md`](STATUS.md) — current implementation state and active work
- [`AGENTS.md`](AGENTS.md) — canonical design sources and locked decisions for `/house`
- [`lib/portfolio-projects.ts`](lib/portfolio-projects.ts) — the public list of Grey Key projects shown on the site

This repository is `GreyKeyStudios/portfolio`; local checkouts are often named `stackhouse`. For how it relates to other Grey Key repositories, see the [Repository Catalog](https://github.com/GreyKeyStudios/Grey-Key-Operating-System/blob/main/portfolio/REPOSITORY-CATALOG.md).

## Tech Stack

- **Next.js 15** - React framework with static export
- **React Three Fiber** - React renderer for Three.js
- **Three.js** - 3D graphics library
- **@react-three/drei** - Useful helpers for React Three Fiber
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd portfolio
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Building for Production

The project is configured for static export, making it compatible with Cloudflare Pages and other static hosting services.

```bash
npm run build
```

The static files will be generated in the `out` directory.

## Deployment

This project is configured to automatically deploy to Cloudflare Pages via GitHub Actions when pushing to the `main` branch.

### Manual Deployment

If you need to deploy manually:

```bash
npm run build
npx wrangler pages deploy out --project-name=portfolio
```

## Project Structure

```
portfolio/
├── app/              # Next.js app directory
│   ├── page.tsx      # Main page component
│   ├── layout.tsx    # Root layout
│   └── globals.css   # Global styles
├── .github/
│   └── workflows/
│       └── deploy.yml # CI/CD workflow
├── next.config.mjs   # Next.js configuration
├── package.json      # Dependencies and scripts
└── wrangler.toml     # Cloudflare Pages configuration
```

## Development Notes

- The project uses static export (`output: 'export'` in `next.config.mjs`)
- Images are unoptimized for static export compatibility
- TypeScript and ESLint errors are ignored during builds for faster iteration

## License

Private project
