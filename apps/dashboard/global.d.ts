// Metro (the Expo bundler) statically replaces EXPO_PUBLIC_* env vars at build time.
// This declaration tells TypeScript that `process.env` exists in this project
// without requiring the full @types/node package.
declare const process: { env: Record<string, string | undefined> };
