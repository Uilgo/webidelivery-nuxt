<script setup lang="ts">
/**
 * ⚠️ Error500
 *
 * Página de erro 500 - Erro interno do servidor.
 * Exibida quando ocorre um erro inesperado no servidor.
 */

const user = useSupabaseUser();

/**
 * Verifica se o usuário está autenticado
 */
const isAuthenticated = computed(() => !!user.value);

/**
 * Recarrega a página
 */
const handleReload = () => {
	window.location.reload();
};

/**
 * Redireciona para a página inicial baseado no estado de autenticação
 */
const handleGoHome = () => {
	if (isAuthenticated.value) {
		navigateTo("/admin/dashboard");
	} else {
		navigateTo("/login");
	}
};
</script>

<template>
	<div
		class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4"
	>
		<div class="max-w-2xl w-full text-center">
			<!-- Ilustração 500 -->
			<div class="mb-8">
				<!-- Ícone acima do número -->
				<div class="flex justify-center mb-4 py-6">
					<Icon
						name="lucide:server-crash"
						class="text-blue-500 dark:text-blue-400 animate-pulse"
						style="width: 64px !important; height: 64px !important"
					/>
				</div>

				<!-- Número 500 -->
				<div
					class="font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 leading-none select-none py-4"
					style="font-size: 96px !important"
				>
					500
				</div>
			</div>

			<!-- Mensagem -->
			<h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
				Erro interno do servidor
			</h1>
			<p class="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
				Algo deu errado no nosso servidor. Nossa equipe já foi notificada e está trabalhando para
				resolver o problema.
			</p>

			<!-- Ações -->
			<div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
				<UiButton size="lg" @click="handleReload">
					<template #iconLeft>
						<Icon name="lucide:refresh-cw" class="w-5 h-5" />
					</template>
					Tentar Novamente
				</UiButton>

				<UiButton variant="outline" size="lg" @click="handleGoHome">
					<template #iconLeft>
						<Icon name="lucide:home" class="w-5 h-5" />
					</template>
					Ir para Início
				</UiButton>
			</div>
		</div>
	</div>
</template>
