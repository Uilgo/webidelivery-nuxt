/**
 * 📌 useCombosFetch
 *
 * Composable responsável pela busca de combos (READ via RLS).
 * Gerencia estado de loading, erro e dados dos combos.
 */

import type { Combo } from "../../../types/combo";

export const useCombosFetch = () => {
	// Estado global compartilhado
	const combos = useState<Combo[]>("combos", () => []);
	const isLoading = ref(false);
	const error = ref<string | null>(null);

	const supabase = useSupabaseClient();
	const user = useSupabaseUser();

	/**
	 * Buscar combos do estabelecimento via RLS
	 */
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

			combos.value = (data || []) as Combo[];
		} catch (err) {
			error.value = err instanceof Error ? err.message : "Erro ao buscar combos";
		} finally {
			isLoading.value = false;
		}
	};

	/**
	 * Refresh (alias para fetchCombos)
	 */
	const refresh = () => fetchCombos();

	/**
	 * Inicializar (buscar dados na montagem)
	 */
	const init = async (): Promise<void> => {
		if (combos.value.length === 0) {
			await fetchCombos();
		}
	};

	return {
		// Estado
		combos,
		isLoading,
		error,

		// Métodos
		fetchCombos,
		refresh,
		init,
	};
};
