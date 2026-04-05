# i18n Setup Guide

This guide covers how to add multi-language support to a React website using react-i18next. Follow these steps exactly when a user asks for language switching, a language dropdown, or translated content.

## How It Works

- Default language has NO prefix and uses original slugs: `/`, `/about`, `/contact`
- Other languages get a `/:lang` prefix with translated slugs: `/es`, `/es/sobre-nosotros`, `/es/contacto`
- The default language is NOT always English — it's whatever the site's primary language is
- `/es/about` returns 404 — only translated slugs work under non-default language prefixes
- All translations (including URL slugs) are baked into static HTML at build time (SSG)
- Each language/page combo gets its own pre-rendered HTML file

## IMPORTANT: Route Structure

React Router v7 assigns route IDs by file path. If the same file is used in two route entries, it causes a "No result found for routeId" error. To avoid this, non-default languages use thin re-export files in a subdirectory (e.g., `routes/es/about.tsx` re-exports from `routes/about.tsx`).

CORRECT — each route entry has its own unique file:
```ts
// Default language: top-level, original files
index("routes/_index.tsx"),
route("about", "routes/about.tsx"),

// Spanish: re-export files in routes/es/
route("es", "routes/es/lang-layout.tsx", [
  index("routes/es/_index.tsx"),
  route("sobre-nosotros", "routes/es/about.tsx"),  // re-exports from ../about
]),
```

WRONG — do NOT reuse the same file in multiple route entries:
```ts
// DO NOT DO THIS — causes route ID conflicts
index("routes/_index.tsx"),
route("about", "routes/about.tsx"),
route("es", "routes/lang-layout.tsx", [
  index("routes/_index.tsx"),                    // ❌ same file used twice
  route("sobre-nosotros", "routes/about.tsx"),   // ❌ same file used twice
]),
```

ALSO WRONG — do NOT use `:lang?` optional segments:
```ts
// DO NOT DO THIS — /es/about should not work, only /es/sobre-nosotros
route(":lang?", "routes/lang-layout.tsx", [
  route("about", "routes/about.tsx"),
])
```

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
// including Header/Footer which render outside the lang layout route.
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

IMPORTANT: Use `import.meta.glob` with `eager: true` so translations load synchronously. Never install `i18next-browser-languagedetector` — language is determined by URL path only. The `getInitialLang()` function reads the language from the URL at init time so the first render is correct everywhere — without this, components like Header/Footer would flash the default language first.

## Step 3: Create `app/i18n/utils.ts`

Utility functions for use in `meta()`, `routes.ts`, and other non-React contexts:

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

/**
 * Reverse slug lookup: given a translated slug and language, find the page key.
 * E.g., reverseSlug("sobre-nosotros", "es") → "about"
 */
export function reverseSlug(slug: string, lang: string): string | undefined {
  const mod = localeModules[`./locales/${lang}.json`];
  const translations = (mod?.default || mod) as Record<string, string> | undefined;
  if (!translations) return undefined;
  for (const [key, value] of Object.entries(translations)) {
    if (key.startsWith("slug.") && value === slug) {
      return key.replace("slug.", "");
    }
  }
  return undefined;
}
```

## Step 4: Create translation files

Create `app/i18n/locales/{lang}.json` for each language. Include `slug.*` keys for every page — these define the URL paths per language. Default language slugs are identity mappings (the value matches the route path):

```json
// en.json
{
  "slug.about": "about",
  "slug.services": "services",
  "slug.pricing": "pricing",
  "nav.home": "Home",
  "nav.about": "About",
  "hero.title": "Welcome to Our Site",
  "about.title": "About Us",
  "about.description": "We are a team..."
}
```

```json
// es.json
{
  "slug.about": "sobre-nosotros",
  "slug.services": "servicios",
  "slug.pricing": "precios",
  "nav.home": "Inicio",
  "nav.about": "Sobre Nosotros",
  "hero.title": "Bienvenido a Nuestro Sitio",
  "about.title": "Sobre Nosotros",
  "about.description": "Somos un equipo..."
}
```

## Step 5: Create `app/routes/lang-layout.tsx`

This layout handles language switching. It's used as the parent route for non-default language groups:

```tsx
import { Outlet } from "react-router";
import i18n from "~/i18n";
import { i18nConfig } from "~/i18n/config";
import type { Route } from "./+types/lang-layout";

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
  if (typeof document !== "undefined") {
    document.documentElement.lang = i18n.language;
  }

  return <Outlet />;
}
```

IMPORTANT: The language change happens in the `loader`, NOT during render. React Router awaits loaders before rendering, so Header, Footer, and all page components see the correct language immediately.

## Step 6: Create re-export files for each non-default language

For EVERY non-default language, create a directory `app/routes/{lang}/` with thin re-export files for every page. These files give each route a unique file path (avoiding React Router's route ID conflict) while sharing the same implementation.

Example for Spanish (`app/routes/es/`):

`app/routes/es/lang-layout.tsx`:
```tsx
export { default, loader } from "../lang-layout";
```

`app/routes/es/_index.tsx`:
```tsx
export { default, meta } from "../_index";
```

`app/routes/es/about.tsx`:
```tsx
export { default, meta } from "../about";
```

`app/routes/es/services.tsx`:
```tsx
export { default, meta } from "../services";
```

Create one re-export file per page. Only re-export the exports that actually exist in the source file (e.g., if a page has `meta` and `default` but no `loader`, only re-export `meta` and `default`).

Do this for EVERY page on the site, plus `lang-layout.tsx` and `_index.tsx`.

## Step 7: Create `app/components/HreflangTags.tsx`

Renders `<link rel="alternate" hreflang="...">` tags with translated slugs for SEO:

```tsx
import { useLocation } from "react-router";
import { i18nConfig } from "~/i18n/config";
import { getTranslation, reverseSlug, getLangFromPath } from "~/i18n/utils";

