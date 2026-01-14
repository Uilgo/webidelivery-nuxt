/**
 * 📌 useProdutosFetch - Busca e Listagem de Produtos
 *
 * Responsável por:
 * - Buscar produtos do estabelecimento
 * - Enriquecer com dados computados (categoria_nome, variacoes_count)
 * - Gerenciar estado de loading e erro
 */

import type { ProdutoComputado } from "../../../types/produto";

export interface UseProdutosFetchReturn {
	produtos: Ref<ProdutoComputado[]>;
	loading: Ref<boolean>;
	error: Ref<string | null>;
	fetch: () => Promise<void>;
	refresh: () => Promise<void>;
}

export const useProdutosFetch = (): UseProdutosFetchReturn => {
	const supabase = useSupabaseClient();

	// Estado
	const produtos = ref<ProdutoComputado[]>([]);
	const loading = ref(false);
	const error = ref<string | null>(null);

	/**
	 * Buscar produtos com dados relacionados
	 */
	const fetch = async (): Promise<void> => {
		loading.value = true;
		error.value = null;

		try {
			const { data, error: fetchError } = await supabase
				.from("produtos")
				.select(
					`
					*,
					categoria:categorias!produtos_categoria_id_fkey(id, nome),
					variacoes:produto_variacoes(id)
				`,
				)
				.order("ordem", { ascending: true });

			if (fetchError) {
				throw fetchError;
			}

			// Enriquecer dados
			produtos.value = (data || []).map((produto) => ({
				...produto,
				categoria_nome: produto.categoria?.nome || "Sem categoria",
				variacoes_count: produto.variacoes?.length || 0,
				status_display: produto.ativo ? "Ativo" : "Inativo",
				pode_excluir: true, // TODO: verificar se tem pedidos
			})) as ProdutoComputado[];
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao buscar produtos";
			error.value = message;
			console.error("[useProdutosFetch] Erro:", message);
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Refresh (alias para fetch)
	 */
	const refresh = async (): Promise<void> => {
		await fetch();
	};

	return {
		produtos,
		loading,
		error,
		fetch,
		refresh,
	};
};
