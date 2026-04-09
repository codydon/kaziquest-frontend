<script setup lang="ts">
import { ROUTE_LIST } from '~/constants/routeList'

const { isAuthenticated, isHydrating } = useAuthSession()

watch(
	() => isHydrating.value,
	async (hydrating) => {
		if (hydrating) {
			return
		}

		if (isAuthenticated.value) {
			await navigateTo(ROUTE_LIST.home, { replace: true })
			return
		}

		await navigateTo(ROUTE_LIST.auth.login, { replace: true })
	},
	{ immediate: true }
)
</script>
