<script setup lang="ts">
/**
 * 🚨 Error Page
 *
 * Página principal de erro do Nuxt.
 * Roteia para componentes específicos baseado no código de status HTTP.
 *
 * Códigos suportados:
 * - 404: Página não encontrada
 * - 403: Acesso negado
 * - 500: Erro interno do servidor
 * - Outros: Erro genérico
 */

interface Props {
	error: {
		statusCode: number;
		statusMessage: string;
		message?: string;
	};
}

const props = defineProps<Props>();

/**
 * Determina qual componente de erro exibir baseado no código de status
 */
const errorComponent = computed(() => {
	switch (props.error.statusCode) {
		case 404:
			return resolveComponent("ErrorsError404");
		case 403:
			return resolveComponent("ErrorsError403");
		case 500:
			return resolveComponent("ErrorsError500");
		default:
			return resolveComponent("ErrorsErrorGeneric");
	}
});

/**
 * Props para passar ao componente de erro genérico
 */
const errorProps = computed(() => ({
	statusCode: props.error.statusCode,
	statusMessage: props.error.statusMessage,
	message: props.error.message || "Ocorreu um erro inesperado.",
}));

// Log do erro no console (apenas em desenvolvimento)
if (import.meta.dev) {
	console.error("Error caught by error.vue:", props.error);
}
</script>

<template>
	<NuxtLayout name="minimal">
		<!-- Renderiza componente específico baseado no código de status -->
		<component
			:is="errorComponent"
			v-if="error.statusCode === 404 || error.statusCode === 403 || error.statusCode === 500"
		/>

		<!-- Renderiza componente genérico para outros erros -->
		<ErrorsErrorGeneric v-else v-bind="errorProps" />
	</NuxtLayout>
</template>
