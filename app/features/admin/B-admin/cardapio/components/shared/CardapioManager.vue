<script setup lang="ts">
/**
 * 📌 CardapioManager
 *
 * Componente orquestrador do gerenciamento de cardápio.
 * Responsável apenas pela UI - toda lógica está nos composables.
 *
 * Estrutura:
 * - CardapioMenuTabs (abas de navegação)
 * - CardapioFilters (filtros - FIXO, fora das abas)
 * - CardapioTabSection (conteúdo da aba ativa)
 */

import { useCardapio } from "../../composables/useCardapio";
import { useCategorias } from "../../A-categorias/composables/useCategorias";
import { useProdutos } from "../../B-produtos/composables/useProdutos";
import { useToast } from "~/composables/ui/useToast";
import type { CategoriaComputada } from "../../../types/categoria";
import type { ProdutoComputado } from "../../../types/produto";
import CardapioMenuTabs from "./CardapioMenuTabs.vue";
import CardapioFilters from "./CardapioFilters.vue";
import CardapioTabSection from "./CardapioTabSection.vue";
import CategoriasView from "../../A-categorias/components/CategoriasView.vue";
import ProdutosView from "../../B-produtos/components/ProdutosView.vue";

// Composable global do cardápio
const { activeTab, viewMode, handleTabChange, handleViewModeChange, setTabData, setTabLoading } =
	useCardapio();

// Composable de categorias
const categoriasComposable = useCategorias();

// Composable de produtos
const produtosComposable = useProdutos();

// ========================================
// SINCRONIZAÇÃO COM useCardapio
// ========================================

// Atualiza contadores e estados no useCardapio quando categorias mudam
watch(
	() => categoriasComposable.categoriasRaw.value,
	(categorias) => {
		setTabData("categorias", categorias);
	},
	{ immediate: true },
);

watch(
	() => categoriasComposable.loading.value,
	(loading) => {
		setTabLoading("categorias", loading);
	},
	{ immediate: true },
);

// Atualiza contadores e estados no useCardapio quando produtos mudam
watch(
	() => produtosComposable.produtosRaw.value,
	(produtos) => {
		setTabData("produtos", produtos);
	},
	{ immediate: true },
);

watch(
	() => produtosComposable.loading.value,
	(loading) => {
		setTabLoading("produtos", loading);
	},
	{ immediate: true },
);

// ========================================
// COMPUTADAS PARA TEMPLATE
// ========================================

// Contadores das tabs
const tabCounts = computed(() => ({
	categoriasCount: categoriasComposable.totalCategorias.value,
	produtosCount: produtosComposable.totalProdutos.value,
	adicionaisCount: 0, // TODO: integrar useAdicionais
	combosCount: 0, // TODO: integrar useCombos
}));

// Estados de loading/dados baseados na aba ativa
const currentLoading = computed(() => {
	if (activeTab.value === "categorias") return categoriasComposable.loading.value;
	if (activeTab.value === "produtos") return produtosComposable.loading.value;
	// TODO: outros tabs
	return false;
});

const currentHasData = computed(() => {
	if (activeTab.value === "categorias") return categoriasComposable.categorias.value.length > 0;
	if (activeTab.value === "produtos") return produtosComposable.produtos.value.length > 0;
	// TODO: outros tabs
	return false;
});

const currentSearchValue = computed(() => {
	if (activeTab.value === "categorias") return categoriasComposable.filters.value.busca ?? "";
	if (activeTab.value === "produtos") return produtosComposable.filters.value.busca ?? "";
	return "";
});

const currentSortValue = computed(() => {
	if (activeTab.value === "categorias") {
		const { ordenacao, direcao } = categoriasComposable.filters.value;
		// Retorna vazio se for a ordenação padrão (ordem_asc)
		if (ordenacao === "ordem" && direcao === "asc") return "";
		return ordenacao ? `${ordenacao}_${direcao}` : "";
	}
	if (activeTab.value === "produtos") {
		const { ordenacao, direcao } = produtosComposable.filters.value;
		// Retorna vazio se for a ordenação padrão (ordem_asc)
		if (ordenacao === "ordem" && direcao === "asc") return "";
		return ordenacao ? `${ordenacao}_${direcao}` : "";
	}
	return "";
});

const currentFilters = computed(() => {
	if (activeTab.value === "categorias") {
		const { ativo } = categoriasComposable.filters.value;
		if (ativo !== undefined) {
			return { ativo };
		}
	}
	if (activeTab.value === "produtos") {
		const { ativo, destaque, em_promocao } = produtosComposable.filters.value;
		const filters: Record<string, unknown> = {};
		if (ativo !== undefined) filters.ativo = ativo;
		if (destaque !== undefined) filters.destaque = destaque;
		if (em_promocao !== undefined) filters.em_promocao = em_promocao;
		if (Object.keys(filters).length > 0) return filters;
	}
	return {};
});

// ========================================
// HANDLERS
// ========================================

/**
 * Handler para busca - delega para o composable correto
 */
