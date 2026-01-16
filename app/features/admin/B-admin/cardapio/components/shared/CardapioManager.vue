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
import { useGruposAdicionais } from "../../C-adicionais/composables/useGruposAdicionais";
import { useAdicionais } from "../../C-adicionais/composables/useAdicionais";
import { useCombos } from "../../D-combos/composables/useCombos";
import { useToast } from "~/composables/ui/useToast";
import type { CategoriaComputada } from "../../../types/categoria";
import type { ProdutoComputado } from "../../../types/produto";
import type { GrupoAdicionalComputado } from "../../../types/adicional";
import type { Combo } from "../../../types/combo";
import CardapioMenuTabs from "./CardapioMenuTabs.vue";
import CardapioFilters from "./CardapioFilters.vue";
import CardapioTabSection from "./CardapioTabSection.vue";
import CategoriasView from "../../A-categorias/components/CategoriasView.vue";
import ProdutosView from "../../B-produtos/components/ProdutosView.vue";
import GruposAdicionaisView from "../../C-adicionais/components/GruposAdicionaisView.vue";
import CombosView from "../../D-combos/components/CombosView.vue";
import CategoriaDrawer from "../../A-categorias/components/CategoriaDrawer.vue";
import CategoriaDeleteModal from "../../A-categorias/components/CategoriaDeleteModal.vue";
import ProdutoDrawer from "../../B-produtos/components/ProdutoDrawer.vue";
import ProdutoDeleteModal from "../../B-produtos/components/ProdutoDeleteModal.vue";
import GrupoAdicionalDrawer from "../../C-adicionais/components/GrupoAdicionalDrawer.vue";
import GrupoAdicionalDeleteModal from "../../C-adicionais/components/GrupoAdicionalDeleteModal.vue";
import AdicionalDrawer from "../../C-adicionais/components/AdicionalDrawer.vue";
import AdicionalDeleteModal from "../../C-adicionais/components/AdicionalDeleteModal.vue";
import ComboDrawer from "../../D-combos/components/ComboDrawer.vue";
import ComboDeleteModal from "../../D-combos/components/ComboDeleteModal.vue";

// Composable global do cardápio
const { activeTab, viewMode, handleTabChange, handleViewModeChange, setTabData, setTabLoading } =
	useCardapio();

// Composable de categorias
const categoriasComposable = useCategorias();

// Composable de produtos
const produtosComposable = useProdutos();

// Composable de grupos de adicionais
const gruposAdicionaisComposable = useGruposAdicionais();

// Composable de adicionais individuais
const adicionaisComposable = useAdicionais();

// Composable de combos
const combosComposable = useCombos();

// Estado de expansão dos grupos de adicionais
const expandedGrupoId = ref<string | null>(null);

// Estado do modal de exclusão de categoria
const isDeleteModalOpen = ref(false);
const categoriaToDelete = ref<CategoriaComputada | null>(null);

// Estado do modal de exclusão de produto
const isProdutoDeleteModalOpen = ref(false);
const produtoToDelete = ref<ProdutoComputado | null>(null);

// Estado do modal de exclusão de grupo de adicionais
const isGrupoAdicionalDeleteModalOpen = ref(false);
const grupoAdicionalToDelete = ref<GrupoAdicionalComputado | null>(null);

// Estado do modal de exclusão de adicional
const isAdicionalDeleteModalOpen = ref(false);
const adicionalToDelete = ref<{ id: string; nome: string; grupo_nome: string } | null>(null);

// Estado do modal de exclusão de combo
const isComboDeleteModalOpen = ref(false);
const comboToDelete = ref<Combo | null>(null);

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

// Atualiza contadores e estados no useCardapio quando grupos de adicionais mudam
watch(
	() => gruposAdicionaisComposable.gruposAdicionaisRaw.value,
	(gruposAdicionais) => {
		setTabData("adicionais", gruposAdicionais);
	},
	{ immediate: true },
);

watch(
	() => gruposAdicionaisComposable.loading.value,
	(loading) => {
		setTabLoading("adicionais", loading);
	},
	{ immediate: true },
);

// Atualiza contadores e estados no useCardapio quando combos mudam
watch(
	() => combosComposable.allCombos.value,
	(combos) => {
		setTabData("combos", combos);
	},
	{ immediate: true },
);

