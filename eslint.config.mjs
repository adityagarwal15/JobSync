import js from "@eslint/js";
import globals from "globals";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import css from "@eslint/css";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // ✅ File/folder ignores
  {
    ignores: ['eslint.config.mjs', 'node_modules', '.env', 'dist', 'build'],
  },

  // ✅ JavaScript config
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.browser,
        ...globals.node,
        gsap: "readonly",
        ScrollTrigger: "readonly",
        SplitType: "readonly",
        $: "readonly",
        Lenis: "readonly",
        pdfjsLib: "readonly",
      },
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': 'warn',
    },
  },

  // ✅ JSON files
  {
    files: ["**/*.json"],
    plugins: { json },
    language: "json/json",
    extends: ["json/recommended"],
  },
  {
    files: ["**/*.jsonc"],
    plugins: { json },
    language: "json/jsonc",
    extends: ["json/recommended"],
  },
  {
    files: ["**/*.json5"],
    plugins: { json },
    language: "json/json5",
    extends: ["json/recommended"],
  },

  // ✅ Markdown files
  {
    files: ["**/*.md"],
    plugins: { markdown },
    language: "markdown/gfm",
    extends: ["markdown/recommended"],
  },

  // ✅ CSS files
  {
  files: ["**/*.css"],
  plugins: { css },
  language: "css/css",
  extends: ["css/recommended"],
  rules: {
    "css/no-invalid-properties": "off", // <—— Disable this check
    "css/no-important": "warn",         // Optional: downgrade !important to warning
    "css/use-baseline": "off",          // Optional: disable unsupported property warning
  },
}
]);
