
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config({
  files: ['**/*.ts'],
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      project: './tsconfig.json',
      tsconfigRootDir: import.meta.dirname,
      sourceType: 'module',
    },
    globals: {
      ...globals.node,
      ...globals.jest,
    },
  },
  plugins: {
    '@typescript-eslint': tseslint.plugin,
    '@typescript-eslint': tseslint.plugin,
  },
  extends: [
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    prettier,
  ],
  rules: {
    'no-console': 'warn',
    eqeqeq: ['error', 'always'],
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    
    'no-restricted-imports': ['error', {
      patterns: ['.*', '../*', './*']
    }],

    'padding-line-between-statements': [
      'error',
      { blankLine: 'always', prev: 'import', next: '*' },
      { blankLine: 'never', prev: 'import', next: 'import' }
    ],
  },
});