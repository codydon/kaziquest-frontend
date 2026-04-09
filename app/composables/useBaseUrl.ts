export const useBaseUrl = () => {
  const config = useRuntimeConfig()
  return config.public.apiBase || ''
}