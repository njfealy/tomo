import type { Config } from "jest";

const config: Config = {
  // Other config...
  moduleNameMapper: {
    "^@App/(.*)$": "<rootDir>/src/$1",
  },
  moduleFileExtensions: ["ts", "js", "json"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  verbose: true,
};

export default config;
