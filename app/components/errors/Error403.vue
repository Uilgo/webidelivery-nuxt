<script setup lang="ts">
/**
 * 🔒 Error403
 *
 * Página de erro 403 - Acesso negado.
 * Exibida quando o usuário não tem permissão para acessar um recurso.
 */

const router = useRouter();
const user = useSupabaseUser();

/**
 * Verifica se o usuário está autenticado
 */
const isAuthenticated = computed(() => !!user.value);

/**
 * Volta para a página anterior
 */
const handleGoBack = () => {
	router.back();
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
			<!-- Ilustração 403 -->
			<div class="mb-8">
				<!-- Ícone acima do número -->
				<div class="flex justify-center mb-4 py-6">
					<Icon
						name="lucide:shield-alert"
						class="text-blue-500 dark:text-blue-400 animate-pulse"
						style="width: 64px !important; height: 64px !important"
					/>
				</div>

				<!-- Número 403 -->
				<div
					class="font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 leading-none select-none py-4"
					style="font-size: 96px !important"
				>
					403
				</div>
			</div>

			<!-- Mensagem -->
			<h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">Acesso negado</h1>
			<p class="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
				Você não tem permissão para acessar esta página. Entre em contato com o administrador se
				acha que isso é um erro.
			</p>

			<!-- Ações -->
			<div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
				<UiButton size="lg" @click="handleGoBack">
					<template #iconLeft>
						<Icon name="lucide:arrow-left" class="w-5 h-5" />
					</template>
					Voltar
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