const handleSearch = (value: string): void => {
	if (activeTab.value === "categorias") {
		categoriasComposable.setSearch(value);
	} else if (activeTab.value === "produtos") {
		produtosComposable.setSearch(value);
	}
	// TODO: outros tabs
};

/**
 * Handler para ordenação - delega para o composable correto
 */
const handleSort = (value: string): void => {
	if (activeTab.value === "categorias") {
		// Se vazio, volta para ordenação padrão (ordem_asc)
		if (!value) {
			categoriasComposable.setOrdenacao("ordem", "asc");
			return;
		}
		// Parse do valor (ex: "nome_asc", "created_at_desc")
		// Encontra a última ocorrência de "_" para separar field e direcao
		const lastUnderscoreIndex = value.lastIndexOf("_");
		const field = value.substring(0, lastUnderscoreIndex) as "nome" | "ordem" | "created_at";
		const direcao = value.substring(lastUnderscoreIndex + 1) as "asc" | "desc";
		categoriasComposable.setOrdenacao(field, direcao);
	} else if (activeTab.value === "produtos") {
		// Se vazio, volta para ordenação padrão (ordem_asc)
		if (!value) {
			produtosComposable.setOrdenacao("ordem", "asc");
			return;
		}
		const lastUnderscoreIndex = value.lastIndexOf("_");
		const field = value.substring(0, lastUnderscoreIndex) as
			| "nome"
			| "ordem"
			| "total_vendas"
			| "created_at";
		const direcao = value.substring(lastUnderscoreIndex + 1) as "asc" | "desc";
		produtosComposable.setOrdenacao(field, direcao);
	}
	// TODO: outros tabs
};

/**
 * Handler para filtros - delega para o composable correto
 */
const handleFilter = (filters: Record<string, unknown>): void => {
	if (activeTab.value === "categorias") {
		if ("ativo" in filters) {
			categoriasComposable.setAtivo(filters.ativo as boolean | undefined);
		} else {
			categoriasComposable.setAtivo(undefined);
		}
	} else if (activeTab.value === "produtos") {
		// Limpa todos os filtros primeiro
		if (Object.keys(filters).length === 0) {
			produtosComposable.setAtivo(undefined);
			produtosComposable.setDestaque(undefined);
			produtosComposable.setEmPromocao(undefined);
			produtosComposable.setCategoria(undefined);
			return;
		}
		// Aplica filtros específicos
		if ("ativo" in filters) {
			produtosComposable.setAtivo(filters.ativo as boolean | undefined);
		}
		if ("destaque" in filters) {
			produtosComposable.setDestaque(filters.destaque as boolean | undefined);
		}
		if ("em_promocao" in filters) {
			produtosComposable.setEmPromocao(filters.em_promocao as boolean | undefined);
		}
		if ("categoria_id" in filters) {
			produtosComposable.setCategoria(filters.categoria_id as string | undefined);
		}
	}
	// TODO: outros tabs
};

/**
 * Handler para refresh - delega para o composable correto
 */
const handleRefresh = async (): Promise<void> => {
	if (activeTab.value === "categorias") {
		await categoriasComposable.refresh();
	} else if (activeTab.value === "produtos") {
		await produtosComposable.refresh();
	}
	// TODO: outros tabs
};

/**
 * Handler para criar - abre modal do composable correto
 */
const handleCreate = (): void => {
	if (activeTab.value === "categorias") {
		categoriasComposable.openCreate();
	} else if (activeTab.value === "produtos") {
		produtosComposable.openCreate();
	}
	// TODO: outros tabs
};

/**
 * Handler para seleção de categoria
 */
const handleCategoriaSelect = (categoria: unknown): void => {
	// Por enquanto, abre para edição
	categoriasComposable.openEdit(categoria as Parameters<typeof categoriasComposable.openEdit>[0]);
};

/**
 * Handler para ver mais detalhes de categoria
 */
const handleCategoriaViewMore = (categoria: unknown): void => {
	categoriasComposable.openView(categoria as Parameters<typeof categoriasComposable.openView>[0]);
};

/**
 * Handler para editar categoria
 */
const handleCategoriaEdit = (categoria: unknown): void => {
	categoriasComposable.openEdit(categoria as Parameters<typeof categoriasComposable.openEdit>[0]);
};

/**
 * Handler para excluir categoria
 */
const handleCategoriaDelete = (_categoria: unknown): void => {
	// TODO: implementar quando tiver modal de confirmação
	console.warn("[CardapioManager] Delete não implementado ainda");
};

/**
 * Handler para toggle status de categoria
 */
const handleCategoriaToggleStatus = async (categoria: unknown): Promise<void> => {
	const cat = categoria as CategoriaComputada;
	const novoStatus = !cat.ativo;
	const success = await categoriasComposable.handleToggleAtivo(cat.id, novoStatus);

	if (success) {
		const toast = useToast();
		toast.add({
			title: novoStatus ? "Categoria ativada" : "Categoria desativada",
			description: `${cat.nome} foi ${novoStatus ? "ativada" : "desativada"} com sucesso`,
			color: "success",
			duration: 3000,
		});
	}
};

