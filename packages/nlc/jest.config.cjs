/** @type {import('jest').Config} */
module.exports = {
  displayName: "@narralang/nlc",
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/test"],
  testMatch: ["**/*.(test|spec).ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      { tsconfig: "<rootDir>/tsconfig.test.json" },
    ],
  },
  moduleNameMapper: {
    "^@narralang/core$": "<rootDir>/../core/src/index.ts",
    "^@/core/(.*)$": "<rootDir>/../core/src/$1",
  },
};
