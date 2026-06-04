/**
 * vite-plugin-source-loc
 *
 * Dev-only Vite plugin that stamps a `data-source-loc="file:line:col"` attribute
 * onto every host (intrinsic) JSX element in the app's own source. A runtime
 * resolver can then map a rendered DOM node back to the exact source location
 * that produced it (used by the preview's element picker, inline text editing,
 * and the agent's edit targeting).
 *
 * WHY A CUSTOM PLUGIN (U1 compatibility spike outcome):
 * The template's JSX transform is owned by `@react-router/dev/vite`
 * (`reactRouter()`), NOT `@vitejs/plugin-react`. Off-the-shelf source-locator
 * plugins hook around the latter's Babel transform, so their stamping is not
 * guaranteed under React Router v7. This plugin sidesteps the question entirely:
 * it runs with `enforce: "pre"`, so it transforms the raw `.tsx`/`.jsx` source
 * (JSX intact) BEFORE any downstream JSX transform — react-router's transform
 * then compiles our injected attribute along with the rest of the JSX. The
 * attribute survives as an ordinary string-valued DOM attribute in React 19.
 *
 * DEV-ONLY: gated on `apply: "serve"`. The live preview runs the Vite dev
 * server; the published/exported artifact comes from `vite build`. The plugin
 * never runs during `build`, so attributes never leak into published sites.
 */
import { parse } from "@babel/parser";
import MagicString from "magic-string";
import path from "node:path";
import type { PluginOption } from "vite";

/**
 * Shared contract: the attribute name and value format both the build-time
 * stamp (here) and the runtime consumers (U2 resolver, U5 sandbox replace)
 * must agree on. Value format is `<repo-relative-path>:<line>:<column>` where
 * line is 1-based and column is 1-based (Babel reports 0-based columns; we add 1).
 */
export const SOURCE_LOC_ATTR = "data-source-loc";

/** True only for intrinsic/host elements (`<div>`, `<h1>`) — lowercase first
 *  letter. Excludes components (`<Header/>`) and member tags (`<motion.div/>`),
 *  which do not map reliably to a single DOM node. */
function isHostElement(name: { type: string; name?: string }): boolean {
  if (name.type !== "JSXIdentifier" || !name.name) return false;
  const first = name.name[0];
  return first >= "a" && first <= "z";
}

/** Minimal recursive AST walk — avoids an @babel/traverse dependency. Visits
 *  every node with a string `type`. Skips position/comment metadata keys. */
function walk(node: unknown, visit: (n: any) => void): void {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const child of node) walk(child, visit);
    return;
  }
  const n = node as Record<string, unknown>;
  if (typeof n.type === "string") visit(n);
  for (const key in n) {
    if (
      key === "loc" ||
      key === "start" ||
      key === "end" ||
      key === "range" ||
      key === "leadingComments" ||
      key === "trailingComments" ||
      key === "innerComments"
    ) {
      continue;
    }
    walk(n[key], visit);
  }
}

export function sourceLocPlugin(): PluginOption {
  let rootDir = process.cwd();

  return {
    name: "vite-plugin-source-loc",
    apply: "serve", // dev server only — never runs during `vite build`
    enforce: "pre", // run before react-router's JSX transform

    configResolved(config) {
      rootDir = config.root;
    },

    transform(code, id) {
      const [filepath] = id.split("?");
      if (filepath.includes("/node_modules/")) return null;
      if (!/\.[jt]sx$/.test(filepath)) return null;

      let ast;
      try {
        ast = parse(code, {
          sourceType: "module",
          plugins: ["jsx", "typescript"],
        });
      } catch {
        // Don't mask real syntax errors — let the downstream transform report.
        return null;
      }

      const ms = new MagicString(code);
      const relPath = path.relative(rootDir, filepath);
      let changed = false;

      walk(ast, (node) => {
        if (node.type !== "JSXOpeningElement") return;
        if (!isHostElement(node.name)) return;
        // Idempotent: skip if the element already carries the attribute.
        const already = node.attributes?.some(
          (attr: any) =>
            attr.type === "JSXAttribute" &&
            attr.name?.type === "JSXIdentifier" &&
            attr.name.name === SOURCE_LOC_ATTR
        );
        if (already) return;

        const start = node.loc?.start; // position of `<`
        const nameEnd = node.name.end; // offset just after the tag name
        if (!start || nameEnd == null) return;

        const value = `${relPath}:${start.line}:${start.column + 1}`;
        ms.appendLeft(nameEnd, ` ${SOURCE_LOC_ATTR}="${value}"`);
        changed = true;
      });

      if (!changed) return null;
      return {
        code: ms.toString(),
        map: ms.generateMap({ hires: true, source: id }),
      };
    },
  };
}

export default sourceLocPlugin;
