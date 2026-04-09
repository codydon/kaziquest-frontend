export const useBreadCrumbsStore = () => {
  const { links, setLinks, pushLink, clearLinks } = useBreadcrumbsState()

  return {
    links,
    setLinks,
    pushLink,
    clearLinks
  }
}
