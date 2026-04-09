# Auth Migration Execution - PR Description

## Summary
This PR executes the migration/hardening plan for employer auth flow parity in kaziquest-frontend, with targeted improvements in hydration, route guards, direct token compatibility, inactivity handling, logout revocation, and error normalization.

## What Was Implemented

### 1. Session Rehydration Bootstrap
- Added hydration lifecycle to auth session state.
- Added client bootstrap plugin to restore user session from token on app mount.
- Prevented early middleware redirects while hydration is in progress.

Files:
- app/composables/useAuthSession.ts
- app/plugins/auth-session-init.client.ts
- middleware/01.auth.global.ts

### 2. Direct Token Login Compatibility
- Implemented legacy tokenized login path for URLs carrying query `t` and `u`.
- Added secure URL cleanup after successful token login.

Files:
- app/pages/auth/login.vue

### 3. Inactivity Timeout Enforcement
- Added lightweight inactivity timeout plugin with activity reset and auto-logout behavior.

Files:
- app/plugins/inactivity-timeout.client.ts

### 4. OTP Backward Compatibility and UX Hardening
- Added route alias for legacy `/auth/OTP-verification` path.
- Improved OTP timer/resend behavior and disabled verify while expired.

Files:
- app/pages/auth/otp-verification.vue

### 5. Middleware Hydration Hardening
- Added hydration guard checks to role, subscription, and authorize middleware.
- Made redirect returns explicit where required.

Files:
- middleware/02.adminAndManager.global.ts
- middleware/subscription.global.ts
- middleware/authorize.ts

### 6. Logout Revocation (Best Effort)
- Added best-effort refresh token revocation API call in logout flow.
- Updated unauthorized handling to use revocation-aware logout path.

Files:
- app/composables/useAuthSession.ts
- app/composables/useApi.ts
- app/stores/auth.ts

### 7. Error Parsing Standardization
- Added a shared API error parser utility.
- Reused parser across login/register/otp flows.

Files:
- app/utils/parseApiError.ts
- app/pages/auth/login.vue
- app/pages/auth/register.vue
- app/pages/auth/otp-verification.vue

### 8. Refresh Lifecycle Instrumentation
- Added refresh metrics state for attempts/success/failure/retry counts.

Files:
- app/composables/useApi.ts
- app/composables/useAuthRefreshMetrics.ts

### 9. Landing Route Behavior
- Replaced unconditional index redirect with hydration-aware auth routing.

Files:
- app/pages/index.vue

### 10. Auth Service Consolidation Guard
- Added top-level service re-export to align call sites to app service implementation.

Files:
- services/auth.service.ts

## Validation
- Typecheck executed successfully:
  - `pnpm typecheck`

## Artifact
- Consolidated patch file:
  - docs/AUTH_MIGRATION_PATCH.diff

## Notes
- Patch artifact is scoped to the auth migration implementation files listed above.
- If any file had pre-existing local modifications before this execution, those may appear in the file-level diff context.
