import { build } from 'esbuild';
import { createRequire } from 'module';

const { dependencies } = createRequire(import.meta.url)('./package.json');

await build({
    entryPoints: ['src/main.ts'],
    platform: 'node',
    format: 'esm',
    target: ['node24'],
    outdir: 'dist',
    bundle: true,
    minify: false,
    sourcemap: true,
    // runtime dependencies stay in node_modules
    external: Object.keys(dependencies),
});
