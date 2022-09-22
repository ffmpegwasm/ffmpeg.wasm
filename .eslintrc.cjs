module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: [
      "./tsconfig.eslint.json",
      "./packages/*/tsconfig.json",
      "./packages/*/tsconfig-*.json",
      "./apps/*/tsconfig.json",
    ],
  },
  plugins: ["@typescript-eslint"],
  root: true,
};
