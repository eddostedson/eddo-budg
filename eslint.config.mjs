import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname
})

const config = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'dist/**',
      'coverage/**',
      'eddo-budg/**'
    ]
  },
  // Reprend la configuration officielle Next.js (core web vitals)
  ...compat.extends('next/core-web-vitals'),
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    rules: {
      // Exemple d'override : autoriser les liens Next dans /app
      '@next/next/no-html-link-for-pages': 'off',
      'react/no-unescaped-entities': 'off'
    }
  }
]

export default config


