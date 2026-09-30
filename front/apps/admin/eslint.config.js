import js from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import tseslint from "typescript-eslint"
import { defineConfig, globalIgnores } from "eslint/config"

export default defineConfig([
  globalIgnores([
    "dist",
    "src/modules/shared/ui/components/**",
    "src/modules/shared/ui/hooks/**",
    "src/modules/shared/ui/lib/**",
    "src/modules/shared/core/ports/**",
  ]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs["recommended-latest"],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
  },
  {
    files: [
      "src/app/routes.tsx",
      "src/modules/shared/ui/context/dependencies.context.tsx",
    ],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
])
