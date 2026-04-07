/** @type {import('jest').Config} */
module.exports = {
  displayName: "@narralang/core",
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/test"],
  testMatch: [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/*.(test|spec).+(ts|tsx|js)",
  ],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.test.json",
      },
    ],
  },
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
  testTimeout: 10000,
  moduleNameMapper: {
    "^@narralang/core$": "<rootDir>/src/index.ts",
    "^@narralang/share$": "<rootDir>/../share/src/index.ts",
    "^@/core/(.*)$": "<rootDir>/src/$1",
  },
};