watch(
	() => combosComposable.isLoading.value,
	(loading) => {
		setTabLoading("combos", loading);
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
	adicionaisCount: gruposAdicionaisComposable.totalGruposAdicionais.value,
	combosCount: combosComposable.counts.value.total,
}));

// Estados de loading/dados baseados na aba ativa
const currentLoading = computed(() => {
	if (activeTab.value === "categorias") return categoriasComposable.loading.value;
	if (activeTab.value === "produtos") return produtosComposable.loading.value;
	if (activeTab.value === "adicionais") return gruposAdicionaisComposable.loading.value;
	if (activeTab.value === "combos") return combosComposable.isLoading.value;
	return false;
});

const currentHasData = computed(() => {
	if (activeTab.value === "categorias") return categoriasComposable.categorias.value.length > 0;
	if (activeTab.value === "produtos") return produtosComposable.produtos.value.length > 0;
	if (activeTab.value === "adicionais")
		return gruposAdicionaisComposable.gruposAdicionais.value.length > 0;
	if (activeTab.value === "combos") return combosComposable.combos.value.length > 0;
	return false;
});

const currentSearchValue = computed(() => {
	if (activeTab.value === "categorias") return categoriasComposable.filters.value.busca ?? "";
	if (activeTab.value === "produtos") return produtosComposable.filters.value.busca ?? "";
	if (activeTab.value === "adicionais") return gruposAdicionaisComposable.filters.value.busca ?? "";
	if (activeTab.value === "combos") return combosComposable.filters.value.busca ?? "";
	return "";
});

