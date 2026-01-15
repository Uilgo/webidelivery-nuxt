/**
 * 📌 useAdicionaisFetch - Busca de Adicionais
 *
 * Responsável por:
 * - Buscar adicionais de um grupo específico do Supabase
 * - Computar campos adicionais
 * - Gerenciar estado de loading e erro
 */

import type { AdicionalComputado } from "../../../types/adicional";

export interface UseAdicionaisFetchReturn {
	adicionais: Ref<AdicionalComputado[]>;
	loading: Ref<boolean>;
	error: Ref<string | null>;
	fetch: (grupoId: string) => Promise<void>;
	refresh: (grupoId: string) => Promise<void>;
}

export const useAdicionaisFetch = (): UseAdicionaisFetchReturn => {
	const supabase = useSupabaseClient();

	// Estados
	const adicionais = ref<AdicionalComputado[]>([]);
	const loading = ref(false);
	const error = ref<string | null>(null);

	/**
	 * Busca adicionais de um grupo específico
	 */
	const fetch = async (grupoId: string): Promise<void> => {
		loading.value = true;
		error.value = null;

		try {
			// Busca adicionais do grupo com informações do grupo
			const { data: items, error: itemsError } = await supabase
				.from("adicionais")
				.select(
					`
					*,
					grupos_adicionais!inner (
						nome
					)
				`,
				)
				.eq("grupo_id", grupoId)
				.order("ordem", { ascending: true });

			if (itemsError) {
				throw itemsError;
			}

			if (!items) {
				adicionais.value = [];
				return;
			}

			// Computa campos adicionais
			adicionais.value = items.map((item) => {
				return {
					...item,
					grupo_nome: item.grupos_adicionais?.nome || "Sem grupo",
					status_display: item.ativo ? "Ativo" : "Inativo",
					preco_display: `R$ ${item.preco.toFixed(2).replace(".", ",")}`,
					pode_excluir: true, // Adicionais sempre podem ser excluídos
				} as AdicionalComputado;
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao buscar adicionais";
			error.value = message;
			console.error("[useAdicionaisFetch] Erro:", message);
			adicionais.value = [];
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Refresh (alias para fetch)
	 */
	const refresh = async (grupoId: string): Promise<void> => {
		await fetch(grupoId);
	};

	return {
		adicionais,
		loading,
		error,
		fetch,
		refresh,
	};
};
