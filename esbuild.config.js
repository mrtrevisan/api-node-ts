import { build } from "esbuild"
import { createRequire } from "module";

const { dependencies } = createRequire(import.meta.url)("./package.json");

await build({
    entryPoints: ['src/server.ts'],
    platform: 'node',
    format: 'esm',
    target: ['node22'],
    outdir: 'dist',
    bundle: true,
    minify: false,
    sourcemap: true,
    external: Object.keys(dependencies)
})