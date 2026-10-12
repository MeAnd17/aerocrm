module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: ['plugin:@typescript-eslint/recommended'],
  env: { node: true, jest: true },
  ignorePatterns: ['.eslintrc.js', 'dist', 'node_modules', 'prisma/*.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    // Bajadas a advertencia por código heredado (TS-002). El código nuevo no debe sumar advertencias.
    '@typescript-eslint/no-explicit-any': 'warn', // 12 casos heredados
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // 2 casos heredados
  },
};
