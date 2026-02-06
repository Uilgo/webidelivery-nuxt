/**
 * 📌 useProdutosFetch - Busca e Listagem de Produtos
 *
 * Responsável por:
 * - Buscar produtos do estabelecimento
 * - Enriquecer com dados computados (categoria_nome, variacoes_count)
 * - Usa useState que é populado pelo plugin de servidor para carregamento instantâneo
 *
 * ESTRATÉGIA:
 * - Plugin server carrega dados no SSR → useState já tem dados na hidratação
 * - Cliente: se não tem dados do SSR, tenta localStorage
 * - Fetch só acontece se não tiver dados de nenhuma fonte
 */

import type { ProdutoComputado } from "../../../types/produto";

const CACHE_KEY = "cardapio_produtos";

/**
 * Lê dados do localStorage (client-side only)
 */
const getFromStorage = (): ProdutoComputado[] => {
	if (import.meta.server) return [];
	try {
		const cached = localStorage.getItem(CACHE_KEY);
		return cached ? JSON.parse(cached) : [];
	} catch {
		return [];
	}
};

/**
 * Salva dados no localStorage
 */
const saveToStorage = (data: ProdutoComputado[]): void => {
	if (import.meta.server) return;
	try {
		localStorage.setItem(CACHE_KEY, JSON.stringify(data));
	} catch {
		// Ignora erros de storage
	}
};

export interface UseProdutosFetchReturn {
	produtos: Ref<ProdutoComputado[]>;
	loading: Ref<boolean>;
	error: Ref<unknown>;
	fetch: () => Promise<void>;
	refresh: () => Promise<void>;
	init: () => Promise<void>;
}

export const useProdutosFetch = (): UseProdutosFetchReturn => {
	const supabase = useSupabaseClient();

	// Estado global - pode já ter dados do plugin de servidor
	const produtos = useState<ProdutoComputado[]>("produtos", () => []);
	const loading = useState<boolean>("produtos-loading", () => false);
	const cacheLoaded = useState<boolean>("produtos-cache-loaded", () => false);
	const error = ref<unknown>(null);

	const fetch = async (): Promise<void> => {
		loading.value = true;
		error.value = null;

		try {
			// Buscar estabelecimento_id do usuário logado
			const estabelecimentoStore = useEstabelecimentoStore();
			const estabelecimentoId = estabelecimentoStore.estabelecimento?.id;

			if (!estabelecimentoId) {
				throw new Error("Estabelecimento não encontrado");
			}

			const { data, error: fetchError } = await supabase
				.from("produtos")
				.select(
					`
					*,
					categoria:categorias!produtos_categoria_id_fkey(id, nome),
					variacoes:produto_variacoes(id, nome, preco, preco_promocional, ordem, ativo),
					grupos_adicionais:produto_grupos_adicionais(grupo_adicional_id)
				`,
				)
				.eq("estabelecimento_id", estabelecimentoId) // 🔒 FILTRO CRÍTICO DE SEGURANÇA
				.order("created_at", { ascending: false });

			if (fetchError) {
				throw fetchError;
			}

			const newData = (data || []).map((produto) => ({
				...produto,
				categoria_nome: produto.categoria?.nome || "Sem categoria",
				variacoes_count: produto.variacoes?.length || 0,
				status_display: produto.ativo ? "Ativo" : "Inativo",
				pode_excluir: true,
			})) as ProdutoComputado[];

			produtos.value = newData;
			saveToStorage(newData);
			cacheLoaded.value = true;

			// Se não há produtos, garantir que loading seja false imediatamente
			if (newData.length === 0) {
				loading.value = false;
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao buscar produtos";
			error.value = message;
			console.error("[useProdutosFetch] Erro:", message);
		} finally {
			loading.value = false;
		}
	};

	const refresh = async (): Promise<void> => {
		await fetch();
	};

	const init = async (): Promise<void> => {
		// Buscar estabelecimento_id do usuário logado
		const estabelecimentoStore = useEstabelecimentoStore();
		const estabelecimentoId = estabelecimentoStore.estabelecimento?.id;

		if (!estabelecimentoId) {
			console.warn("[useProdutosFetch] Estabelecimento não encontrado");
			produtos.value = [];
			loading.value = false;
			cacheLoaded.value = true; // Marcar como carregado para não tentar novamente
			return;
		}

		// Se já tem dados (do plugin de servidor), validar se são do estabelecimento correto
		if (produtos.value.length > 0) {
			// Verificar se os produtos são do estabelecimento correto
			const produtosValidos = produtos.value.filter(
				(p) => p.estabelecimento_id === estabelecimentoId,
			);

			if (produtosValidos.length === produtos.value.length) {
				// Todos os produtos são válidos
				loading.value = false;
				cacheLoaded.value = true;
				if (import.meta.client) {
					saveToStorage(produtos.value);
				}
				return;
			} else {
				// Produtos de outro estabelecimento - limpar cache
				console.warn("[useProdutosFetch] Cache inválido detectado - limpando");
				produtos.value = [];
				if (import.meta.client) {
					localStorage.removeItem(CACHE_KEY);
				}
			}
		}

		// Se já foi carregado (mesmo que vazio), não carregar novamente
		if (cacheLoaded.value) {
			loading.value = false;
			return;
		}

		// No cliente, tenta carregar do localStorage
		if (import.meta.client) {
			const cachedData = getFromStorage();
			if (cachedData.length > 0) {
				// Validar se os dados em cache são do estabelecimento correto
				const produtosValidos = cachedData.filter(
					(p) => p.estabelecimento_id === estabelecimentoId,
				);

				if (produtosValidos.length > 0) {
					produtos.value = produtosValidos;
					loading.value = false;
					cacheLoaded.value = true;
					return;
				} else {
					// Cache de outro estabelecimento - limpar
					console.warn("[useProdutosFetch] Cache localStorage inválido - limpando");
					localStorage.removeItem(CACHE_KEY);
				}
			}
		}

		// Sem dados válidos - faz fetch
		await fetch();
	};

	return {
		produtos,
		loading,
		error,
		fetch,
		refresh,
		init,
	};
};
