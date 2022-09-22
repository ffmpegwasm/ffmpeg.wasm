module.exports = {
  extends: "eslint:recommended",
  rules: {
    "@typescript-eslint/no-empty-function": 0,
    "@typescript-eslint/no-unsafe-assignment": 0,
    "@typescript-eslint/restrict-plus-operands": 0,
    "@typescript-eslint/no-unsafe-call": 0,
    "@typescript-eslint/no-unsafe-return": 0,
    "@typescript-eslint/no-unsafe-member-access": 0,
  },
  globals: {
    Module: true,
    console: true,
  },
};
