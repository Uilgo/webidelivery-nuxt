<script setup lang="ts">
/**
 * 📌 ConfiguracoesManager
 *
 * Orquestrador principal da página de configurações.
 * Gerencia:
 * - RBAC (controle de acesso por cargo)
 * - Estado da tab ativa com sincronização de URL
 * - Navegação entre tabs (ConfigTabs)
 * - Renderização do conteúdo (SectionConfigTabs)
 * - Estados globais de loading/erro
 */

import { useConfiguracoes } from "../composables/useConfiguracoes";
import { useUserStore } from "~/stores/user";
import ConfigTabs from "./ConfigTabs.vue";
import SectionConfigTabs from "./SectionConfigTabs.vue";

// Composable principal (estados globais + sincronização URL)
const { activeTab, handleTabChange } = useConfiguracoes();

// Store do usuário (para RBAC)
const userStore = useUserStore();

// Cargo do usuário (getter retorna Cargo | null)
const userRole = computed(() => userStore.userRole || "");

/**
 * Interface de Tab
 */
interface ConfigTab {
	key: string;
	label: string;
	icon: string;
	allowedRoles: string[];
}

/**
 * Define todas as tabs disponíveis com suas permissões
 */
const allTabs: ConfigTab[] = [
	{
		key: "dados-empresa",
		label: "Dados da Empresa",
		icon: "lucide:store",
		allowedRoles: ["admin"],
	},
	{
		key: "horarios",
		label: "Horários",
		icon: "lucide:clock",
		allowedRoles: ["admin", "gerente"],
	},
	{
		key: "pagamentos",
		label: "Pagamentos",
		icon: "lucide:credit-card",
		allowedRoles: ["admin"],
	},
	{
		key: "frete-entrega",
		label: "Frete e Entrega",
		icon: "lucide:truck",
		allowedRoles: ["admin", "gerente"],
	},
	{
		key: "personalizar",
		label: "Personalizar",
		icon: "lucide:palette",
		allowedRoles: ["admin", "gerente"],
	},
	{
		key: "logs",
		label: "Logs e Auditoria",
		icon: "lucide:file-text",
		allowedRoles: ["admin", "gerente"],
	},
];

/**
 * Filtra tabs baseado no cargo do usuário (RBAC)
 */
const availableTabs = computed(() => {
	const role = userRole.value;
	return allTabs.filter((tab) => tab.allowedRoles.includes(role));
});

/**
 * Tabs formatadas para passar aos componentes filhos
 */
const tabs = computed(() => {
	return availableTabs.value.map((tab) => ({
		key: tab.key,
		label: tab.label,
		icon: tab.icon,
	}));
});

/**
 * Tab ativa padrão (primeira tab disponível)
 */
const defaultTab = computed(() => availableTabs.value[0]?.key || "dados-empresa");

/**
 * Validar se a tab ativa é permitida para o usuário
 * Se não for, redirecionar para a primeira tab disponível
 */
watch(
	[activeTab, availableTabs],
	([currentTab, available]) => {
		const isTabAllowed = available.some((t) => t.key === currentTab);
		if (!isTabAllowed && available.length > 0) {
			const firstTab = available[0];
			if (firstTab) {
				handleTabChange(firstTab.key);
			}
		}
	},
	{ immediate: true },
);
</script>

<template>
	<div class="h-full flex flex-col">
		<!-- Navegação de Tabs (recebe tabs filtradas por RBAC) -->
		<ConfigTabs
			v-model="activeTab"
			:tabs="tabs"
			:default-tab="defaultTab"
			@tab-change="handleTabChange"
		/>

		<!-- Conteúdo da Tab Ativa -->
		<SectionConfigTabs :active-tab="activeTab" class="flex-1 min-h-0" />
	</div>
</template>
