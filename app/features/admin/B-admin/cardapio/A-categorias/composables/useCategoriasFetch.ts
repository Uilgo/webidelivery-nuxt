/**
 * 📌 useCategoriasFetch - Busca de Categorias do Supabase
 *
 * Responsável por:
 * - Buscar lista de categorias do estabelecimento com dados computados
 * - Usa useState que é populado pelo plugin de servidor para carregamento instantâneo
 * - Salva no localStorage como backup para navegação client-side
 *
 * ESTRATÉGIA:
 * - Plugin server carrega dados no SSR → useState já tem dados na hidratação
 * - Cliente: se não tem dados do SSR, tenta localStorage
 * - Fetch só acontece se não tiver dados de nenhuma fonte
 */

import type { Categoria, CategoriaComputada } from "../../../types/categoria";
import { useEstabelecimentoStore } from "~/stores/estabelecimento";

const CACHE_KEY = "cardapio_categorias";

/**
 * Lê dados do localStorage (client-side only)
 */
const getFromStorage = (): CategoriaComputada[] => {
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
const saveToStorage = (data: CategoriaComputada[]): void => {
	if (import.meta.server) return;
	try {
		localStorage.setItem(CACHE_KEY, JSON.stringify(data));
	} catch {
		// Ignora erros de storage
	}
};

export interface UseCategoriasFetchReturn {
	categorias: Ref<CategoriaComputada[]>;
	loading: Ref<boolean>;
	error: Ref<unknown>;
	fetch: () => Promise<void>;
	refresh: () => Promise<void>;
	init: () => Promise<void>;
}

export const useCategoriasFetch = (): UseCategoriasFetchReturn => {
	const supabase = useSupabaseClient();
	const estabelecimentoStore = useEstabelecimentoStore();

	// Estado global - pode já ter dados do plugin de servidor
	const categorias = useState<CategoriaComputada[]>("categorias", () => []);
	const loading = useState<boolean>("categorias-loading", () => false);
	const cacheLoaded = useState<boolean>("categorias-cache-loaded", () => false);
	const error = ref<unknown>(null);

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
			const { data, error: fetchError } = await supabase
				.from("categorias")
				.select(`*, produtos:produtos(count)`)
				.eq("estabelecimento_id", estabelecimentoId)
				.order("ordem", { ascending: true });

			if (fetchError) {
				throw fetchError;
			}

			const newData = ((data as unknown[]) ?? []).map((cat: unknown) => {
				const categoria = cat as Categoria & { produtos: Array<{ count: number }> };
				const produtos_count = categoria.produtos?.[0]?.count ?? 0;

				return {
					...categoria,
					produtos_count,
					status_display: categoria.ativo ? "Ativa" : "Inativa",
					pode_excluir: produtos_count === 0,
				} as CategoriaComputada;
			});

			categorias.value = newData;
			saveToStorage(newData);
			cacheLoaded.value = true;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao buscar categorias";
			error.value = message;
			console.error("[useCategoriasFetch] Erro:", message);
		} finally {
			loading.value = false;
		}
	};

	const refresh = async (): Promise<void> => {
		await fetch();
	};

	const init = async (): Promise<void> => {
		// Se já tem dados (do plugin de servidor), não faz nada
		if (categorias.value.length > 0) {
			loading.value = false;
			cacheLoaded.value = true;
			// Salva no localStorage para backup
			if (import.meta.client) {
				saveToStorage(categorias.value);
			}
			return;
		}

		// No cliente, tenta carregar do localStorage
		if (import.meta.client && !cacheLoaded.value) {
			const cachedData = getFromStorage();
			if (cachedData.length > 0) {
				categorias.value = cachedData;
				loading.value = false;
				cacheLoaded.value = true;
				return;
			}
		}

		// Sem dados de nenhuma fonte - faz fetch
		await fetch();
	};

	return {
		categorias,
		loading,
		error,
		fetch,
		refresh,
		init,
	};
};
