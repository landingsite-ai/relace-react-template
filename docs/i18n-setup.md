# i18n Setup Guide

This guide covers how to add multi-language support to a React website using react-i18next. Follow these steps exactly when a user asks for language switching, a language dropdown, or translated content.

## How It Works

- Default language has NO prefix: `/`, `/about`, `/contact`
- Other languages get a `/:lang` prefix: `/es`, `/es/about`, `/es/contact`
- The default language is NOT always English — it's whatever the site's primary language is
- Routes use React Router's optional `:lang?` segment — one route entry per page handles all languages
- All translations are baked into static HTML at build time (SSG) — no client-side language detection
- Each language/page combo gets its own pre-rendered HTML file

## IMPORTANT: Route Structure

All page routes MUST be wrapped inside a single `:lang?` layout route. Do NOT create separate route entries per language.

CORRECT — one route entry per page inside `:lang?` layout:
```ts
route(":lang?", "routes/lang-layout.tsx", [
  index("routes/_index.tsx"),
  route("about", "routes/about.tsx"),
])
```

WRONG — do NOT duplicate routes per language:
```ts
// DO NOT DO THIS — same file for two routes breaks in dev mode
index("routes/_index.tsx"),
route("es", "routes/_index.tsx"),
route("about", "routes/about.tsx"),
route("es/about", "routes/about.tsx"),
```

The `:lang?` segment is optional — it matches both `/about` (no prefix, default language) and `/es/about` (with prefix) using a single route entry. The `lang-layout.tsx` layout handles language detection.

NOTE: The layout file MUST be named `lang-layout.tsx`, NOT `_lang.tsx`. Files starting with `_` are treated as pathless layouts by the React Router Vite plugin and will fail to load.

## Step 1: Create `app/i18n/config.ts`

Single source of truth for language configuration:

```ts
export const i18nConfig = {
  defaultLanguage: "en",
  languages: ["en", "es"],
  languageNames: { en: "English", es: "Español" } as Record<string, string>,
};
```

Adjust `defaultLanguage`, `languages`, and `languageNames` based on what the user asks for.

## Step 2: Create `app/i18n/index.ts`

Initialize i18next with all translations loaded eagerly (critical for SSG):

```ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { i18nConfig } from "./config";

const localeModules = import.meta.glob("./locales/*.json", { eager: true });

const resources: Record<string, { translation: Record<string, string> }> = {};
for (const [path, module] of Object.entries(localeModules)) {
  const lang = path.match(/\.\/locales\/(.+)\.json/)?.[1];
  if (lang) {
    resources[lang] = { translation: (module as any).default || module };
  }
}

// Detect initial language from URL on client (before React renders).
// This ensures the very first render has the correct language everywhere,
// including Header/Footer which render outside the :lang? layout route.
// On the server (SSR), window doesn't exist — the lang-layout loader handles it.
function getInitialLang(): string {
  if (typeof window !== "undefined") {
    const firstSegment = window.location.pathname.split("/")[1];
    if (
      i18nConfig.languages.includes(firstSegment) &&
      firstSegment !== i18nConfig.defaultLanguage
    ) {
      return firstSegment;
    }
  }
  return i18nConfig.defaultLanguage;
}

i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLang(),
  fallbackLng: i18nConfig.defaultLanguage,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;
```

IMPORTANT: Use `import.meta.glob` with `eager: true` so translations load synchronously. Never install `i18next-browser-languagedetector` — language is determined by URL path only. The `getInitialLang()` function reads the language from the URL at init time so the first render is correct everywhere — without this, components like Header/Footer that render outside the `:lang?` layout would flash the default language first.

## Step 3: Create `app/i18n/utils.ts`

Utility functions for use in `meta()` and other non-React contexts where hooks aren't available:

```ts
import { i18nConfig } from "./config";

const localeModules = import.meta.glob("./locales/*.json", { eager: true }) as Record<string, { default?: Record<string, string> }>;

export function getLangFromPath(pathname: string): string {
  const firstSegment = pathname.split("/")[1];
  return i18nConfig.languages.includes(firstSegment) && firstSegment !== i18nConfig.defaultLanguage
    ? firstSegment
    : i18nConfig.defaultLanguage;
}

export function getTranslation(lang: string, key: string): string {
  const mod = localeModules[`./locales/${lang}.json`];
  const translations = mod?.default || mod;
  return (translations as any)?.[key] || key;
}
```

