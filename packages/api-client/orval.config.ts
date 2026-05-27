import { defineConfig } from "orval";

// Orval reads openapi.json (produced by `pnpm export:spec` in the backend)
// and generates typed TypeScript + React Query hooks into src/generated/.
//
// To regenerate: pnpm gen:contract from the repo root.
// Never hand-edit anything in src/generated/ — changes will be overwritten.

export default defineConfig({
  backend: {
    input: "./openapi.json",
    output: {
      // tags-split: generates one file per OpenAPI tag (menu, orders, customers…).
      // Each file exports React Query hooks (useListOrders) and types (Order).
      mode: "tags-split",
      target: "./src/generated",
      schemas: "./src/generated/model",
      client: "react-query",
      clean: true,
      override: {
        // The mutator is a custom axios function that all generated hooks call.
        // It configures the base URL and unwraps AxiosResponse<T> → T.
        mutator: {
          path: "./src/mutator/axiosInstance.ts",
          name: "axiosInstance",
        },
        query: {
          useQuery: true,
          useMutation: true,
        },
      },
    },
  },
});
