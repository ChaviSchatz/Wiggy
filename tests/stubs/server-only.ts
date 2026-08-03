// Test stub for the `server-only` package. In a React Server Component build the
// real module resolves to an empty file; its default export throws when pulled
// into a client bundle. Node-based integration tests have no such bundler, so we
// alias `server-only` to this no-op (see vitest.integration.config.mts).
export {};
