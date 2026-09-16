import js from "@eslint/js";
import react from "@eslint-react/eslint-plugin";
import query from "@tanstack/eslint-plugin-query";
import router from "@tanstack/eslint-plugin-router";
import prettier from "eslint-config-prettier/flat";
import betterTailwind from "eslint-plugin-better-tailwindcss";
import boundaries from "eslint-plugin-boundaries";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import importX from "eslint-plugin-import-x";
import jsxA11y from "eslint-plugin-jsx-a11y-x";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * Clean Architecture layers live inside every module:
 * presentation -> application -> domain, infrastructure implements the ports.
 * Cross-module imports are only allowed through a module's public API (index.ts).
 */
const boundariesElements = [
  { type: "app", pattern: "src/app/**/*" },
  // Any file inside a module layer, e.g. src/modules/runs/domain/run.ts
  {
    type: "module-layer",
    pattern: "src/modules/*/*",
    capture: ["module", "layer"],
  },
  // The public API of a module: src/modules/runs/index.ts
  { type: "module-api", pattern: "src/modules/*", capture: ["module"] },
  { type: "shared", pattern: "src/shared/**/*" },
];

/** A layer of the module the importing file belongs to. */
const sameModuleLayer = (layer: string) => [
  "module-layer",
  { module: "${from.module}", layer },
];

export default defineConfig(
  { ignores: ["dist", "coverage", "node_modules", "**/*.gen.ts"] },

  // Application sources: type-aware linting, React rules, architecture boundaries.
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      react.configs["recommended-type-checked"],
      reactHooks.configs.flat["recommended-latest"],
      jsxA11y.configs.recommended,
      importX.flatConfigs.recommended,
      importX.flatConfigs.typescript,
      query.configs["flat/recommended"],
      router.configs["flat/recommended"],
    ],
    plugins: {
      "react-refresh": reactRefresh,
      boundaries,
      "better-tailwindcss": betterTailwind,
    },
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      "boundaries/elements": boundariesElements,
      "boundaries/include": ["src/**/*"],
      "import-x/resolver-next": [
        createTypeScriptImportResolver({
          project: ["tsconfig.app.json", "tsconfig.node.json"],
          noWarnOnMultipleProjects: true,
        }),
      ],
      "better-tailwindcss": { entryPoint: "src/app/styles/index.css" },
    },
    rules: {
      "react-refresh/only-export-components": [
        "error",
        { allowConstantExport: true },
      ],

      "no-console": ["error", { allow: ["warn", "error"] }],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "import-x/no-default-export": "error",
      "import-x/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "type",
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],

      // Tailwind class checks; ordering is handled by prettier-plugin-tailwindcss.
      "better-tailwindcss/no-unknown-classes": "error",
      "better-tailwindcss/no-conflicting-classes": "error",
      "better-tailwindcss/no-duplicate-classes": "error",
      "better-tailwindcss/no-deprecated-classes": "error",

      "boundaries/no-unknown-files": "off",
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          message: "${file.type} is not allowed to import ${dependency.type}",
          rules: [
            // The composition root wires modules together through their public APIs.
            { from: ["app"], allow: ["app", "module-api", "shared"] },

            // A module's public API may re-export anything from that same module.
            {
              from: ["module-api"],
              allow: [["module-layer", { module: "${from.module}" }], "shared"],
            },

            // Clean Architecture: dependencies point inwards, towards the domain.
            {
              from: [["module-layer", { layer: "domain" }]],
              allow: [sameModuleLayer("domain"), "shared"],
            },
            {
              from: [["module-layer", { layer: "application" }]],
              allow: [
                sameModuleLayer("application"),
                sameModuleLayer("domain"),
                "shared",
              ],
            },
            {
              from: [["module-layer", { layer: "infrastructure" }]],
              allow: [
                sameModuleLayer("infrastructure"),
                sameModuleLayer("application"),
                sameModuleLayer("domain"),
                "shared",
              ],
            },
            {
              from: [["module-layer", { layer: "presentation" }]],
              allow: [
                sameModuleLayer("presentation"),
                sameModuleLayer("application"),
                sameModuleLayer("domain"),
                "module-api",
                "shared",
              ],
            },

            // shared/ knows nothing about the modules built on top of it.
            { from: ["shared"], allow: ["shared"] },

            // Only the router (in app/) may pull in the admin module, and it does so lazily.
            {
              from: ["module-layer"],
              disallow: [["module-api", { module: "admin" }]],
              message:
                "The admin module is isolated and may only be loaded by the router in app/",
            },
          ],
        },
      ],
    },
  },

  // Tests may import test helpers freely and use non-null assertions.
  {
    files: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "boundaries/element-types": "off",
    },
  },

  // TypeScript tooling configs are covered by tsconfig.node.json, so they stay type-aware.
  {
    files: ["*.config.ts", "eslint.config.ts"],
    extends: [js.configs.recommended, tseslint.configs.strictTypeChecked],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "import-x/no-default-export": "off",
    },
  },

  // Plain JS configs (stylelint, commitlint) are not part of any tsconfig project.
  {
    files: ["*.config.js"],
    extends: [js.configs.recommended, tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
    rules: {
      "import-x/no-default-export": "off",
    },
  },

  prettier,
);
