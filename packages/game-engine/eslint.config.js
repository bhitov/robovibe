import nodeConfig from "@repo/eslint-config/node";

const config = nodeConfig("./tsconfig.json", import.meta.dirname);

// Customize rules for game-engine
export default [
  ...config,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // Allow console for game debugging
      "no-console": ["warn", { allow: ["warn", "error"] }],
      
      // Game engine uses many non-null assertions for performance
      "@typescript-eslint/no-non-null-assertion": "off",
      
      // Allow any for dynamic game progress tracking
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      
      // Relax strict function return types
      "@typescript-eslint/explicit-function-return-type": "off",
      
      // Allow template literals with numbers
      "@typescript-eslint/restrict-template-expressions": "off",
      
      // Allow || for backwards compatibility  
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      
      // Allow unused vars with underscore prefix
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_"
      }],
      
      // Disable some strict rules
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-confusing-non-null-assertion": "off",
      "@typescript-eslint/prefer-optional-chain": "off",
      "@typescript-eslint/restrict-plus-operands": "off"
    }
  }
];