module.exports = {
    env: {
        browser: true,
        es2021: true,
    },
    extends: [
        ".eslintrc-auto-import.json",
        "plugin:vue/vue3-recommended",
        "plugin:import/recommended",
        "plugin:promise/recommended",
        "plugin:prettier/recommended", // Asegúrate de que Prettier esté al final
    ],
    parser: "vue-eslint-parser",
    parserOptions: {
        ecmaVersion: 13,
        sourceType: "module",
        parser: "@typescript-eslint/parser",
    },
    plugins: ["vue", "prettier", "@typescript-eslint"],
    ignorePatterns: ["src/@iconify/*.js", "dist/**", "node_modules/**", "src/iconify.js"],
    rules: {
        "prettier/prettier": "error", // Esto permite que ESLint use Prettier para formatear
        "vue/multi-word-component-names": 0,
        "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
        "no-undef": "error",
        "no-irregular-whitespace": "off",
        "prefer-const": "warn",
        "no-self-assign": "warn",
        semi: ["error", "always"],
        "no-multiple-empty-lines": ["error", { max: 1 }],
        camelcase: ["error", { properties: "always" }],
        quotes: ["error", "double", { avoidEscape: true, allowTemplateLiterals: true }],
        "promise/catch-or-return": "off",
        "promise/always-return": "off",
        "vue/no-v-text-v-html-on-component": "off",
        "vue/no-v-html": "off",
        "vue/max-attributes-per-line": "off",
        "vue/first-attribute-linebreak": "off",
        "vue/html-indent": "off",
        "vue/html-closing-bracket-newline": "off",
        "vue/singleline-html-element-content-newline": "off",
        "vue/html-self-closing": "off",
        "max-len": ["error", { code: 400 }],
        "vue/no-unused-components": "warn",
        // Deshabilitar errores falsos positivos para defineProps y defineEmits en Vue 3 script setup
        "vue/valid-define-props": "off",
        "vue/valid-define-emits": "off",
        "vue/valid-define-options": "off",
        // Ignorar error de import para archivos con ?raw suffix (Vite)
        "import/no-unresolved": "off",
    },
    settings: {
        "import/resolver": {
            node: {
                extensions: [".ts", ".js", ".tsx", ".jsx", ".mjs", ".md"],
            },
            alias: {
                extensions: [".ts", ".js", ".tsx", ".jsx", ".mjs", ".md"],
                map: [
                    ["@", "./src"],
                    ["@themeConfig", "./themeConfig.js"],
                    ["@core", "./src/@core"],
                    ["@layouts", "./src/@layouts"],
                    ["@configured-variables", "./src/styles/variables/_template.scss"],
                    ["@axios", "./src/plugins/axios"],
                    ["@validators", "./src/@core/utils/validators"],
                    ["apexcharts", "node_modules/apexcharts-clevision"],
                ],
            },
        },
    },
};
