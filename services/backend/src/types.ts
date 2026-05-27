// Shared across index.ts and all route files.
// Workers inject bindings (env vars, secrets) per-request, not at module init.
export type Env = {
  DATABASE_URL: string;
};
