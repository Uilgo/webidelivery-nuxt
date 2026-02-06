<script setup lang="ts">
/**
 * 📑 RelatoriosTabs
 *
 * Navegação entre as abas de relatórios:
 * - Pedidos, Vendas, Produtos, Marketing, Financeiro
 * - Sincronização com URL
 * - Indicador visual da aba ativa
 */

import type { AbaRelatorio } from "../types/relatorios";

interface Props {
	abaAtiva: AbaRelatorio;
}

defineProps<Props>();

interface Emits {
	change: [aba: AbaRelatorio];
}

const emit = defineEmits<Emits>();

// Definir abas disponíveis no formato do UiTabs
const abas = [
	{ key: "pedidos", label: "Pedidos", icon: "lucide:shopping-bag" },
	{ key: "vendas", label: "Vendas", icon: "lucide:trending-up" },
	{ key: "produtos", label: "Produtos", icon: "lucide:package" },
	{ key: "marketing", label: "Marketing", icon: "lucide:megaphone" },
	{ key: "financeiro", label: "Financeiro", icon: "lucide:dollar-sign" },
];

// Handler de mudança de aba
const handleChange = (abaId: string) => {
	emit("change", abaId as AbaRelatorio);
};
</script>

<template>
	<div class="relatorios-tabs">
		<UiTabs :tabs="abas" :model-value="abaAtiva" @update:model-value="handleChange">
			<!-- Slot vazio - conteúdo renderizado pelo RelatoriosManager -->
		</UiTabs>
	</div>
</template>
