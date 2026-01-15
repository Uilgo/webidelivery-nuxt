/**
 * 📌 useCombosFetch
 *
 * Composable responsável pela busca de combos (READ via RLS).
 * Usa useState que é populado pelo plugin de servidor para carregamento instantâneo.
 *
 * ESTRATÉGIA:
 * - Plugin server carrega dados no SSR → useState já tem dados na hidratação
 * - Cliente: se não tem dados do SSR, tenta localStorage
 * - Fetch só acontece se não tiver dados de nenhuma fonte
 */

import type { Combo } from "../../../types/combo";

const CACHE_KEY = "cardapio_combos";

/**
 * Lê dados do localStorage (client-side only)
 */
const getFromStorage = (): Combo[] => {
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
const saveToStorage = (data: Combo[]): void => {
	if (import.meta.server) return;
	try {
		localStorage.setItem(CACHE_KEY, JSON.stringify(data));
	} catch {
		// Ignora erros de storage
	}
};

export const useCombosFetch = () => {
	const supabase = useSupabaseClient();
	const user = useSupabaseUser();

	// Estado global - pode já ter dados do plugin de servidor
	const combos = useState<Combo[]>("combos", () => []);
	const isLoading = useState<boolean>("combos-loading", () => false);
	const cacheLoaded = useState<boolean>("combos-cache-loaded", () => false);
	const error = ref<unknown>(null);

	const fetchCombos = async (): Promise<void> => {
		if (!user.value) {
			error.value = "Usuário não autenticado";
			return;
		}

		isLoading.value = true;
		error.value = null;

		try {
			const { data, error: fetchError } = await supabase
				.from("combos")
				.select("*")
				.order("ordem", { ascending: true });

			if (fetchError) throw fetchError;

			const newData = (data || []) as Combo[];
			combos.value = newData;
			saveToStorage(newData);
			cacheLoaded.value = true;
		} catch (err) {
			error.value = err instanceof Error ? err.message : "Erro ao buscar combos";
		} finally {
			isLoading.value = false;
		}
	};

	const refresh = () => fetchCombos();

	const init = async (): Promise<void> => {
		// Se já tem dados (do plugin de servidor), não faz nada
		if (combos.value.length > 0) {
			isLoading.value = false;
			cacheLoaded.value = true;
			// Salva no localStorage para backup
			if (import.meta.client) {
				saveToStorage(combos.value);
			}
			return;
		}

		// No cliente, tenta carregar do localStorage
		if (import.meta.client && !cacheLoaded.value) {
			const cachedData = getFromStorage();
			if (cachedData.length > 0) {
				combos.value = cachedData;
				isLoading.value = false;
				cacheLoaded.value = true;
				return;
			}
		}

		// Sem dados de nenhuma fonte - faz fetch
		await fetchCombos();
	};

	return {
		combos,
		isLoading,
		error,
		fetchCombos,
		refresh,
		init,
	};
};
