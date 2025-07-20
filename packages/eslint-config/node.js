import { configWithTypeChecking } from "./base.js";
import globals from "globals";

/**
 * ESLint configuration for Node.js/backend applications with TypeScript type checking.
 *
 * @param {string} tsconfigPath - Path to tsconfig.json
 * @param {string} tsconfigRootDir - Root directory for tsconfig
 * @type {function(string, string): import("eslint").Linter.Config[]}
 */
export default (tsconfigPath = "./tsconfig.json", tsconfigRootDir = import.meta.dirname) => [
  ...configWithTypeChecking(tsconfigPath, tsconfigRootDir),
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
    },
    rules: {
      // Node.js specific rules
      "no-console": "warn",
      "no-process-exit": "error",
      
      // Enhanced TypeScript rules for backend
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/no-unused-vars": "error",
    },
  },
];
