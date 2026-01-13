<script setup lang="ts">
/**
 * 📌 Layout de Autenticação
 *
 * Layout específico para páginas de autenticação (login, cadastro, etc.)
 * Fornece estrutura visual consistente com branding e responsividade.
 */

// Meta tags para SEO
useSeoMeta({
	title: "WebiDelivery - Autenticação",
	description: "Acesse sua conta WebiDelivery e gerencie seu cardápio digital",
	ogTitle: "WebiDelivery - Autenticação",
	ogDescription: "Acesse sua conta WebiDelivery e gerencie seu cardápio digital",
});

// Detectar a rota atual para definir títulos
const route = useRoute();

const pageTitles = computed(() => {
	switch (route.path) {
		case "/login":
			return { title: "Entrar", subtitle: "Acesse sua conta" };
		case "/signup":
			return { title: "Criar conta", subtitle: "Cadastre seu estabelecimento" };
		case "/forgot-password":
			return {
				title: "Esqueci minha senha",
				subtitle: "Digite seu e-mail para receber instruções de recuperação",
			};
		case "/super-admin/login":
			return { title: "Login Plataforma", subtitle: "Acesse a plataforma WebiDelivery" };
		case "/super-admin/signup":
			return { title: "Cadastro Plataforma", subtitle: "Crie sua conta na equipe WebiDelivery" };
		case "/super-admin/forgot-password":
			return {
				title: "Recuperar Senha Plataforma",
				subtitle: "Digite seu e-mail corporativo para receber instruções",
			};
		default:
			return { title: "Entrar", subtitle: "Acesse sua conta" };
	}
});

const title = computed(() => pageTitles.value.title);
const subtitle = computed(() => pageTitles.value.subtitle);
</script>

<template>
	<div
		class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 relative"
	>
		<!-- Toggle de modo no canto superior direito -->
		<div class="absolute top-4 right-4 z-10">
			<LayoutsModeToggle />
		</div>

		<!-- Container principal -->
		<div class="w-full max-w-md">
			<!-- Título dinâmico da página -->
			<div class="text-center mb-6">
				<h2 class="text-xl font-bold text-[var(--text-primary)]">{{ title }}</h2>
				<p class="text-[var(--text-secondary)] mt-1 text-sm">{{ subtitle }}</p>
			</div>

			<!-- Card do formulário -->
			<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
				<slot></slot>
			</div>

			<!-- Footer -->
			<div class="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
				<p>&copy; 2026 WebiDelivery. Todos os direitos reservados.</p>
			</div>
		</div>
	</div>
</template>