/**
 * Handler para seleção de produto
 */
const handleProdutoSelect = (produto: unknown): void => {
	produtosComposable.openEdit(produto as Parameters<typeof produtosComposable.openEdit>[0]);
};

/**
 * Handler para ver mais detalhes de produto
 */
const handleProdutoViewMore = (produto: unknown): void => {
	produtosComposable.openView(produto as Parameters<typeof produtosComposable.openView>[0]);
};

/**
 * Handler para editar produto
 */
const handleProdutoEdit = (produto: unknown): void => {
	produtosComposable.openEdit(produto as Parameters<typeof produtosComposable.openEdit>[0]);
};

/**
 * Handler para excluir produto
 */
const handleProdutoDelete = (_produto: unknown): void => {
	// TODO: implementar quando tiver modal de confirmação
	console.warn("[CardapioManager] Delete de produto não implementado ainda");
};

/**
 * Handler para toggle status de produto
 */
const handleProdutoToggleStatus = async (produto: unknown): Promise<void> => {
	const prod = produto as ProdutoComputado;
	const novoStatus = !prod.ativo;
	const success = await produtosComposable.handleToggleAtivo(prod.id, novoStatus);

	if (success) {
		const toast = useToast();
		toast.add({
			title: novoStatus ? "Produto ativado" : "Produto desativado",
			description: `${prod.nome} foi ${novoStatus ? "ativado" : "desativado"} com sucesso`,
			color: "success",
			duration: 3000,
		});
	}
};

// ========================================
// INICIALIZAÇÃO
// ========================================

onMounted(async () => {
	// Carrega categorias ao montar
	await categoriasComposable.init();
	// Carrega produtos ao montar
	await produtosComposable.init();
});
</script>

<template>
	<div class="flex flex-col h-full">
		<!-- Tabs do Menu -->
		<CardapioMenuTabs
			v-model="activeTab"
			:categorias-count="tabCounts.categoriasCount"
			:produtos-count="tabCounts.produtosCount"
			:adicionais-count="tabCounts.adicionaisCount"
			:combos-count="tabCounts.combosCount"
			@tab-change="handleTabChange"
		/>

		<!-- Filtros -->
		<CardapioFilters
			:active-tab="activeTab"
			:search-value="currentSearchValue"
			:sort-value="currentSortValue"
			:filters="currentFilters"
			:loading="currentLoading"
			:view-mode="viewMode"
			:categorias="categoriasComposable.categoriasRaw.value"
			@search="handleSearch"
			@sort="handleSort"
			@filter="handleFilter"
			@refresh="handleRefresh"
			@create="handleCreate"
			@update:view-mode="handleViewModeChange"
		/>

		<!-- Conteúdo da Aba Ativa -->
		<div class="flex-1 min-h-0 overflow-hidden">
			<CardapioTabSection
				:active-tab="activeTab"
				:loading="currentLoading"
				:has-data="currentHasData"
				@create="handleCreate"
			>
				<template #default="{ activeTab: sectionTab }">
					<!-- Categorias -->
					<CategoriasView
						v-if="sectionTab === 'categorias'"
						:categorias="categoriasComposable.categorias.value"
						:view-mode="viewMode"
						@select="handleCategoriaSelect"
						@view-more="handleCategoriaViewMore"
						@edit="handleCategoriaEdit"
						@delete="handleCategoriaDelete"
						@toggle-status="handleCategoriaToggleStatus"
					/>

					<!-- Produtos -->
					<ProdutosView
						v-else-if="sectionTab === 'produtos'"
						:produtos="produtosComposable.produtos.value"
						:view-mode="viewMode"
						@select="handleProdutoSelect"
						@view-more="handleProdutoViewMore"
						@edit="handleProdutoEdit"
						@delete="handleProdutoDelete"
						@toggle-status="handleProdutoToggleStatus"
					/>

					<!-- TODO: Adicionais -->
					<div
						v-else-if="sectionTab === 'adicionais'"
						class="p-6 text-center text-[var(--text-muted)]"
					>
						<p>TODO: AdicionaisView</p>
					</div>

					<!-- TODO: Combos -->
					<div v-else-if="sectionTab === 'combos'" class="p-6 text-center text-[var(--text-muted)]">
						<p>TODO: CombosView</p>
					</div>
				</template>
			</CardapioTabSection>
		</div>

		<!-- TODO: Modal de Categoria -->
		<!-- 
		<CategoriaModal
			v-model="categoriasComposable.isModalOpen.value"
			:mode="categoriasComposable.modalMode.value"
			:categoria="categoriasComposable.selectedCategoria.value"
			:creating="categoriasComposable.creating.value"
			:updating="categoriasComposable.updating.value"
			@create="categoriasComposable.handleCreate"
			@update="categoriasComposable.handleUpdate"
			@delete="categoriasComposable.handleDelete"
			@close="categoriasComposable.closeModal"
		/>
		--></div>
</template>