## Step 4: Create translation files

Create `app/i18n/locales/{lang}.json` for each language. Use flat dot-notation keys:

```json
{
  "nav.home": "Home",
  "nav.about": "About",
  "hero.title": "Welcome to Our Site",
  "hero.subtitle": "Building the future",
  "about.title": "About Us",
  "about.description": "We are a team..."
}
```

Create one file per language (e.g., `en.json`, `es.json`). Add keys as you build pages.

## Step 5: Create `app/routes/lang-layout.tsx` (language layout route)

This is a layout route that wraps all pages and handles the optional `:lang?` URL prefix. It renders LanguageSync and then the child route via `<Outlet />`:

```tsx
import { Outlet } from "react-router";
import i18n from "~/i18n";
import { i18nConfig } from "~/i18n/config";
import type { Route } from "./+types/lang-layout";

/**
 * Language layout route.
 * Wraps all pages under the optional :lang? prefix.
 *
 * The loader runs BEFORE React renders (both in SSR and client-side navigation),
 * so i18next has the correct language set by the time any component mounts.
 * This prevents Header/Footer from flashing the default language.
 */
export async function loader({ params }: Route.LoaderArgs) {
  const lang = params.lang && i18nConfig.languages.includes(params.lang)
    ? params.lang
    : i18nConfig.defaultLanguage;

  if (i18n.language !== lang) {
    await i18n.changeLanguage(lang);
  }

  return { lang };
}

export default function LangLayout() {
  // Keep <html lang> in sync — works in both dev (SPA) and production (SSG)
  if (typeof document !== "undefined") {
    document.documentElement.lang = i18n.language;
  }

  return <Outlet />;
}
```

IMPORTANT: The language change happens in the `loader`, NOT during render. React Router awaits loaders before rendering, so by the time Header, Footer, and page components mount, `i18n.language` is already correct. This prevents the flash-of-wrong-language issue where Header would briefly show the default language.

The `getInitialLang()` in Step 2 handles the initial page load (before any loader runs). The loader here handles client-side navigation between languages (e.g., user clicks from `/` to `/es`).

## Step 6: Create `app/components/HreflangTags.tsx`

Renders `<link rel="alternate" hreflang="...">` tags for SEO:

```tsx
import { useLocation } from "react-router";
import { i18nConfig } from "~/i18n/config";

export function HreflangTags({ baseUrl }: { baseUrl?: string }) {
  const { pathname } = useLocation();
  const firstSegment = pathname.split("/")[1];
  const isNonDefault = i18nConfig.languages.includes(firstSegment) && firstSegment !== i18nConfig.defaultLanguage;
  const basePath = isNonDefault ? pathname.replace(`/${firstSegment}`, "") || "/" : pathname;

  return (
    <>
      {i18nConfig.languages.map((lang) => {
        const href = lang === i18nConfig.defaultLanguage
          ? `${baseUrl || ""}${basePath}`
          : `${baseUrl || ""}/${lang}${basePath === "/" ? "" : basePath}`;
        return <link key={lang} rel="alternate" hrefLang={lang} href={href} />;
      })}
      <link rel="alternate" hrefLang="x-default" href={`${baseUrl || ""}${basePath}`} />
    </>
  );
}
```

Add `<HreflangTags />` inside each route component so crawlers discover language variants.

## Step 7: Create `app/components/LanguageSwitcher.tsx`

UI component for switching languages:

```tsx
import { Link, useLocation } from "react-router";
import { i18nConfig } from "~/i18n/config";

export function LanguageSwitcher() {
  const { pathname } = useLocation();
  const firstSegment = pathname.split("/")[1];
  const isNonDefault = i18nConfig.languages.includes(firstSegment) && firstSegment !== i18nConfig.defaultLanguage;
  const currentLang = isNonDefault ? firstSegment : i18nConfig.defaultLanguage;
  const basePath = isNonDefault ? pathname.replace(`/${firstSegment}`, "") || "/" : pathname;

  return (
    <div className="flex gap-2">
      {i18nConfig.languages.map((lang) => {
        const to = lang === i18nConfig.defaultLanguage
          ? basePath
          : `/${lang}${basePath === "/" ? "" : basePath}`;
        return (
          <Link key={lang} to={to} className={currentLang === lang ? "font-bold" : ""}>
            {i18nConfig.languageNames[lang]}
          </Link>
        );
      })}
    </div>
  );
}
```

