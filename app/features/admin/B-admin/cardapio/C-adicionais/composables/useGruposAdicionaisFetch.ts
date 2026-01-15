/**
 * 📌 useGruposAdicionaisFetch - Busca de Grupos de Adicionais
 *
 * Responsável por:
 * - Buscar grupos de adicionais do Supabase
 * - Computar campos adicionais (contadores, preços)
 * - Usa useState que é populado pelo plugin de servidor para carregamento instantâneo
 *
 * ESTRATÉGIA:
 * - Plugin server carrega dados no SSR → useState já tem dados na hidratação
 * - Cliente: se não tem dados do SSR, tenta localStorage
 * - Fetch só acontece se não tiver dados de nenhuma fonte
 */

import type { GrupoAdicionalComputado } from "../../../types/adicional";

const CACHE_KEY = "cardapio_grupos_adicionais";

/**
 * Lê dados do localStorage (client-side only)
 */
const getFromStorage = (): GrupoAdicionalComputado[] => {
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
const saveToStorage = (data: GrupoAdicionalComputado[]): void => {
	if (import.meta.server) return;
	try {
		localStorage.setItem(CACHE_KEY, JSON.stringify(data));
	} catch {
		// Ignora erros de storage
	}
};

export interface UseGruposAdicionaisFetchReturn {
	gruposAdicionais: Ref<GrupoAdicionalComputado[]>;
	loading: Ref<boolean>;
	error: Ref<unknown>;
	fetch: () => Promise<void>;
	refresh: () => Promise<void>;
	init: () => Promise<void>;
}

export const useGruposAdicionaisFetch = (): UseGruposAdicionaisFetchReturn => {
	const supabase = useSupabaseClient();

	// Estado global - pode já ter dados do plugin de servidor
	const gruposAdicionais = useState<GrupoAdicionalComputado[]>("grupos-adicionais", () => []);
	const loading = useState<boolean>("grupos-adicionais-loading", () => false);
	const cacheLoaded = useState<boolean>("grupos-adicionais-cache-loaded", () => false);
	const error = ref<unknown>(null);

	const fetch = async (): Promise<void> => {
		loading.value = true;
		error.value = null;

		try {
			const { data: grupos, error: gruposError } = await supabase
				.from("grupos_adicionais")
				.select(
					`
					*,
					adicionais (id, nome, preco, ativo)
				`,
				)
				.order("ordem", { ascending: true });

			if (gruposError) {
				throw gruposError;
			}

			if (!grupos) {
				gruposAdicionais.value = [];
				saveToStorage([]);
				cacheLoaded.value = true;
				return;
			}

			const newData = grupos.map((grupo) => {
				const adicionais = grupo.adicionais || [];
				const adicionaisAtivos = adicionais.filter((a: { ativo: boolean }) => a.ativo);
				const precos = adicionais
					.map((a: { preco: number }) => a.preco)
					.filter((p: number) => p > 0);

				return {
					...grupo,
					adicionais,
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

			gruposAdicionais.value = newData;
			saveToStorage(newData);
			cacheLoaded.value = true;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao buscar grupos de adicionais";
			error.value = message;
			console.error("[useGruposAdicionaisFetch] Erro:", message);
			gruposAdicionais.value = [];
		} finally {
			loading.value = false;
		}
	};

	const refresh = async (): Promise<void> => {
		await fetch();
	};

	const init = async (): Promise<void> => {
		// Se já tem dados (do plugin de servidor), não faz nada
		if (gruposAdicionais.value.length > 0) {
			loading.value = false;
			cacheLoaded.value = true;
			// Salva no localStorage para backup
			if (import.meta.client) {
				saveToStorage(gruposAdicionais.value);
			}
			return;
		}

		// No cliente, tenta carregar do localStorage
		if (import.meta.client && !cacheLoaded.value) {
			const cachedData = getFromStorage();
			if (cachedData.length > 0) {
				gruposAdicionais.value = cachedData;
				loading.value = false;
				cacheLoaded.value = true;
				return;
			}
		}

		// Sem dados de nenhuma fonte - faz fetch
		await fetch();
	};

	return {
		gruposAdicionais,
		loading,
		error,
		fetch,
		refresh,
		init,
	};
};
