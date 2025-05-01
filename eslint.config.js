// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  // Next.js plugin configuration - replace previous setup
  {
    plugins: {
      '@next/next': nextPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      // Add specific React Hooks rules
      'react-hooks/rules-of-hooks': 'error', // Enforce Rules of Hooks
      'react-hooks/exhaustive-deps': 'warn', // Warn about exhaustive deps
      // You might want to disable specific rules if needed
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  }
);
