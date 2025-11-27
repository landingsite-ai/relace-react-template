# React Website Template

This is the base template for Landingsite.ai React websites.

## Features

- **React 19** with TypeScript
- **Vite** for fast development and builds
- **Tailwind CSS** for utility-first styling
- **shadcn/ui** components pre-configured
- **React Router** for client-side routing

## Pre-installed UI Stack

- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Accessible, customizable components
- **Radix UI** - Primitive components (comes with shadcn)
- **Lucide React** - Beautiful icons
- **class-variance-authority** - Component variants
- **tailwind-merge** - Class merging utility

## Usage

This template is uploaded to Relace as a source repository. When a user creates a new React website, we fork this template to create their repository.

### Development

```bash
npm install
npm run dev
```

### Build

```bash
npm run build
```

### Lint & Type Check

```bash
npm run lint
npm run typecheck
```

## Directory Structure

```
src/
├── components/
│   ├── ui/           # shadcn/ui components
│   ├── Layout.tsx    # Main layout wrapper
│   ├── Header.tsx    # Site header with nav
│   └── Footer.tsx    # Site footer
├── pages/
│   └── Home.tsx      # Home page
├── styles/
│   └── globals.css   # Tailwind base styles + CSS variables
├── lib/
│   └── utils.ts      # cn() helper and utilities
├── App.tsx           # Root component with routing
└── main.tsx          # Entry point
```

## Notes for AI

- All UI components use Tailwind CSS classes
- shadcn/ui components are in `src/components/ui/`
- Use the `cn()` helper from `@/lib/utils` for merging classes
- CSS variables for theming are in `src/styles/globals.css`

