import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
      "@typescript-eslint/no-unused-expressions": [
        "error",
        {
          allowShortCircuit: true,
          allowTernary: true,
          allowTaggedTemplates: true,
        },
      ],
      "@typescript-eslint/no-empty-function": [
        "error",
        {
          allow: ["arrowFunctions", "functions", "methods"],
        },
      ],
    },
  },

  {
    ignores: ["dist/**", "node_modules/**", ".next/**", "build/**", "coverage/**"],
  },
];

export const configWithTypeChecking = (tsconfigPath, tsconfigRootDir) => [
  ...config,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: tsconfigPath,
        tsconfigRootDir: tsconfigRootDir,
      },
    },

  },
  {
    // Exclude config files from type checking
    files: ["**/*.config.{js,ts,mjs,cjs}", "**/vite.config.*", "**/vitest.config.*", "**/drizzle.config.*"],
    ...tseslint.configs.disableTypeChecked,
  },
];
