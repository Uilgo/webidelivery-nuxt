<script setup lang="ts">
/**
 * 📌 CardapioMenuTabs
 *
 * Componente de tabs específico para o gerenciamento de cardápio.
 * Utiliza o UiTabs com as 4 abas principais: Categorias, Produtos, Adicionais e Combos.
 * Baseado no PRD - Módulo de Cardápio.
 */

interface Props {
	/** Aba ativa atual */
	modelValue?: string;
	/** Contador de categorias para badge */
	categoriasCount?: number;
	/** Contador de produtos para badge */
	produtosCount?: number;
	/** Contador de grupos de adicionais para badge */
	adicionaisCount?: number;
	/** Contador de combos para badge */
	combosCount?: number;
}

interface Emits {
	/** Evento para atualizar aba ativa */
	"update:modelValue": [value: string];
	/** Evento quando aba é alterada */
	"tab-change": [tab: string];
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: "categorias",
	categoriasCount: 0,
	produtosCount: 0,
	adicionaisCount: 0,
	combosCount: 0,
});

const emit = defineEmits<Emits>();

// Configuração das 4 abas baseada no PRD
const cardapioTabs = computed(() => [
	{
		key: "categorias",
		label: "Categorias",
		icon: "lucide:folder",
		badge: props.categoriasCount > 0 ? props.categoriasCount : undefined,
	},
	{
		key: "produtos",
		label: "Produtos",
		icon: "lucide:package",
		badge: props.produtosCount > 0 ? props.produtosCount : undefined,
	},
	{
		key: "adicionais",
		label: "Adicionais",
		icon: "lucide:plus-circle",
		badge: props.adicionaisCount > 0 ? props.adicionaisCount : undefined,
	},
	{
		key: "combos",
		label: "Combos",
		icon: "lucide:package-2",
		badge: props.combosCount > 0 ? props.combosCount : undefined,
	},
]);

/**
 * Handler para mudança de aba
 */
const handleTabChange = (tab: string): void => {
	emit("update:modelValue", tab);
	emit("tab-change", tab);
};
</script>

<template>
	<UiTabs
		:tabs="cardapioTabs"
		:model-value="modelValue"
		fill-height
		@update:model-value="handleTabChange"
		@tab-change="handleTabChange"
	>
		<template #default="{ activeTab }">
			<!-- Slot para o conteúdo das abas -->
			<slot :active-tab="activeTab"></slot>
		</template>
	</UiTabs>
</template>