export function HreflangTags({ baseUrl }: { baseUrl?: string }) {
  const { pathname } = useLocation();
  const currentLang = getLangFromPath(pathname);

  const segments = pathname.split("/").filter(Boolean);
  const currentSlug = currentLang === i18nConfig.defaultLanguage
    ? segments[0]
    : segments[1];

  const pageKey = currentSlug ? reverseSlug(currentSlug, currentLang) : undefined;

  if (!pageKey) {
    return (
      <>
        {i18nConfig.languages.map((lang) => {
          const href = lang === i18nConfig.defaultLanguage
            ? `${baseUrl || ""}/`
            : `${baseUrl || ""}/${lang}`;
          return <link key={lang} rel="alternate" hrefLang={lang} href={href} />;
        })}
        <link rel="alternate" hrefLang="x-default" href={`${baseUrl || ""}/`} />
      </>
    );
  }

  return (
    <>
      {i18nConfig.languages.map((lang) => {
        const slug = getTranslation(lang, `slug.${pageKey}`);
        const href = lang === i18nConfig.defaultLanguage
          ? `${baseUrl || ""}/${slug}`
          : `${baseUrl || ""}/${lang}/${slug}`;
        return <link key={lang} rel="alternate" hrefLang={lang} href={href} />;
      })}
      <link rel="alternate" hrefLang="x-default" href={`${baseUrl || ""}/${getTranslation(i18nConfig.defaultLanguage, `slug.${pageKey}`)}`} />
    </>
  );
}
```

Add `<HreflangTags />` inside each route component so crawlers discover language variants.

## Step 8: Create `app/components/LanguageSwitcher.tsx`

Navigates between languages using translated slugs:

```tsx
import { Link, useLocation } from "react-router";
import { i18nConfig } from "~/i18n/config";
import { getTranslation, reverseSlug, getLangFromPath } from "~/i18n/utils";