const currentSortValue = computed(() => {
	if (activeTab.value === "categorias") {
		const { ordenacao, direcao } = categoriasComposable.filters.value;
		// Retorna vazio se for a ordenação padrão (created_at_desc)
		if (ordenacao === "created_at" && direcao === "desc") return "";
		return ordenacao ? `${ordenacao}_${direcao}` : "";
	}
	if (activeTab.value === "produtos") {
		const { ordenacao, direcao } = produtosComposable.filters.value;
		// Retorna vazio se for a ordenação padrão (created_at_desc)
		if (ordenacao === "created_at" && direcao === "desc") return "";
		return ordenacao ? `${ordenacao}_${direcao}` : "";
	}
	if (activeTab.value === "adicionais") {
		const { ordenacao, direcao } = gruposAdicionaisComposable.filters.value;
		// Retorna vazio se for a ordenação padrão (created_at_desc)
		if (ordenacao === "created_at" && direcao === "desc") return "";
		return ordenacao ? `${ordenacao}_${direcao}` : "";
	}
	if (activeTab.value === "combos") {
		const { ordenacao, direcao } = combosComposable.filters.value;
		// Retorna vazio se for a ordenação padrão (created_at_desc)
		if (ordenacao === "created_at" && direcao === "desc") return "";
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
	if (activeTab.value === "adicionais") {
		const { ativo, obrigatorio } = gruposAdicionaisComposable.filters.value;
		const filters: Record<string, unknown> = {};
		if (ativo !== undefined) filters.ativo = ativo;
		if (obrigatorio !== undefined) filters.obrigatorio = obrigatorio;
		if (Object.keys(filters).length > 0) return filters;
	}
	if (activeTab.value === "combos") {
		const { ativo, destaque } = combosComposable.filters.value;
		const filters: Record<string, unknown> = {};
		if (ativo !== undefined) filters.ativo = ativo;
		if (destaque !== undefined) filters.destaque = destaque;
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
	} else if (activeTab.value === "adicionais") {
		gruposAdicionaisComposable.setSearch(value);
	} else if (activeTab.value === "combos") {
		combosComposable.setSearch(value);
	}
};

/**
 * Handler para ordenação - delega para o composable correto
 */
const handleSort = (value: string): void => {
	if (activeTab.value === "categorias") {
		// Se vazio, volta para ordenação padrão (created_at_desc)
		if (!value) {
			categoriasComposable.setOrdenacao("created_at", "desc");
			return;
		}
		// Parse do valor (ex: "nome_asc", "created_at_desc")
		// Encontra a última ocorrência de "_" para separar field e direcao
		const lastUnderscoreIndex = value.lastIndexOf("_");
		const field = value.substring(0, lastUnderscoreIndex) as "nome" | "ordem" | "created_at";
		const direcao = value.substring(lastUnderscoreIndex + 1) as "asc" | "desc";
		categoriasComposable.setOrdenacao(field, direcao);
	} else if (activeTab.value === "produtos") {
		// Se vazio, volta para ordenação padrão (created_at_desc)
		if (!value) {
			produtosComposable.setOrdenacao("created_at", "desc");
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
	} else if (activeTab.value === "adicionais") {
		// Se vazio, volta para ordenação padrão (created_at_desc)
		if (!value) {
			gruposAdicionaisComposable.setOrdenacao("created_at", "desc");
			return;
		}
		const lastUnderscoreIndex = value.lastIndexOf("_");
		const field = value.substring(0, lastUnderscoreIndex) as "nome" | "ordem" | "created_at";
		const direcao = value.substring(lastUnderscoreIndex + 1) as "asc" | "desc";
		gruposAdicionaisComposable.setOrdenacao(field, direcao);
	} else if (activeTab.value === "combos") {
		// Se vazio, volta para ordenação padrão (created_at_desc)
		if (!value) {
			combosComposable.setOrdenacao("created_at", "desc");
			return;
		}
		const lastUnderscoreIndex = value.lastIndexOf("_");
		const field = value.substring(0, lastUnderscoreIndex) as
			| "ordem"
			| "nome"
			| "preco_combo"
			| "created_at";
		const direcao = value.substring(lastUnderscoreIndex + 1) as "asc" | "desc";
		combosComposable.setOrdenacao(field, direcao);
	}
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
	} else if (activeTab.value === "adicionais") {
		// Limpa todos os filtros primeiro
		if (Object.keys(filters).length === 0) {
			gruposAdicionaisComposable.setAtivo(undefined);
			gruposAdicionaisComposable.setObrigatorio(undefined);
			return;
		}
		// Aplica filtros específicos
		if ("ativo" in filters) {
			gruposAdicionaisComposable.setAtivo(filters.ativo as boolean | undefined);
		}
		if ("obrigatorio" in filters) {
			gruposAdicionaisComposable.setObrigatorio(filters.obrigatorio as boolean | undefined);
		}
	} else if (activeTab.value === "combos") {
		// Limpa todos os filtros primeiro
		if (Object.keys(filters).length === 0) {
			combosComposable.setAtivo(undefined);
			combosComposable.setDestaque(undefined);
			return;
		}
		// Aplica filtros específicos
		if ("ativo" in filters) {
			combosComposable.setAtivo(filters.ativo as boolean | undefined);
		}
		if ("destaque" in filters) {
			combosComposable.setDestaque(filters.destaque as boolean | undefined);
		}
	}
};

/**
 * Handler para refresh - delega para o composable correto
 */
const handleRefresh = async (): Promise<void> => {
	if (activeTab.value === "categorias") {
		await categoriasComposable.refresh();
	} else if (activeTab.value === "produtos") {
		await produtosComposable.refresh();
	} else if (activeTab.value === "adicionais") {
		await gruposAdicionaisComposable.refresh();
	} else if (activeTab.value === "combos") {
		await combosComposable.refresh();
	}
};

/**
 * Handler para criar - abre modal do composable correto
 */
const handleCreate = (): void => {
	if (activeTab.value === "categorias") {
		categoriasComposable.openCreate();
	} else if (activeTab.value === "produtos") {
		produtosComposable.openCreate();
	} else if (activeTab.value === "adicionais") {
		gruposAdicionaisComposable.openCreate();
	} else if (activeTab.value === "combos") {
		combosComposable.openCreate();
	}
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
const handleCategoriaDelete = (categoria: unknown): void => {
	const cat = categoria as CategoriaComputada;
	categoriaToDelete.value = cat;
	isDeleteModalOpen.value = true;
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

// ========================================
// HANDLERS DOS MODAIS DE CATEGORIA
// ========================================

/**
 * Handler para sucesso no modal de categoria
 */
const handleCategoriaModalSuccess = (): void => {
	// Modal já fecha automaticamente e dados são atualizados
	// Este handler pode ser usado para ações adicionais se necessário
};

/**
 * Handler para sucesso na exclusão de categoria
 */
const handleCategoriaDeleteSuccess = (): void => {
	isDeleteModalOpen.value = false;
	categoriaToDelete.value = null;
};

// ========================================
// HANDLERS DOS MODAIS DE PRODUTO
// ========================================

/**
 * Handler para sucesso no modal de produto
 */
const handleProdutoModalSuccess = async (): Promise<void> => {
	// Refresh dos dados após criar/editar
	await produtosComposable.refresh();
};

/**
 * Handler para sucesso na exclusão de produto
 */
const handleProdutoDeleteSuccess = (): void => {
	isProdutoDeleteModalOpen.value = false;
	produtoToDelete.value = null;
};

/**
 * Handler para sucesso no modal de grupo de adicionais
 */
const handleGrupoAdicionalModalSuccess = async (): Promise<void> => {
	// Refresh dos dados após criar/editar
	await gruposAdicionaisComposable.refresh();
};

/**
 * Handler para sucesso na exclusão de grupo de adicionais
 */
const handleGrupoAdicionalDeleteSuccess = (): void => {
	isGrupoAdicionalDeleteModalOpen.value = false;
	grupoAdicionalToDelete.value = null;
};

/**
 * Handler para sucesso no modal de adicional
 */
const handleAdicionalModalSuccess = async (): Promise<void> => {
	// Refresh dos grupos para atualizar contadores e dados
	await gruposAdicionaisComposable.refresh();
};

/**
 * Handler para sucesso na exclusão de adicional
 */
const handleAdicionalDeleteSuccess = (): void => {
	// Refresh dos grupos de adicionais para atualizar a lista
	gruposAdicionaisComposable.refresh();

	isAdicionalDeleteModalOpen.value = false;
	adicionalToDelete.value = null;
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
const handleProdutoDelete = (produto: unknown): void => {
	const prod = produto as ProdutoComputado;
	produtoToDelete.value = prod;
	isProdutoDeleteModalOpen.value = true;
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

/**
 * Handler para seleção de grupo de adicionais
 */
const handleGrupoAdicionalSelect = (grupoAdicional: unknown): void => {
	gruposAdicionaisComposable.openEdit(
		grupoAdicional as Parameters<typeof gruposAdicionaisComposable.openEdit>[0],
	);
};

/**
 * Handler para ver mais detalhes de grupo de adicionais
 */
const handleGrupoAdicionalViewMore = (grupoAdicional: unknown): void => {
	gruposAdicionaisComposable.openView(
		grupoAdicional as Parameters<typeof gruposAdicionaisComposable.openView>[0],
	);
};

/**
 * Handler para editar grupo de adicionais
 */
const handleGrupoAdicionalEdit = (grupoAdicional: unknown): void => {
	gruposAdicionaisComposable.openEdit(
		grupoAdicional as Parameters<typeof gruposAdicionaisComposable.openEdit>[0],
	);
};

/**
 * Handler para excluir grupo de adicionais
 */
const handleGrupoAdicionalDelete = (grupoAdicional: unknown): void => {
	const grupo = grupoAdicional as GrupoAdicionalComputado;
	grupoAdicionalToDelete.value = grupo;
	isGrupoAdicionalDeleteModalOpen.value = true;
};

/**
 * Handler para toggle status de grupo de adicionais
 */
const handleGrupoAdicionalToggleStatus = async (grupoAdicional: unknown): Promise<void> => {
	const grupo = grupoAdicional as GrupoAdicionalComputado;
	const novoStatus = !grupo.ativo;
	const success = await gruposAdicionaisComposable.handleToggleAtivo(grupo.id, novoStatus);

	if (success) {
		const toast = useToast();
		toast.add({
			title: novoStatus ? "Grupo ativado" : "Grupo desativado",
			description: `${grupo.nome} foi ${novoStatus ? "ativado" : "desativado"} com sucesso`,
			color: "success",
			duration: 3000,
		});
	}
};

// ========================================
// HANDLERS DE ADICIONAIS INDIVIDUAIS
// ========================================

/**
 * Handler para criar adicional
 */
const handleCreateAdicional = (grupoId: string): void => {
	adicionaisComposable.openCreate(grupoId);
};

/**
 * Handler para editar adicional
 */
const handleEditAdicional = (adicionalId: string, _grupoId: string): void => {
	// Busca o adicional nos dados do grupo
	const grupo = gruposAdicionaisComposable.gruposAdicionais.value.find((g) =>
		g.adicionais?.some((a) => a.id === adicionalId),
	);
	const adicional = grupo?.adicionais?.find((a) => a.id === adicionalId);

	if (adicional && grupo) {
		// Converte AdicionalComputado para Adicional completo
		const adicionalCompleto = {
			...adicional,
			descricao: adicional.descricao ?? null,
			grupo_id: grupo.id,
			ordem: 0, // TODO: buscar ordem real se necessário
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};
		adicionaisComposable.openEdit(adicionalCompleto);
	}
};

/**
 * Handler para excluir adicional
 */
const handleDeleteAdicional = (adicionalId: string, grupoId: string): void => {
	// Busca o adicional nos dados do grupo
	const grupo = gruposAdicionaisComposable.gruposAdicionais.value.find((g) => g.id === grupoId);
	const adicional = grupo?.adicionais?.find((a) => a.id === adicionalId);

	if (adicional && grupo) {
		adicionalToDelete.value = {
			id: adicional.id,
			nome: adicional.nome,
			grupo_nome: grupo.nome,
		};
		isAdicionalDeleteModalOpen.value = true;
	}
};

/**
 * Handler para toggle status de adicional
 */
const handleToggleAdicionalStatus = async (
	adicionalId: string,
	ativo: boolean,
	grupoId: string,
): Promise<void> => {
	const success = await adicionaisComposable.handleToggleAtivo(adicionalId, ativo, grupoId);

	if (success) {
		const toast = useToast();
		toast.add({
			title: ativo ? "Adicional ativado" : "Adicional desativado",
			description: `O adicional foi ${ativo ? "ativado" : "desativado"} com sucesso`,
			color: "success",
			duration: 3000,
		});

		// Refresh dos grupos para atualizar os dados dos adicionais
		await gruposAdicionaisComposable.refresh();
	}
};

/**
 * Handler para expansão de grupo
 */
const handleGrupoExpansion = (grupoId: string | null): void => {
	expandedGrupoId.value = grupoId;
};

// ========================================
// HANDLERS DE COMBOS
// ========================================

/**
 * Handler para toggle status de combo
 */
const handleComboToggleStatus = async (id: string, ativo: boolean): Promise<void> => {
	const success = await combosComposable.toggleStatus(id, ativo);

	if (success) {
		const toast = useToast();
		toast.add({
			title: ativo ? "Combo ativado" : "Combo desativado",
			description: `O combo foi ${ativo ? "ativado" : "desativado"} com sucesso`,
			color: "success",
			duration: 3000,
		});
	}
};

/**
 * Handler para ver mais detalhes de combo
 */
const handleComboViewMore = (combo: Combo): void => {
	combosComposable.openView(combo);
};

/**
 * Handler para editar combo
 */
const handleComboEdit = (combo: Combo): void => {
	combosComposable.openEdit(combo);
};

/**
 * Handler para excluir combo
 */
const handleComboDelete = (id: string): void => {
	// Busca o combo completo pelo ID
	const combo = combosComposable.combos.value.find((c) => c.id === id);
	if (combo) {
		comboToDelete.value = combo;
		isComboDeleteModalOpen.value = true;
	}
};

/**
 * Handler para sucesso na exclusão de combo
 */
const handleComboDeleteSuccess = (): void => {
	isComboDeleteModalOpen.value = false;
	comboToDelete.value = null;
};

/**
 * Handler para sucesso no modal de combo
 */
const handleComboModalSuccess = async (): Promise<void> => {
	// Refresh dos dados após criar/editar
	await combosComposable.refresh();
};

// ========================================
// INICIALIZAÇÃO - EAGER LOADING COM CACHE
// ========================================

onMounted(async () => {
	/**
	 * Estratégia: Cache em Cookie + Fetch em Background
	 *
	 * 1. Dados do cookie são carregados INSTANTANEAMENTE no useState
	 * 2. Fetch acontece em background para atualizar dados
	 * 3. Skeleton só aparece se não tiver cache (primeira vez ou expirado)
	 *
	 * Resultado:
	 * - Reload da página = dados aparecem IMEDIATAMENTE (do cookie)
	 * - Primeira visita = skeleton enquanto carrega
	 * - Navegação entre tabs = instantâneo (useState global)
	 */
	await Promise.all([
		categoriasComposable.init(),
		produtosComposable.init(),
		gruposAdicionaisComposable.init(),
		combosComposable.init(),
	]);
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
				:view-mode="viewMode"
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

					<!-- Grupos de Adicionais -->
					<GruposAdicionaisView
						v-else-if="sectionTab === 'adicionais'"
						:grupos-adicionais="gruposAdicionaisComposable.gruposAdicionais.value"
						:view-mode="viewMode"
						:expanded-id="expandedGrupoId"
						@select="handleGrupoAdicionalSelect"
						@view-more="handleGrupoAdicionalViewMore"
						@edit="handleGrupoAdicionalEdit"
						@delete="handleGrupoAdicionalDelete"
						@toggle-status="handleGrupoAdicionalToggleStatus"
						@create-adicional="handleCreateAdicional"
						@edit-adicional="handleEditAdicional"
						@delete-adicional="handleDeleteAdicional"
						@toggle-adicional-status="handleToggleAdicionalStatus"
						@update:expanded-id="handleGrupoExpansion"
					/>

					<!-- Combos -->
					<CombosView
						v-else-if="sectionTab === 'combos'"
						:combos="combosComposable.combos.value"
						:view-mode="viewMode"
						@toggle-status="handleComboToggleStatus"
						@view-more="handleComboViewMore"
						@edit="handleComboEdit"
						@delete="handleComboDelete"
					/>
				</template>
			</CardapioTabSection>
		</div>

		<!-- Drawer e Modal de Categoria -->
		<CategoriaDrawer
			v-model="categoriasComposable.isModalOpen.value"
			:is-edicao="categoriasComposable.modalMode.value === 'edit'"
			:categoria="categoriasComposable.selectedCategoria.value as CategoriaComputada"
			@success="handleCategoriaModalSuccess"
		/>

		<CategoriaDeleteModal
			v-model="isDeleteModalOpen"
			:categoria="categoriaToDelete"
			@success="handleCategoriaDeleteSuccess"
		/>

		<!-- Drawer e Modal de Produto -->
		<ProdutoDrawer
			v-model="produtosComposable.isModalOpen.value"
			:is-edicao="produtosComposable.modalMode.value === 'edit'"
			:produto="(produtosComposable.selectedProduto.value as ProdutoComputado) || null"
			@success="handleProdutoModalSuccess"
		/>

		<ProdutoDeleteModal
			v-if="produtoToDelete"
			v-model="isProdutoDeleteModalOpen"
			:produto="produtoToDelete"
			@success="handleProdutoDeleteSuccess"
		/>

		<!-- Drawer e Modal de Grupo de Adicionais -->
		<GrupoAdicionalDrawer
			v-model="gruposAdicionaisComposable.isModalOpen.value"
			:is-edicao="gruposAdicionaisComposable.modalMode.value === 'edit'"
			:grupo="
				(gruposAdicionaisComposable.selectedGrupoAdicional.value as GrupoAdicionalComputado) || null
			"
			@success="handleGrupoAdicionalModalSuccess"
		/>

		<GrupoAdicionalDeleteModal
			v-if="grupoAdicionalToDelete"
			v-model="isGrupoAdicionalDeleteModalOpen"
			:grupo="grupoAdicionalToDelete"
			@success="handleGrupoAdicionalDeleteSuccess"
		/>

		<!-- Drawer e Modal de Adicional -->
		<AdicionalDrawer
			v-model="adicionaisComposable.isModalOpen.value"
			:is-edicao="adicionaisComposable.modalMode.value === 'edit'"
			:adicional="adicionaisComposable.selectedAdicional.value as any"
			:grupo-id-padrao="adicionaisComposable.grupoId.value"
			@success="handleAdicionalModalSuccess"
		/>

		<AdicionalDeleteModal
			v-if="adicionalToDelete"
			v-model="isAdicionalDeleteModalOpen"
			:adicional="adicionalToDelete as any"
			@success="handleAdicionalDeleteSuccess"
		/>

		<!-- Drawer e Modal de Combo -->
		<ComboDrawer
			v-model="combosComposable.isModalOpen.value"
			:is-edicao="combosComposable.modalMode.value === 'edit'"
			:combo="(combosComposable.selectedCombo.value as Combo) || null"
			@success="handleComboModalSuccess"
		/>

		<ComboDeleteModal
			v-if="comboToDelete"
			v-model="isComboDeleteModalOpen"
			:combo="comboToDelete"
			@success="handleComboDeleteSuccess"
		/>
	</div>
</template>
