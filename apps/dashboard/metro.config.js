const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

// Metro (the React Native bundler) only watches files under the project root by default.
// In a monorepo, workspace packages like @ody/shared live outside this folder.
// We tell Metro about the workspace root so it can find and bundle those packages.

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

module.exports = config;
