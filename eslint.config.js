import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default defineConfig(
    { ignores: ['dist', 'src/generated'] },
    js.configs.recommended,
    tseslint.configs.recommendedTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    {
        // config files outside tsconfig's "include" (esbuild.config.js, prisma.config.ts, this file)
        files: ['*.js', '*.ts'],
        extends: [tseslint.configs.disableTypeChecked],
    },
    // turns off rules that conflict with Prettier; keep it after the other configs
    prettier,
    {
        // after prettier, which turns curly off; "all" doesn't conflict with Prettier
        rules: {
            curly: ['error', 'all'],
        },
    },
);
