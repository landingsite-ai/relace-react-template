# i18n Setup Guide

This guide covers how to add multi-language support to a React website using react-i18next. Follow these steps exactly when a user asks for language switching, a language dropdown, or translated content.

## How It Works

- Default language has NO prefix: `/`, `/about`, `/contact`
- Other languages get a `/:lang` prefix: `/es`, `/es/about`, `/es/contact`
- The default language is NOT always English — it's whatever the site's primary language is
- The same route file serves both the default and localized versions (e.g., `about.tsx` serves `/about` AND `/es/about`)
- All translations are baked into static HTML at build time (SSG) — no client-side language detection
- Each language/page combo gets its own pre-rendered HTML file

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

i18n.use(initReactI18next).init({
  resources,
  lng: i18nConfig.defaultLanguage,
  fallbackLng: i18nConfig.defaultLanguage,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;
```

IMPORTANT: Use `import.meta.glob` with `eager: true` so translations load synchronously. Never install `i18next-browser-languagedetector` — language is determined by URL path only.

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

## Step 5: Create `app/components/LanguageSync.tsx`

Syncs the URL language to i18next during render:

```tsx
import { useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { i18nConfig } from "~/i18n/config";

export function LanguageSync() {
  const { pathname } = useLocation();
  const { i18n } = useTranslation();
  const firstSegment = pathname.split("/")[1];
  const lang = i18nConfig.languages.includes(firstSegment) && firstSegment !== i18nConfig.defaultLanguage
    ? firstSegment
    : i18nConfig.defaultLanguage;
  if (i18n.language !== lang) {
    i18n.changeLanguage(lang);
  }
  return null;
}
```

IMPORTANT: `changeLanguage` is called during render, NOT in `useEffect`. This prevents hydration mismatch between SSG output and client.

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

## Step 8: Edit `app/root.tsx`

Add these modifications:

1. Side-effect import to initialize i18next:
   ```ts
   import "~/i18n";
   ```

2. Import the language utility and LanguageSync:
   ```ts
   import { getLangFromPath } from "~/i18n/utils";
   import { LanguageSync } from "~/components/LanguageSync";
   ```

3. Add a root loader to extract language from the URL:
   ```ts
   export function loader({ request }: Route.LoaderArgs) {
     const url = new URL(request.url);
     return { lang: getLangFromPath(url.pathname) };
   }
   ```

4. Set `<html lang>` dynamically from the loader data in the Layout component. During SSG prerender, React Router runs the loader with the correct URL (e.g., `/es/about`), so the pre-rendered HTML gets `lang="es"` baked in.

5. Add `<LanguageSync />` as the FIRST child inside the `App` component (before Header).

## Step 9: Edit `app/routes.ts`

Add helper functions to generate localized route entries:

```ts
import { i18nConfig } from "./i18n/config";

function localizedRoutes(path: string, file: string): RouteConfig {
  return i18nConfig.languages
    .filter((lang) => lang !== i18nConfig.defaultLanguage)
    .map((lang) => route(`${lang}/${path}`, file));
}

function localizedIndex(file: string): RouteConfig {
  return i18nConfig.languages
    .filter((lang) => lang !== i18nConfig.defaultLanguage)
    .map((lang) => route(lang, file));
}
```

Then for each page, add both default and localized entries:

```ts
const routes: RouteConfig = [
  index("routes/_index.tsx"),
  ...localizedIndex("routes/_index.tsx"),
  route("about", "routes/about.tsx"),
  ...localizedRoutes("about", "routes/about.tsx"),
];
```

This produces: `/`, `/es`, `/about`, `/es/about` — all as explicit routes. The SSG prerender discovers them automatically via `getStaticPaths()`.

## Step 10: Edit route components to use translations

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
    <>
      <HreflangTags />
      <h1>{t("about.title")}</h1>
      <p>{t("about.description")}</p>
    </>
  );
}
```

Use `t()` from `useTranslation()` for all user-visible text in React components. Use `getTranslation()` from utils for `meta()` and other non-React contexts.
