/**
 * Tenant subdomain label from the current page URL (legacy `getSubdomainUtil` behavior).
 */
export function getSubdomainFromHref(href: string): string | null {
  try {
    const urlObject = new URL(href.startsWith('http') ? href : `https://${href}`)
    const hostname = urlObject.hostname
    const parts = hostname.split('.')

    if (parts.length <= 1) {
      return null
    }

    const label = parts[0] === 'www' ? parts[1] : parts[0]

    if (!label || !/^[a-zA-Z0-9-]+$/.test(label)) {
      return null
    }

    return label.toLowerCase()
  } catch {
    return null
  }
}

export function parseExcludedSubdomains(config: string | undefined): string[] {
  if (config == null || config === '') {
    return []
  }

  return config
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
}

/** Hostname after the tenant label, for UI (e.g. `acme.localhost` → `localhost`). */
export function workspaceHostSuffix(hostname: string): string {
  const parts = hostname.split('.')
  if (parts.length <= 1) {
    return hostname === 'localhost' ? 'localhost' : (parts[0] ?? hostname)
  }
  return parts.slice(1).join('.')
}
