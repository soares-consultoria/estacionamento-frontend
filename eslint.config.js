import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      /**
       * react-hooks/set-state-in-effect: desabilitado.
       *
       * Esta regra foi introduzida no eslint-plugin-react-hooks v5 e marca como erro
       * o padrão `setState` no corpo de um efeito (ex: setLoading(true) no início).
       * É um padrão amplamente usado e documentado no próprio React.dev, e muitas
       * equipes optam por não habilitá-lo. Neste projeto temos dezenas de casos
       * legítimos desse padrão em páginas de dashboard (reset de loading/error ao
       * mudar dependências).
       */
      'react-hooks/set-state-in-effect': 'off',

      /**
       * react-refresh/only-export-components: rebaixado para warning.
       *
       * Contextos React (AuthContext, InstituicaoContext) exportam tanto o Context
       * quanto o hook `useXxx`, o que é o padrão idiomático em React. A regra
       * afeta o HMR do Vite mas não o comportamento em produção.
       */
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
])
