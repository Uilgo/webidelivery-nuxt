<script setup lang="ts">
/**
 * 📌 CardapioEmptyState
 *
 * Wrapper do UiEmptyState específico para as abas do cardápio.
 * Pré-configura textos e ícones para cada tipo de conteúdo.
 */

interface Props {
	/** Tipo de conteúdo vazio */
	type: "categorias" | "produtos" | "adicionais" | "combos";
	/** Se deve mostrar o botão de ação */
	showAction?: boolean;
	/** Estado de carregamento */
	loading?: boolean;
}

interface Emits {
	/** Evento quando botão de ação é clicado */
	action: [];
}

const props = withDefaults(defineProps<Props>(), {
	showAction: true,
	loading: false,
});

const emit = defineEmits<Emits>();

// Configurações específicas para cada tipo
const emptyStateConfig = computed(() => {
	const configs = {
		categorias: {
			icon: "lucide:folder",
			title: "Nenhuma categoria encontrada",
			description: "Organize seus produtos em categorias para facilitar a navegação do cardápio.",
			actionText: "Criar Categoria",
		},
		produtos: {
			icon: "lucide:package",
			title: "Nenhum produto encontrado",
			description:
				"Adicione produtos ao seu cardápio com variações de preço e opções de personalização.",
			actionText: "Criar Produto",
		},
		adicionais: {
			icon: "lucide:plus-circle",
			title: "Nenhum grupo de adicionais encontrado",
			description: "Configure grupos de adicionais reutilizáveis para enriquecer seus produtos.",
			actionText: "Criar Grupo",
		},
		combos: {
			icon: "lucide:package-2",
			title: "Nenhum combo encontrado",
			description: "Crie combos promocionais combinando produtos com preços especiais.",
			actionText: "Criar Combo",
		},
	};

	return configs[props.type];
});

/**
 * Handler para ação do botão
 */
const handleAction = (): void => {
	emit("action");
};
</script>

<template>
	<UiEmptyState
		:icon="emptyStateConfig.icon"
		:title="emptyStateConfig.title"
		:description="emptyStateConfig.description"
		:action-text="showAction ? emptyStateConfig.actionText : undefined"
		:loading="loading"
		size="md"
		@action="handleAction"
	/>
</template>