export function LanguageSwitcher() {
  const { pathname } = useLocation();
  const currentLang = getLangFromPath(pathname);

  const segments = pathname.split("/").filter(Boolean);
  const currentSlug = currentLang === i18nConfig.defaultLanguage
    ? segments[0]
    : segments[1];

  const pageKey = currentSlug ? reverseSlug(currentSlug, currentLang) : undefined;

  return (
    <div className="flex gap-2">
      {i18nConfig.languages.map((lang) => {
        let to: string;
        if (!pageKey) {
          to = lang === i18nConfig.defaultLanguage ? "/" : `/${lang}`;
        } else {
          const slug = getTranslation(lang, `slug.${pageKey}`);
          to = lang === i18nConfig.defaultLanguage ? `/${slug}` : `/${lang}/${slug}`;
        }
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

## Step 9: Create `app/hooks/useLocalizedPath.ts`

Internal links must use translated slugs when on a non-default language page:

```ts
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";

export function useLocalizedPath(path: string): string {
  const { lang } = useParams();
  const { t } = useTranslation();
  if (!lang) return path;

  const segments = path.split("/").filter(Boolean);
  const translated = segments.map((seg) => t(`slug.${seg}`, seg));
  return `/${lang}/${translated.join("/")}`;
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

IMPORTANT: The path passed to `useLocalizedPath` should always use the default-language slug (e.g., `"/about"`, not `"/sobre-nosotros"`). The hook translates it to the current language's slug.

IMPORTANT: The logo/site-name link in the Header is often hardcoded to `"/"`. It MUST also use `useLocalizedPath("/")` so it points to `/es` on Spanish pages instead of `/`. Same for any other hardcoded `"/"` links.

## Step 10: Edit `app/root.tsx`

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

4. Set `<html lang>` dynamically from the loader data in the Layout component. During SSG prerender, React Router runs the loader with the correct URL, so the pre-rendered HTML gets the right `lang` attribute.

## Step 11: Edit `app/routes.ts`

Generate routes dynamically from locale slug translation keys. Default language pages are top-level. Non-default languages use re-export files under `routes/{lang}/`:

```ts
import { type RouteConfig, index, route } from "@react-router/dev/routes";
import { i18nConfig } from "./i18n/config";
import { getTranslation } from "./i18n/utils";

// Page registry: [slug key, route file]
// The slug key matches the "slug.{key}" entry in locale files.
// Add new pages here — slugs are looked up from locale files automatically.
const pages: [string, string][] = [
  ["about", "routes/about.tsx"],
  ["services", "routes/services.tsx"],
  ["pricing", "routes/pricing.tsx"],
  // ... add ALL pages on the site
];

// Default language: top-level, original slugs, no prefix
const defaultRoutes = pages.map(([key, file]) =>
  route(getTranslation(i18nConfig.defaultLanguage, `slug.${key}`), file)
);

// Non-default languages: translated slugs under /:lang prefix
// Uses re-export files in routes/{lang}/ to avoid route ID conflicts
const langGroups = i18nConfig.languages
  .filter((l) => l !== i18nConfig.defaultLanguage)
  .map((lang) =>
    route(lang, `routes/${lang}/lang-layout.tsx`, [
      index(`routes/${lang}/_index.tsx`),
      ...pages.map(([key, file]) => {
        const langFile = file.replace("routes/", `routes/${lang}/`);
        return route(getTranslation(lang, `slug.${key}`), langFile);
      }),
    ])
  );

const routes: RouteConfig = [
  // Default language pages (top-level, no layout wrapper)
  index("routes/_index.tsx"),
  ...defaultRoutes,

  // Non-default language groups
  ...langGroups,
];

// DEV ONLY: Catch-all route for 404s
if (process.env.NODE_ENV !== "production") {
  routes.push(route("*", "routes/$.tsx"));
}

export default routes;
```

When adding a new page:
1. Create the route file in `app/routes/` (e.g., `routes/contact.tsx`)
2. Add an entry to the `pages` array in `routes.ts`
3. Create a re-export file in `app/routes/{lang}/` for each non-default language
4. Add `slug.{key}` to every locale JSON file
5. Add content translation keys to every locale JSON file

## Step 12: Edit `react-router.config.ts`

Enumerate all language/slug combos from locale files for prerender:

```ts
import type { Config } from "@react-router/dev/config";

export default {
  ssr: process.env.NODE_ENV === "production",

  async prerender() {
    try {
      const { i18nConfig } = await import("./app/i18n/config.ts");
      const { getTranslation } = await import("./app/i18n/utils.ts");

      // Page keys must match the pages array in routes.ts
      const pageKeys = ["about", "services", "pricing"];

      const paths = ["/"];

      // Default language pages (original slugs)
      for (const key of pageKeys) {
        paths.push(`/${getTranslation(i18nConfig.defaultLanguage, `slug.${key}`)}`);
      }

      // Non-default language pages (translated slugs)
      for (const lang of i18nConfig.languages) {
        if (lang === i18nConfig.defaultLanguage) continue;
        paths.push(`/${lang}`); // homepage
        for (const key of pageKeys) {
          paths.push(`/${lang}/${getTranslation(lang, `slug.${key}`)}`);
        }
      }

      return paths;
    } catch {
      return ["/"];
    }
  },

  routeDiscovery: { mode: "initial" },
} satisfies Config;
```

When adding a new page, add its key to both the `pages` array in `routes.ts` AND the `pageKeys` array here.

## Step 13: Convert existing pages to use translations

For EVERY existing route component, you need to:

1. **Extract all hardcoded strings** — find every user-visible text string in the JSX (headings, paragraphs, button labels, alt text, placeholders, etc.)
2. **Create translation keys** — add each string to the locale JSON files with a descriptive dot-notation key
3. **Replace strings with `t()` calls** — swap each hardcoded string for `t("key")`
4. **Update `meta()`** — replace hardcoded title/description with `getTranslation()`
5. **Add `<HreflangTags />`** — include inside the component JSX
6. **Use `useLocalizedPath()`** — for ALL internal links

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
      <Link to="/contact">Contact Us</Link>
    </section>
  );
}
```

AFTER (translated):
```tsx
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { getLangFromPath, getTranslation } from "~/i18n/utils";
import { HreflangTags } from "~/components/HreflangTags";
import { useLocalizedPath } from "~/hooks/useLocalizedPath";
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
      <Link to={useLocalizedPath("/contact")}>{t("about.cta")}</Link>
    </section>
  );
}
```

And add to BOTH locale files:

`app/i18n/locales/en.json`:
```json
{
  "slug.about": "about",
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
  "slug.about": "sobre-nosotros",
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
- Always use `useLocalizedPath()` for internal links — pass the default-language slug, not the translated one
