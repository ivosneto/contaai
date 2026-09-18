// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Nitro defaults to the Cloudflare target (see the wrapper's own comment
  // above); the preset is switched to "vercel" at build time via the
  // NITRO_PRESET env var (set in vercel.json's buildCommand), which nitro
  // itself reads with priority over this defaultPreset — no change needed
  // here for that part. `functions.runtime` below is forced because nitro's
  // vercel preset otherwise auto-detects the runtime from whichever tool ran
  // the build (`"Bun" in globalThis`), which would silently select Vercel's
  // Bun runtime — untested for this app. The code has no Bun-specific API
  // usage (node:crypto, Buffer, fetch only), so pin the well-supported
  // Node.js runtime explicitly instead. The wrapper's `nitro` option type
  // only declares {preset, output, cloudflare} — intentionally narrow per
  // its own doc comment — but forwards the object to nitro verbatim at
  // runtime, and `vercel.functions.runtime` is a real nitro option; the cast
  // below only bypasses the wrapper's incomplete typing, not a real gap.
  nitro: {
    ...({ vercel: { functions: { runtime: "nodejs22.x" } } } as Record<string, unknown>),
  },
});
