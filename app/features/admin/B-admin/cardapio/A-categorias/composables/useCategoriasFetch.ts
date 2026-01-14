/**
 * 📌 useCategoriasFetch - Busca de Categorias do Supabase
 *
 * Responsável por:
 * - Buscar lista de categorias do estabelecimento com dados computados
 * - Gerenciar estados de loading e error
 * - Refresh dos dados
 */

import type { Categoria, CategoriaComputada } from "../../../types/categoria";
import { useEstabelecimentoStore } from "~/stores/estabelecimento";

export interface UseCategoriasFetchReturn {
	categorias: Ref<CategoriaComputada[]>;
	loading: Ref<boolean>;
	error: Ref<string | null>;
	fetch: () => Promise<void>;
	refresh: () => Promise<void>;
}

export const useCategoriasFetch = (): UseCategoriasFetchReturn => {
	const supabase = useSupabaseClient();
	const estabelecimentoStore = useEstabelecimentoStore();

	// Estado
	const categorias = ref<CategoriaComputada[]>([]);
	const loading = ref(false);
	const error = ref<string | null>(null);

	/**
	 * Busca categorias do estabelecimento atual com contagem de produtos
	 */
	const fetch = async (): Promise<void> => {
		const estabelecimentoId = estabelecimentoStore.id;

		if (!estabelecimentoId) {
			error.value = "Estabelecimento não encontrado";
			return;
		}

		loading.value = true;
		error.value = null;

		try {
			// Busca categorias com contagem de produtos
			const { data, error: fetchError } = await supabase
				.from("categorias")
				.select(
					`
					*,
					produtos:produtos(count)
				`,
				)
				.eq("estabelecimento_id", estabelecimentoId)
				.order("ordem", { ascending: true });

			if (fetchError) {
				throw fetchError;
			}

			// Transforma dados para CategoriaComputada
			categorias.value = ((data as unknown[]) ?? []).map((cat: unknown) => {
				const categoria = cat as Categoria & { produtos: Array<{ count: number }> };
				const produtos_count = categoria.produtos?.[0]?.count ?? 0;

				return {
					...categoria,
					produtos_count,
					status_display: categoria.ativo ? "Ativa" : "Inativa",
					pode_excluir: produtos_count === 0, // Só pode excluir se não tiver produtos
				} as CategoriaComputada;
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao buscar categorias";
			error.value = message;
			console.error("[useCategoriasFetch] Erro:", message);
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Refresh dos dados (alias para fetch)
	 */
	const refresh = async (): Promise<void> => {
		await fetch();
	};

	return {
		categorias,
		loading,
		error,
		fetch,
		refresh,
	};
};
