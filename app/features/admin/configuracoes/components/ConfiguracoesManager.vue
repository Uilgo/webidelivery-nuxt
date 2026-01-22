<script setup lang="ts">
/**
 * 📌 ConfiguracoesManager
 *
 * Orquestrador principal da página de configurações.
 * Gerencia:
 * - RBAC (controle de acesso por cargo)
 * - Estado da tab ativa
 * - Navegação entre tabs (ConfigTabs)
 * - Renderização do conteúdo (SectionConfigTabs)
 * - Estados globais de loading/erro
 */

import { useConfiguracoes } from "../composables/useConfiguracoes";
import { useUserStore } from "~/stores/user";
import ConfigTabs from "./ConfigTabs.vue";
import SectionConfigTabs from "./SectionConfigTabs.vue";

// Composable principal (estados globais)
const { hasError } = useConfiguracoes();

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
const defaultTab = computed(() => availableTabs.value[0]?.key || "horarios");

// Estado da tab ativa (gerenciado pelo Manager)
const activeTab = ref<string>(defaultTab.value);

/**
 * Handler para mudança de tab
 */
const handleTabChange = (tabKey: string): void => {
	activeTab.value = tabKey;
};

// Atualizar activeTab se defaultTab mudar (caso o cargo mude)
watch(defaultTab, (newDefault) => {
	if (!availableTabs.value.find((t) => t.key === activeTab.value)) {
		activeTab.value = newDefault;
	}
});
</script>

<template>
	<div class="space-y-6">
		<!-- Indicador de erro global -->
		<div
			v-if="hasError"
			class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
		>
			<div class="flex items-center space-x-3">
				<Icon name="lucide:alert-triangle" class="w-5 h-5 text-red-600 dark:text-red-400" />
				<div>
					<h4 class="font-semibold text-red-900 dark:text-red-100">Erro ao carregar dados</h4>
					<p class="text-sm text-red-700 dark:text-red-300">
						Ocorreu um erro ao carregar as configurações. Tente recarregar a página.
					</p>
				</div>
			</div>
		</div>

		<!-- Navegação de Tabs (recebe tabs filtradas por RBAC) -->
		<ConfigTabs
			v-model="activeTab"
			:tabs="tabs"
			:default-tab="defaultTab"
			@tab-change="handleTabChange"
		/>

		<!-- Conteúdo da Tab Ativa -->
		<SectionConfigTabs :active-tab="activeTab" />
	</div>
</template>
