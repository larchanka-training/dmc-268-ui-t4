/** @type {import('stylelint').Config} */
export default {
  extends: [
    "stylelint-config-standard",
    "@dreamsicle.io/stylelint-config-tailwindcss",
    "stylelint-config-recess-order",
  ],
  rules: {
    // Class names come from Tailwind, so no BEM-style pattern is enforced.
    "selector-class-pattern": null,
  },
  ignoreFiles: ["dist/**/*", "coverage/**/*", "node_modules/**/*"],
};
