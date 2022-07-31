module.exports = {
    env: {
        browser: true
    },
    extends: [
        "plugin:react/recommended"
    ],
    settings: {
        react: {
            "version": "detect" // Autodetect React version
        }
    },
    rules: {
        "react/jsx-indent": 1,
        "react/jsx-indent-props": [ 1, "first" ],
        "react/no-unescaped-entities": 0,
        "react/prop-types": 0,
        "react/react-in-jsx-scope": 0,
    }
};
