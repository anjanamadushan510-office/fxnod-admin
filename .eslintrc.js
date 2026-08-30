/**
 * ESLint config for the FXNod frontend.
 *
 * The repo has carried `eslint`, `eslint-config-next` and a `lint` script from
 * the start but no config, so `next lint` dropped into its interactive setup
 * prompt and linting has never actually run once.
 *
 * Introduced as WARNINGS, not errors, on purpose. Making a first lint pass a
 * build gate would fail CI on a large amount of pre-existing code across the
 * whole team's work; the useful outcome is a list to work through, not a red
 * pipeline nobody can merge past. Promote a rule to "error" once its existing
 * violations are cleared.
 *
 * Written as .js rather than .json so these notes can live beside the rules —
 * ESLint rejects comment keys in JSON.
 */
module.exports = {
  // core-web-vitals over the plain config: its extra rules catch real problems
  // (unoptimised images, sync scripts, missing keys) rather than style.
  extends: ["next/core-web-vitals"],

  ignorePatterns: [
    "node_modules/",
    ".next/",
    "out/",
    "next-env.d.ts",

    // The generated API client is excluded rather than linted: `npm run gen:api`
    // rewrites it, so any fix applied here is reverted on the next run.
    "src/services/api/endpoints/",
    "src/services/api/model/",

    // Scratch file from earlier debugging; not part of any build.
    "test_proposal.js",
  ],

  rules: {
    "react-hooks/exhaustive-deps": "warn",
    "react/jsx-key": "warn",
    "react/no-unescaped-entities": "warn",

    "@next/next/no-img-element": "warn",
    "@next/next/no-html-link-for-pages": "warn",

    // TypeScript already reports genuinely unused values, and the base rule
    // misfires on type-only imports.
    "no-unused-vars": "off",

    "prefer-const": "warn",
    "no-var": "warn",

    // Loose equality hides null/undefined confusion. "smart" still allows the
    // deliberate `== null` idiom.
    eqeqeq: ["warn", "smart"],

    // This is a trading UI. A console.log left in a component ships to the
    // browser and can put order details or account identifiers somewhere the
    // user's other tabs and extensions can read. warn now; error once the
    // existing ones are cleared.
    "no-console": ["warn", { allow: ["warn", "error"] }],
  },
};
