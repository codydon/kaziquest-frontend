# Nuxt Dashboard Template

[![Nuxt UI](https://img.shields.io/badge/Made%20with-Nuxt%20UI-00DC82?logo=nuxt&labelColor=020420)](https://ui.nuxt.com)

Get started with the Nuxt dashboard template with multiple pages, collapsible sidebar, keyboard shortcuts, light & dark mode, command palette and more, powered by [Nuxt UI](https://ui.nuxt.com).

- [Live demo](https://dashboard-template.nuxt.dev/)
- [Documentation](https://ui.nuxt.com/docs/getting-started/installation/nuxt)

<a href="https://dashboard-template.nuxt.dev/" target="_blank">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://ui.nuxt.com/assets/templates/nuxt/dashboard-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="https://ui.nuxt.com/assets/templates/nuxt/dashboard-light.png">
    <img alt="Nuxt Dashboard Template" src="https://ui.nuxt.com/assets/templates/nuxt/dashboard-light.png">
  </picture>
</a>

> The dashboard template for Vue is on https://github.com/nuxt-ui-templates/dashboard-vue.

## Quick Start

```bash [Terminal]
npm create nuxt@latest -- -t github:nuxt-ui-templates/dashboard
```

## Deploy your own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-name=dashboard&repository-url=https%3A%2F%2Fgithub.com%2Fnuxt-ui-templates%2Fdashboard&demo-image=https%3A%2F%2Fui.nuxt.com%2Fassets%2Ftemplates%2Fnuxt%2Fdashboard-dark.png&demo-url=https%3A%2F%2Fdashboard-template.nuxt.dev%2F&demo-title=Nuxt%20Dashboard%20Template&demo-description=A%20dashboard%20template%20with%20multi-column%20layout%20for%20building%20sophisticated%20admin%20interfaces.)

## Setup

Make sure to install the dependencies:

```bash
pnpm install
```

## Environment Setup

Create your local environment file from the example:

```bash
cp .env.example .env
```

This project follows Nuxt runtime config naming conventions.

Public runtime variables:
- `NUXT_PUBLIC_SITE_URL`
- `NUXT_PUBLIC_CURRENT_ENVIRONMENT`
- `NUXT_PUBLIC_API_BASE`
- `NUXT_PUBLIC_MAIN_APP_URL`
- `NUXT_PUBLIC_EXCLUDED_SUBDOMAINS`
- `NUXT_PUBLIC_USE_MOCK_PAYMENTS`
- `NUXT_PUBLIC_SENTRY_DSN` (optional)

Server-only runtime variables:
- `NUXT_API_SECRET`

Legacy migration compatibility:
- `BACKEND_URL`, `MAIN_APP_URL`, `EXCLUDED_SUBDOMAINS`, and `SENTRY_DSN` are still accepted as fallbacks during migration.
- Prefer the `NUXT_*` variable names for all new environments and CI pipelines.

## Development Server

Start the development server on `http://localhost:3000`:

```bash
pnpm dev
```

## Production

Build the application for production:

```bash
pnpm build
```

Locally preview production build:

```bash
pnpm preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Renovate integration

Install [Renovate GitHub app](https://github.com/apps/renovate/installations/select_target) on your repository and you are good to go.
