import nodeConfig from "@repo/eslint-config/node";

const config = nodeConfig("./tsconfig.json", import.meta.dirname);

// Customize rules for game-serializer
export default [
  ...config,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // Disable some strict rules for serialization
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off"
    }
  }
];