Place the LanguageSwitcher in the Header component.

## Step 8: Create `app/hooks/useLocalizedPath.ts`

Internal links must include the language prefix when on a non-default language page. This hook reads `:lang` from route params and prefixes paths automatically:

```ts
import { useParams } from "react-router";

export function useLocalizedPath(path: string): string {
  const { lang } = useParams();
  if (!lang) return path;
  return `/${lang}${path === "/" ? "" : path}`;
}
```

Use it on EVERY internal `<Link>` in Header, Footer, CTAs, and page content:

```tsx
import { Link } from "react-router";
import { useLocalizedPath } from "~/hooks/useLocalizedPath";

// Before:
<Link to="/about">About</Link>

// After:
<Link to={useLocalizedPath("/about")}>About</Link>
```

When the user is on `/es/about`, `params.lang` is `"es"`, so `useLocalizedPath("/contact")` returns `"/es/contact"`. On the default language (no prefix), `params.lang` is undefined and paths are returned unchanged.

IMPORTANT: Do this for ALL internal links across the entire site — Header nav, Footer links, CTA buttons, inline links in page content. If a link points to an internal page and doesn't use `useLocalizedPath`, clicking it will drop the user back to the default language.

## Step 9: Edit `app/root.tsx`

Add these modifications:

1. Side-effect import to initialize i18next:
   ```ts
   import "~/i18n";
   ```

2. Import the language utility:
   ```ts
   import { getLangFromPath } from "~/i18n/utils";
   ```

3. Add a root loader to extract language from the URL:
   ```ts
   export function loader({ request }: Route.LoaderArgs) {
     const url = new URL(request.url);
     return { lang: getLangFromPath(url.pathname) };
   }
   ```

4. Set `<html lang>` dynamically from the loader data in the Layout component. During SSG prerender, React Router runs the loader with the correct URL (e.g., `/es/about`), so the pre-rendered HTML gets `lang="es"` baked in.

5. Note: LanguageSync is now handled by the `lang-layout.tsx` layout route (Step 5), NOT in root.tsx.

## Step 10: Edit `app/routes.ts`

Wrap all page routes under a `:lang?` layout route. The `:lang?` segment is optional — it matches both `/about` (no language prefix) and `/es/about` (with prefix):

```ts
import { type RouteConfig, index, route } from "@react-router/dev/routes";

const routes: RouteConfig = [
  // All pages wrapped in the :lang? layout for i18n
  route(":lang?", "routes/lang-layout.tsx", [
    index("routes/_index.tsx"),
    route("about", "routes/about.tsx"),
    route("services", "routes/services.tsx"),
    // ... add more pages as children here
  ]),
];

// DEV ONLY: Catch-all route for 404s
if (process.env.NODE_ENV !== "production") {
  routes.push(route("*", "routes/$.tsx"));
}

export default routes;
```

This single structure handles all languages. Adding a new page just means adding one `route()` entry inside the children array.

## Step 11: Edit `react-router.config.ts`

The `:lang?` routes are parameterized, so `getStaticPaths()` alone won't enumerate language variants. Update the prerender config to expand paths for each language:

```ts
import type { Config } from "@react-router/dev/config";

export default {
  ssr: process.env.NODE_ENV === "production",

  async prerender({ getStaticPaths }) {
    const staticPaths = getStaticPaths();

    try {
      const { i18nConfig } = await import("./app/i18n/config.ts");
      const extraLangs = i18nConfig.languages.filter(
        (l) => l !== i18nConfig.defaultLanguage
      );

      if (extraLangs.length === 0) return staticPaths;

      // For each base path, also generate /:lang versions
      const langPaths = staticPaths.flatMap((p) =>
        extraLangs.map((l) => `/${l}${p === "/" ? "" : p}`)
      );

      return [...staticPaths, ...langPaths];
    } catch {
      // No i18n config — return paths as-is
      return staticPaths;
    }
  },

  routeDiscovery: { mode: "initial" },
} satisfies Config;
```

