module.exports = {
  env: {
    browser: true,
    es2020: true,
  },
  extends: [],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 11,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  rules: {
    "prefer-arrow-callback": "warn",
    semi: ["warn", "never"],
  },
}
