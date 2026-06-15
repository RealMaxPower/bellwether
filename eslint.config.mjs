import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  { ignores: [".next/**", "node_modules/**", "archive/**"] },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // New rules introduced by Next 16's stricter lint preset that flag
      // patterns the codebase already relies on. Revisit in a follow-up.
      "react-hooks/set-state-in-effect": "off",
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];

export default config;
