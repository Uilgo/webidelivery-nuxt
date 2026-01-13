<script setup lang="ts">
/**
 * 📌 Layout Admin
 *
 * Layout principal do painel administrativo do estabelecimento.
 * Integra AdminHeader e AdminSidebar com controle de estado centralizado.
 */

// Imports dos componentes
import AdminHeader from "~/features/admin/components/AdminHeader.vue";
import AdminSidebar from "~/features/admin/components/AdminSidebar.vue";
import { useEstabelecimentos } from "~/composables/data/useEstabelecimentos";
import { useUserStore } from "~/stores/user";
import type { Estabelecimento } from "#shared/types/estabelecimentos";

// Estados do layout
const isSidebarOpen = ref(false); // Mobile: sidebar aberto/fechado
const isSidebarCollapsed = ref(false); // Desktop: sidebar expandido/colapsado

// Dados centralizados (evita duplicação entre Header e Sidebar)
const userStore = useUserStore();
const { getCurrentEstablishment } = useEstabelecimentos();

// Estado do estabelecimento centralizado
const estabelecimentoAtual = ref<Estabelecimento | null>(null);
const isLoadingEstabelecimento = ref(true);

// Dados do perfil do usuário (da tabela perfis)
const userProfile = computed(() => userStore.profile);

// Buscar dados do estabelecimento uma única vez
onMounted(async () => {
	try {
		estabelecimentoAtual.value = await getCurrentEstablishment();
		if (!estabelecimentoAtual.value) {
			console.warn("Nenhum estabelecimento encontrado para o usuário atual");
		}
	} catch (error) {
		console.error("Erro ao carregar estabelecimento:", error);
	} finally {
		isLoadingEstabelecimento.value = false;
	}
});

// Provide dos dados para os componentes filhos
provide("estabelecimentoAtual", readonly(estabelecimentoAtual));
provide("isLoadingEstabelecimento", readonly(isLoadingEstabelecimento));
provide("userProfile", readonly(userProfile));

/**
 * Toggle do sidebar no mobile
 */
const handleToggleSidebar = (): void => {
	isSidebarOpen.value = !isSidebarOpen.value;
};

/**
 * Fechar sidebar no mobile
 */
const handleCloseSidebar = (): void => {
	isSidebarOpen.value = false;
};

/**
 * Toggle do collapse no desktop
 */
const handleToggleSidebarCollapse = (): void => {
	isSidebarCollapsed.value = !isSidebarCollapsed.value;
};

// Meta tags para SEO
useHead({
	title: "Painel Administrativo - WebiDelivery",
	meta: [
		{
			name: "description",
			content: "Painel administrativo para gerenciar seu estabelecimento no WebiDelivery",
		},
	],
});
</script>

<template>
	<div class="flex h-screen bg-[var(--background)] overflow-hidden">
		<!-- Sidebar -->
		<AdminSidebar
			:is-open="isSidebarOpen"
			:is-collapsed="isSidebarCollapsed"
			@close="handleCloseSidebar"
			@toggle-collapse="handleToggleSidebarCollapse"
		/>

		<!-- Conteúdo Principal -->
		<div class="flex-1 flex flex-col min-h-0">
			<!-- Header -->
			<AdminHeader
				title="Dashboard"
				:sidebar-open="isSidebarOpen"
				:sidebar-collapsed="isSidebarCollapsed"
				@toggle-sidebar="handleToggleSidebar"
				@toggle-sidebar-collapse="handleToggleSidebarCollapse"
			/>

			<!-- Área de Conteúdo -->
			<main class="flex-1 overflow-y-auto p-6">
				<slot></slot>
			</main>
		</div>
	</div>
</template>
