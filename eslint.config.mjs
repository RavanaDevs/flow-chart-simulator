import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["lib/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "react",
                "react-dom",
                "react/*",
                "next",
                "next/*",
                "@xyflow/*",
                "@base-ui/*",
                "zustand",
                "zustand/*",
                "@/components/*",
                "@/hooks/*",
                "@/stores/*",
              ],
              message:
                "lib/ must stay pure TypeScript — no React, no DOM, no canvas.",
            },
          ],
        },
      ],
      "no-restricted-globals": [
        "error",
        "window",
        "document",
        "localStorage",
        "sessionStorage",
        "navigator",
        "alert",
      ],
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "no-eval": "error",
      "no-new-func": "error",
      "no-implied-eval": "error",
    },
  },
]);

export default eslintConfig;
