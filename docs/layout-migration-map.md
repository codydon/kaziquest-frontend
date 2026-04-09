# Layout Migration Map

This project standardizes on two layouts:

- `default`: authenticated app shell (Nuxt UI dashboard layout)
- `public`: unauthenticated/public shell

## Legacy to target mapping

- `default` -> `default`
- `affiliate-view` -> `default`
- `hrs-layout` -> `default`
- `full-screen` -> `public`
- `public-screen` -> `public`
- `careersite` -> `public`
- `checkout` -> `public` (unless a separate checkout shell is explicitly approved later)

## Migration notes

1. Do not add new legacy layout names in migrated pages.
2. Route-specific visual differences should use route meta and page-level composition, not new layouts.
3. Keep business logic out of layouts. Use composables/stores for data and permissions.
4. Any layout policy violation should fail CI.
