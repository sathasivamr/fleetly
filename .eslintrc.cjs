/* eslint-env node */
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:react-hooks/recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: { react: { version: 'detect' } },
  plugins: ['react', 'react-hooks'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
  },
  ignorePatterns: ['dist', 'lightsail-publish', 'node_modules'],
  overrides: [
    {
      files: ['vite.config.js', 'tailwind.config.js', '.eslintrc.cjs'],
      env: { node: true },
    },
  ],
};