If `getStaticPaths()` does not return the child routes (because they're under `:lang?`), list the base paths explicitly instead:

```ts
async prerender() {
  const basePaths = ["/", "/about", "/services"]; // keep in sync with routes.ts

  try {
    const { i18nConfig } = await import("./app/i18n/config.ts");
    const extraLangs = i18nConfig.languages.filter(
      (l) => l !== i18nConfig.defaultLanguage
    );
    const langPaths = basePaths.flatMap((p) =>
      extraLangs.map((l) => `/${l}${p === "/" ? "" : p}`)
    );
    return [...basePaths, ...langPaths];
  } catch {
    return basePaths;
  }
}
```

When adding a new page, add its path to both `routes.ts` (as a child route) AND the `basePaths` array here.

## Step 12: Convert existing pages to use translations

For EVERY existing route component, you need to:

1. **Extract all hardcoded strings** — find every user-visible text string in the JSX (headings, paragraphs, button labels, alt text, placeholders, etc.)
2. **Create translation keys** — add each string to the locale JSON files with a descriptive dot-notation key
3. **Replace strings with `t()` calls** — swap each hardcoded string for `t("key")`
4. **Update `meta()`** — replace hardcoded title/description with `getTranslation()`
5. **Add `<HreflangTags />`** — include inside the component JSX

### Example: Converting a page

BEFORE (hardcoded English):
```tsx
export function meta() {
  return [
    { title: "About Us" },
    { name: "description", content: "Learn about our company" },
  ];
}

export default function About() {
  return (
    <section className="container mx-auto py-16">
      <h1 className="text-4xl font-bold">About Our Company</h1>
      <p className="mt-4">We are a team of experts dedicated to helping you grow.</p>
      <button className="mt-8 bg-blue-600 text-white px-6 py-3 rounded">
        Contact Us
      </button>
    </section>
  );
}
```

AFTER (translated):
```tsx
import { useTranslation } from "react-i18next";
import { getLangFromPath, getTranslation } from "~/i18n/utils";
import { HreflangTags } from "~/components/HreflangTags";
import type { Route } from "./+types/about";

export function meta({ location }: Route.MetaArgs) {
  const lang = getLangFromPath(location.pathname);
  return [
    { title: getTranslation(lang, "about.meta.title") },
    { name: "description", content: getTranslation(lang, "about.meta.description") },
  ];
}

export default function About() {
  const { t } = useTranslation();
  return (
    <section className="container mx-auto py-16">
      <HreflangTags />
      <h1 className="text-4xl font-bold">{t("about.heading")}</h1>
      <p className="mt-4">{t("about.description")}</p>
      <button className="mt-8 bg-blue-600 text-white px-6 py-3 rounded">
        {t("about.cta")}
      </button>
    </section>
  );
}
```

And add to BOTH locale files:

`app/i18n/locales/en.json`:
```json
{
  "about.meta.title": "About Us",
  "about.meta.description": "Learn about our company",
  "about.heading": "About Our Company",
  "about.description": "We are a team of experts dedicated to helping you grow.",
  "about.cta": "Contact Us"
}
```

`app/i18n/locales/es.json`:
```json
{
  "about.meta.title": "Sobre Nosotros",
  "about.meta.description": "Conozca nuestra empresa",
  "about.heading": "Sobre Nuestra Empresa",
  "about.description": "Somos un equipo de expertos dedicados a ayudarte a crecer.",
  "about.cta": "Contáctenos"
}
```

### Key rules

- **Every** user-visible string must be extracted — don't leave any hardcoded text
- Use `t()` from `useTranslation()` inside React components
- Use `getTranslation(lang, key)` from `~/i18n/utils` in `meta()` and other non-React contexts (where hooks aren't available)
- Key naming: use `{page}.{section}.{element}` dot notation (e.g., `home.hero.title`, `about.cta`)
- Do this for ALL pages, including shared components like Header and Footer
- Add `<HreflangTags />` to every page component (not shared components)
