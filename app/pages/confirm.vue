<script setup lang="ts">
/**
 * 📌 /confirm
 *
 * Página de callback para confirmação de autenticação.
 * Processa tokens de confirmação de email, redefinição de senha, etc.
 * Redireciona automaticamente após autenticação bem-sucedida.
 */

// Composables do Supabase
const user = useSupabaseUser();
const redirectInfo = useSupabaseCookieRedirect();

// Estados reativos
const isLoading = ref(true);
const isSuccess = ref(false);
const isError = ref(false);
const errorMessage = ref("");
const redirectPath = ref("/admin/dashboard");

// Meta tags para SEO
useSeoMeta({
	title: "Confirmando acesso - WebiDelivery",
	description: "Processando sua autenticação...",
	robots: "noindex, nofollow", // Não indexar página de callback
});

// Definir layout
definePageMeta({
	layout: "auth",
});

// Watcher para monitorar mudanças no usuário
watch(
	user,
	(newUser) => {
		if (newUser) {
			// Usuário autenticado com sucesso
			isLoading.value = false;
			isSuccess.value = true;
			isError.value = false;

			// Obter caminho de redirecionamento do cookie (se existir)
			const savedPath = redirectInfo.pluck(); // Pega e limpa o cookie
			redirectPath.value = savedPath || "/admin/dashboard";

			// Redirecionar após 2 segundos para mostrar feedback visual
			setTimeout(() => {
				navigateTo(redirectPath.value);
			}, 2000);
		}
	},
	{ immediate: true },
);

// Timeout para casos onde a autenticação falha
onMounted(() => {
	// Se após 10 segundos não houver usuário, considerar erro
	setTimeout(() => {
		if (!user.value && isLoading.value) {
			isLoading.value = false;
			isError.value = true;
			errorMessage.value =
				"Não foi possível confirmar sua autenticação. Tente fazer login novamente.";
		}
	}, 10000);
});

// Função para tentar novamente
const tryAgain = () => {
	navigateTo("/login");
};
</script>

<template>
	<div class="space-y-6">
		<!-- Estado de Carregamento -->
		<div v-if="isLoading" class="text-center space-y-6">
			<!-- Ícone animado -->
			<div class="flex justify-center">
				<div class="relative">
					<div
						class="w-16 h-16 border-4 border-[var(--primary-light)] border-t-[var(--primary)] rounded-full animate-spin"
					></div>
					<div class="absolute inset-0 flex items-center justify-center">
						<Icon name="lucide:shield-check" class="w-6 h-6 text-[var(--primary)]" />
					</div>
				</div>
			</div>

			<!-- Texto de carregamento -->
			<div class="space-y-2">
				<h2 class="text-xl font-semibold text-[var(--text-primary)]">Confirmando seu acesso...</h2>
				<p class="text-[var(--text-secondary)] text-sm">
					Aguarde enquanto processamos sua autenticação
				</p>
			</div>

			<!-- Skeleton para simular conteúdo carregando -->
			<div class="space-y-3">
				<UiSkeleton class="h-4 w-3/4 mx-auto" />
				<UiSkeleton class="h-4 w-1/2 mx-auto" />
			</div>
		</div>

		<!-- Estado de Sucesso -->
		<div v-else-if="isSuccess" class="text-center space-y-6">
			<!-- Ícone de sucesso -->
			<div class="flex justify-center">
				<div
					class="w-16 h-16 bg-[var(--success-light)] rounded-full flex items-center justify-center"
				>
					<Icon name="lucide:check-circle" class="w-8 h-8 text-[var(--success)]" />
				</div>
			</div>

			<!-- Mensagem de sucesso -->
			<div class="space-y-2">
				<h2 class="text-xl font-semibold text-[var(--text-primary)]">Acesso confirmado!</h2>
				<p class="text-[var(--text-secondary)] text-sm">Você será redirecionado em instantes...</p>
			</div>

			<!-- Card com informações do redirecionamento -->
			<UiCard class="p-4 bg-[var(--success-light)] border-[var(--success)]">
				<div class="flex items-center justify-center space-x-2 text-[var(--success)]">
					<Icon name="lucide:arrow-right" class="w-4 h-4" />
					<span class="text-sm font-medium"> Redirecionando para {{ redirectPath }} </span>
				</div>
			</UiCard>

			<!-- Barra de progresso animada -->
			<div class="w-full bg-[var(--border-muted)] rounded-full h-2">
				<div
					class="bg-[var(--success)] h-2 rounded-full animate-pulse"
					style="width: 100%; animation: progress 2s ease-in-out"
				></div>
			</div>
		</div>

		<!-- Estado de Erro -->
		<div v-else-if="isError" class="text-center space-y-6">
			<!-- Ícone de erro -->
			<div class="flex justify-center">
				<div
					class="w-16 h-16 bg-[var(--error-light)] rounded-full flex items-center justify-center"
				>
					<Icon name="lucide:alert-circle" class="w-8 h-8 text-[var(--error)]" />
				</div>
			</div>

			<!-- Mensagem de erro -->
			<div class="space-y-2">
				<h2 class="text-xl font-semibold text-[var(--text-primary)]">Erro na confirmação</h2>
				<p class="text-[var(--text-secondary)] text-sm">
					{{ errorMessage }}
				</p>
			</div>

			<!-- Card com detalhes do erro -->
			<UiCard class="p-4 bg-[var(--error-light)] border-[var(--error)]">
				<div class="space-y-3">
					<div class="flex items-center justify-center space-x-2 text-[var(--error)]">
						<Icon name="lucide:info" class="w-4 h-4" />
						<span class="text-sm font-medium">O que fazer agora?</span>
					</div>
					<ul class="text-xs text-[var(--error)] space-y-1">
						<li>• Verifique se o link não expirou</li>
						<li>• Tente fazer login novamente</li>
						<li>• Solicite um novo link de confirmação</li>
					</ul>
				</div>
			</UiCard>

			<!-- Botão para tentar novamente -->
			<div class="pt-2">
				<UiButton variant="solid" color="primary" size="lg" @click="tryAgain">
					<template #iconLeft>
						<Icon name="lucide:refresh-cw" class="w-5 h-5" />
					</template>
					Tentar novamente
				</UiButton>
			</div>
		</div>

		<!-- Footer com informações adicionais -->
		<div class="text-center pt-6 border-t border-[var(--border-muted)]">
			<p class="text-xs text-[var(--text-muted)]">
				Problemas com o acesso?
				<NuxtLink
					to="/forgot-password"
					class="text-[var(--primary)] hover:text-[var(--primary-hover)] ml-1"
				>
					Recuperar senha
				</NuxtLink>
			</p>
		</div>
	</div>
</template>

<style scoped>
/* Animação personalizada para a barra de progresso */
@keyframes progress {
	0% {
		width: 0%;
	}
	100% {
		width: 100%;
	}
}

/* Animação suave para transições de estado */
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>
