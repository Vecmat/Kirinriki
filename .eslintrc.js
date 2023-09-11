/**
 *
 */
module.exports = {
    root: true,
    parser: "@typescript-eslint/parser",
    extends: [
        "plugin:jest/recommended",
        "plugin:@typescript-eslint/recommended",
    ],
    plugins: ["jest", "@typescript-eslint"],
    parserOptions: {
        project: "./tsconfig.json",
    },
    env: {
        node: true,
        mongo: true,
        jest: true,
    },
    rules: {
        "semi": ["error", "always"],
        "@typescript-eslint/no-unused-vars":"off",
        
        "@typescript-eslint/no-explicit-any": "off",
        // "@typescript-eslint/no-require-imports": "off",
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/member-ordering": "off",
        "@typescript-eslint/consistent-type-assertions": "off",
        "@typescript-eslint/no-param-reassign": "off",
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-empty-interface": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/ban-types": [
            "error",
            {
                types: {
                    Object: false,
                    Function: false,
                },
                extendDefaults: true,
            },
        ],
    },
};
