<script setup lang="ts">
/**
 * 📌 Página de Confirmação/Callback do Supabase
 *
 * Esta página processa callbacks do Supabase para:
 * - Reset de senha (quando usuário clica no link do email de recuperação)
 * - Confirmação de email (se habilitado no projeto)
 * - OAuth providers (se implementado futuramente)
 * - Outros callbacks de autenticação
 *
 * IMPORTANTE: Esta página é essencial para o fluxo de recuperação de senha!
 */

// Meta da página
useHead({
	title: "Confirmando autenticação - WebiDelivery",
	meta: [
		{ name: "description", content: "Processando sua autenticação..." },
		{ name: "robots", content: "noindex, nofollow" },
	],
});

// Composables do Supabase
const user = useSupabaseUser();
const redirectInfo = useSupabaseCookieRedirect();

// Estados reativos
const isLoading = ref(true);
const isSuccess = ref(false);
const isRedirecting = ref(false);
const error = ref<string | null>(null);

// Mensagens dinâmicas
const pageTitle = computed(() => {
	if (isLoading.value) return "Confirmando...";
	if (isSuccess.value) return "Sucesso!";
	if (error.value) return "Erro";
	return "Autenticação";
});

const loadingMessage = computed(() => {
	// Verificar se é reset de senha baseado na URL
	const route = useRoute();
	if (route.query.type === "recovery") {
		return "Processando reset de senha...";
	}
	return "Processando confirmação...";
});

// Função para processar o callback
const processCallback = async (): Promise<void> => {
	try {
		isLoading.value = true;
		error.value = null;

		// Aguardar um momento para garantir que o Supabase processou o callback
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Verificar se há um usuário autenticado
		if (user.value) {
			isSuccess.value = true;
			isLoading.value = false;

			// Aguardar um momento antes de redirecionar
			await new Promise((resolve) => setTimeout(resolve, 1500));

			// Redirecionar usando o cookie de redirecionamento ou padrão
			await handleRedirect();
		} else {
			// Se não há usuário, pode ser que ainda esteja processando
			// Aguardar mais um pouco
			await new Promise((resolve) => setTimeout(resolve, 2000));

			if (!user.value) {
				throw new Error("Não foi possível confirmar a autenticação. Tente fazer login novamente.");
			}
		}
	} catch (err) {
		console.error("Erro no callback de autenticação:", err);
		isLoading.value = false;
		error.value = err instanceof Error ? err.message : "Erro desconhecido na autenticação";
	}
};

// Função para redirecionar após sucesso
const handleRedirect = async (): Promise<void> => {
	try {
		isRedirecting.value = true;

		// Tentar pegar o path do cookie de redirecionamento
		const redirectPath = redirectInfo.pluck();

		// Definir rota padrão baseada no tipo de usuário/contexto
		const defaultPath = "/admin/dashboard";

		// Redirecionar para o path salvo ou padrão
		await navigateTo(redirectPath || defaultPath, { replace: true });
	} catch (err) {
		console.error("Erro no redirecionamento:", err);
		// Fallback: redirecionar manualmente
		window.location.href = "/admin/dashboard";
	}
};

// Função para redirecionamento manual
const handleManualRedirect = async (): Promise<void> => {
	await handleRedirect();
};

// Função para tentar novamente
const handleRetry = (): void => {
	// Recarregar a página para tentar processar o callback novamente
	window.location.reload();
};

// Função para voltar ao login
const handleBackToLogin = async (): Promise<void> => {
	await navigateTo("/login", { replace: true });
};

// Watcher para monitorar mudanças no usuário
watch(
	user,
	async (newUser) => {
		if (newUser && isLoading.value) {
			// Usuário foi autenticado durante o loading
			isSuccess.value = true;
			isLoading.value = false;

			// Aguardar um momento antes de redirecionar
			await new Promise((resolve) => setTimeout(resolve, 1500));
			await handleRedirect();
		}
	},
	{ immediate: true },
);

// Lifecycle hooks
onMounted(async () => {
	// Processar o callback quando a página carregar
	await processCallback();
});

// Cleanup: garantir que não há timers pendentes
onUnmounted(() => {
	isRedirecting.value = false;
});
</script>

<template>
	<div class="min-h-screen bg-[var(--bg-page)] flex items-center justify-center p-4">
		<UiCard class="w-full max-w-md">
			<template #header>
				<div class="text-center">
					<h1 class="text-2xl font-bold text-[var(--text-primary)]">
						{{ pageTitle }}
					</h1>
				</div>
			</template>

			<div class="text-center space-y-6">
				<!-- Loading State -->
				<div v-if="isLoading" class="space-y-4">
					<div class="flex justify-center">
						<Icon name="lucide:loader-2" class="w-8 h-8 animate-spin text-[var(--primary)]" />
					</div>
					<p class="text-[var(--text-secondary)]">
						{{ loadingMessage }}
					</p>
				</div>

				<!-- Success State -->
				<div v-else-if="isSuccess" class="space-y-4">
					<div class="flex justify-center">
						<div
							class="w-16 h-16 bg-[var(--success-light)] rounded-full flex items-center justify-center"
						>
							<Icon name="lucide:check" class="w-8 h-8 text-[var(--success)]" />
						</div>
					</div>
					<div class="space-y-2">
						<p class="text-[var(--text-primary)] font-medium">
							Autenticação realizada com sucesso!
						</p>
						<p class="text-[var(--text-secondary)] text-sm">
							Você será redirecionado automaticamente...
						</p>
					</div>
				</div>

				<!-- Error State -->
				<div v-else-if="error" class="space-y-4">
					<div class="flex justify-center">
						<div
							class="w-16 h-16 bg-[var(--error-light)] rounded-full flex items-center justify-center"
						>
							<Icon name="lucide:x" class="w-8 h-8 text-[var(--error)]" />
						</div>
					</div>
					<div class="space-y-2">
						<p class="text-[var(--error)] font-medium">Erro na autenticação</p>
						<p class="text-[var(--text-secondary)] text-sm">
							{{ error }}
						</p>
					</div>
				</div>
			</div>

			<!-- Footer com ações -->
			<template #footer>
				<div class="flex flex-col gap-3">
					<!-- Botão de redirecionamento manual (se necessário) -->
					<UiButton
						v-if="isSuccess && !isRedirecting"
						variant="solid"
						color="primary"
						full-width
						@click="handleManualRedirect"
					>
						Continuar para o painel
					</UiButton>

					<!-- Botão para tentar novamente em caso de erro -->
					<UiButton v-if="error" variant="outline" color="primary" full-width @click="handleRetry">
						Tentar novamente
					</UiButton>

					<!-- Link para voltar ao login -->
					<UiButton
						v-if="error"
						variant="ghost"
						color="neutral"
						full-width
						@click="handleBackToLogin"
					>
						Voltar ao login
					</UiButton>
				</div>
			</template>
		</UiCard>
	</div>
</template>

<style scoped>
/* Animação suave para os ícones */
.animate-spin {
	animation: spin 1s linear infinite;
}

@keyframes spin {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}
</style>
