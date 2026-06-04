/**
 * Verification for vite-plugin-source-loc (U1 build-output assertion).
 *
 * Asserts two invariants the inline-editing feature depends on:
 *   1. data-source-loc attributes ARE stamped onto host JSX elements when the
 *      dev-server (serve) pipeline transforms a route — and survive the
 *      React Router v7 JSX transform (the plugin runs enforce:'pre').
 *   2. The plugin is NOT in the production (build) plugin pipeline, so the
 *      attribute can never leak into published/exported sites.
 *
 * Run: npm run verify:source-loc   (or: npx tsx scripts/verify-source-loc.mts)
 * Exits non-zero on any failed assertion.
 */
import { createServer, resolveConfig } from "vite";
import { SOURCE_LOC_ATTR } from "../vite-plugin-source-loc.ts";

const PLUGIN = "vite-plugin-source-loc";
const ROUTE = "/app/routes/_index.tsx";
const configFile = new URL("../vite.config.ts", import.meta.url).pathname;

let failed = false;
function assert(cond: boolean, msg: string) {
  console.log(`  ${cond ? "✓" : "✗ FAIL:"} ${msg}`);
  if (!cond) failed = true;
}

// --- 1. serve pipeline stamps, and the stamp survives the RR v7 transform ---
console.log("\nserve (dev preview) — stamping survives the React Router transform:");
const server = await createServer({ configFile, logLevel: "silent" });
try {
  const result = await server.transformRequest(ROUTE);
  assert(!!result, "route transforms");
  const code = result?.code ?? "";
  const occurrences = [...code.matchAll(new RegExp(SOURCE_LOC_ATTR, "g"))].length;
  assert(code.includes(SOURCE_LOC_ATTR), `compiled output contains ${SOURCE_LOC_ATTR}`);
  assert(occurrences >= 2, `multiple elements stamped (found ${occurrences})`);
  // Distinct source positions => duplicate identical text gets distinct locs.
  assert(/_index\.tsx:45:/.test(code), "h1 carries its real source line (45)");
  assert(/_index\.tsx:48:/.test(code), "p carries its real source line (48)");
} finally {
  await server.close();
}

// --- 2. build pipeline excludes the plugin (leak guard) ---
console.log("\nbuild (published/export) — stamp is excluded:");
const build = await resolveConfig({ configFile, logLevel: "silent" }, "build");
const serveCfg = await resolveConfig({ configFile, logLevel: "silent" }, "serve");
assert(serveCfg.plugins.some((p) => p.name === PLUGIN), `${PLUGIN} active in serve`);
assert(!build.plugins.some((p) => p.name === PLUGIN), `${PLUGIN} absent in build`);

console.log(failed ? "\nVERIFY: ✗ failed\n" : "\nVERIFY: ✓ all invariants hold\n");
process.exit(failed ? 1 : 0);
