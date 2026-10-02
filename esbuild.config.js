import { build } from "esbuild"
import { createRequire } from "module";

const { dependencies } = createRequire(import.meta.url)("./package.json");

await build({
    // migrate keeps a flat output name: dist/migrate.js
    entryPoints: [
        { in: 'src/main.ts', out: 'main' },
        { in: 'src/database/migrate.ts', out: 'migrate' },
    ],
    platform: 'node',
    format: 'esm',
    target: ['node24'],
    outdir: 'dist',
    bundle: true,
    minify: false,
    sourcemap: true,
    // runtime dependencies stay in node_modules
    external: Object.keys(dependencies)
})
