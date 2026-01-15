/**
 * 📌 useGruposAdicionaisFetch - Busca de Grupos de Adicionais
 *
 * Responsável por:
 * - Buscar grupos de adicionais do Supabase
 * - Computar campos adicionais (contadores, preços)
 * - Gerenciar estado de loading e erro
 */

import type { GrupoAdicionalComputado } from "../../../types/adicional";

export interface UseGruposAdicionaisFetchReturn {
	gruposAdicionais: Ref<GrupoAdicionalComputado[]>;
	loading: Ref<boolean>;
	error: Ref<string | null>;
	fetch: () => Promise<void>;
	refresh: () => Promise<void>;
}

export const useGruposAdicionaisFetch = (): UseGruposAdicionaisFetchReturn => {
	const supabase = useSupabaseClient();

	// Estados
	const gruposAdicionais = ref<GrupoAdicionalComputado[]>([]);
	const loading = ref(false);
	const error = ref<string | null>(null);

	/**
	 * Busca grupos de adicionais com dados computados
	 */
	const fetch = async (): Promise<void> => {
		loading.value = true;
		error.value = null;

		try {
			// Busca grupos de adicionais
			const { data: grupos, error: gruposError } = await supabase
				.from("grupos_adicionais")
				.select(
					`
					*,
					adicionais (
						id,
						nome,
						preco,
						ativo
					)
				`,
				)
				.order("ordem", { ascending: true });

			if (gruposError) {
				throw gruposError;
			}

			if (!grupos) {
				gruposAdicionais.value = [];
				return;
			}

			// Computa campos adicionais
			gruposAdicionais.value = grupos.map((grupo) => {
				const adicionais = grupo.adicionais || [];
				const adicionaisAtivos = adicionais.filter((a: { ativo: boolean }) => a.ativo);
				const precos = adicionais
					.map((a: { preco: number }) => a.preco)
					.filter((p: number) => p > 0);

				return {
					...grupo,
					adicionais, // Mantém os adicionais para exibição na expansão
					adicionais_count: adicionais.length,
					adicionais_ativos_count: adicionaisAtivos.length,
					preco_minimo: precos.length > 0 ? Math.min(...precos) : undefined,
					preco_maximo: precos.length > 0 ? Math.max(...precos) : undefined,
					status_display: grupo.ativo ? "Ativo" : "Inativo",
					obrigatorio_display: grupo.obrigatorio ? "Obrigatório" : "Opcional",
					selecao_display: `Min: ${grupo.min_selecao} | Max: ${grupo.max_selecao}`,
					pode_excluir: adicionais.length === 0,
				} as GrupoAdicionalComputado;
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao buscar grupos de adicionais";
			error.value = message;
			console.error("[useGruposAdicionaisFetch] Erro:", message);
			gruposAdicionais.value = [];
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
		gruposAdicionais,
		loading,
		error,
		fetch,
		refresh,
	};
};
