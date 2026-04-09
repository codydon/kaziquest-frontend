import type { BreadcrumbLink } from '~/types'

const BREADCRUMBS_STATE_KEY = 'kq-breadcrumbs-state'

function createDefaultBreadcrumbsState(): BreadcrumbLink[] {
  return []
}

export const useBreadcrumbsState = () => {
  const links = useState<BreadcrumbLink[]>(BREADCRUMBS_STATE_KEY, createDefaultBreadcrumbsState)

  const setLinks = (nextLinks: BreadcrumbLink[]) => {
    links.value = nextLinks
  }

  const pushLink = (link: BreadcrumbLink) => {
    links.value = [...links.value, link]
  }

  const clearLinks = () => {
    links.value = []
  }

  return {
    links: readonly(links),
    setLinks,
    pushLink,
    clearLinks
  }
}