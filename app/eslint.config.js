const { defineConfig } = require("eslint/config");
const expo = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expo,
  { ignores: ["dist/*", ".expo/*", "node_modules/*"] },
  {
    rules: {
      // Screens must not reach into Firebase or fetch directly (see docs/MUSER_UI_CONVENTIONS.md).
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["firebase/*"],
              message: "Use the data/ layer; screens and components never import Firebase.",
            },
          ],
        },
      ],
    },
  },
  {
    // The data layer is the only place allowed to talk to Firebase.
    files: ["src/data/**"],
    rules: { "no-restricted-imports": "off" },
  },
]);
