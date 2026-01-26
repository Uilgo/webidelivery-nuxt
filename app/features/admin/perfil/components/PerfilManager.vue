<script setup lang="ts">
/**
 * 📌 PerfilManager (Feature Orchestrator)
 *
 * Componente orquestrador principal da feature de perfil.
 * Gerencia o estado global da página de perfil (tabs) e coordena os componentes de navegação e conteúdo.
 */

import { computed } from "vue";
import PerfilTabs from "./PerfilTabs.vue";
import PerfilSections from "./PerfilSections.vue";

const route = useRoute();
const router = useRouter();

// Estado da aba ativa sincronizado com a URL (?tab=...)
const activeTab = computed({
	get: () => (route.query.tab as "dados" | "configuracoes") || "dados",
	set: (val) => {
		router.replace({ query: { ...route.query, tab: val } });
	},
});
</script>

<template>
	<div class="mx-auto space-y-6">
		<!-- Título e Subtítulo -->
		<header>
			<h1 class="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Meu Perfil</h1>
			<p class="text-[var(--text-muted)]">
				Gerencie suas informações pessoais e configurações de segurança da sua conta.
			</p>
		</header>

		<!-- Orquestrador de Navegação (Tabs) -->
		<PerfilTabs v-model="activeTab" />

		<!-- Orquestrador de Conteúdo (Sections) -->
		<PerfilSections :active-tab="activeTab" />
	</div>
</template>
