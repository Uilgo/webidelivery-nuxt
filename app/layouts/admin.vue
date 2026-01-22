<script setup lang="ts">
/**
 * 📌 Layout Admin
 *
 * Layout principal do painel administrativo do estabelecimento.
 * Dados são carregados pelos plugins de autenticação no servidor.
 */

import AdminHeader from "~/features/admin/components/AdminHeader.vue";
import AdminSidebar from "~/features/admin/components/AdminSidebar.vue";
import { useUserStore } from "~/stores/user";
import { useEstabelecimentoStore } from "~/stores/estabelecimento";

// Estados do layout
const isSidebarOpen = ref(false);

// Cookie para persistir estado do sidebar
const sidebarCollapsedCookie = useCookie("admin-sidebar-collapsed", {
	default: () => false,
	maxAge: 60 * 60 * 24 * 365,
});

const isSidebarCollapsed = ref(sidebarCollapsedCookie.value);

// Stores (dados carregados pelo plugin server)
const userStore = useUserStore();
const estabelecimentoStore = useEstabelecimentoStore();

// Dados do perfil (reativo ao store)
const userProfile = computed(
	() =>
		userStore.profile ?? {
			nome: "Usuário",
			sobrenome: "",
			email: "",
			avatar_url: null,
		},
);

// Dados do estabelecimento (reativo ao store)
const estabelecimentoAtual = computed(
	() =>
		estabelecimentoStore.estabelecimento ?? {
			id: "",
			nome: "Estabelecimento",
			slug: "",
			logo_url: null,
			onboarding: false,
		},
);

// Provide para componentes filhos
provide("estabelecimentoAtual", estabelecimentoAtual);
provide("userProfile", userProfile);

// Handlers
const handleToggleSidebar = (): void => {
	isSidebarOpen.value = !isSidebarOpen.value;
};

const handleCloseSidebar = (): void => {
	isSidebarOpen.value = false;
};

const handleToggleSidebarCollapse = (): void => {
	isSidebarCollapsed.value = !isSidebarCollapsed.value;
	sidebarCollapsedCookie.value = isSidebarCollapsed.value;
};

// SEO
useHead({
	title: "Painel Administrativo - WebiDelivery",
	meta: [
		{ name: "description", content: "Painel administrativo para gerenciar seu estabelecimento" },
	],
});
</script>

<template>
	<div class="flex h-screen bg-[var(--background)] overflow-hidden">
		<AdminSidebar
			:is-open="isSidebarOpen"
			:is-collapsed="isSidebarCollapsed"
			@close="handleCloseSidebar"
			@toggle-collapse="handleToggleSidebarCollapse"
		/>

		<div class="flex-1 flex flex-col min-h-0">
			<AdminHeader
				title="Dashboard"
				:sidebar-open="isSidebarOpen"
				:sidebar-collapsed="isSidebarCollapsed"
				@toggle-sidebar="handleToggleSidebar"
				@toggle-sidebar-collapse="handleToggleSidebarCollapse"
			/>

			<main class="flex-1 overflow-y-auto py-6 pl-6 pr-6">
				<slot></slot>
			</main>
		</div>
	</div>
</template>
