# Dev Notes

## React Hooks vs Plain Functions

**TanStack Query hooks (`useQuery`, `useMutation`) only work inside React components.**

Your API client interceptor (the `beforeRequest` / `afterResponse` stuff in ky) is NOT a React component — it's just a plain function. So you can't use any hooks there.

- **Inside components** → use TanStack Query hooks
- **Inside API client interceptors** → use plain `ky` / `fetch` calls directly

That's why token refresh lives in the interceptor using raw `ky.post()` instead of `useMutation`.
