/**
 * 📌 usePedidosFetch - Busca de Pedidos do Supabase
 *
 * Responsável por:
 * - Buscar lista de pedidos do estabelecimento
 * - Polling automático para atualização em tempo real
 * - Cache em useState para persistência durante navegação
 */

import type { PedidoCompleto } from "~/features/admin/pedidos/types/pedidos-admin";

export interface UsePedidosFetchReturn {
	pedidos: Ref<PedidoCompleto[]>;
	loading: Ref<boolean>;
	error: Ref<string | null>;
	fetch: () => Promise<void>;
	refresh: () => Promise<void>;
	init: () => Promise<void>;
	startPolling: (intervalMs?: number) => void;
	stopPolling: () => void;
}

export const usePedidosFetch = (): UsePedidosFetchReturn => {
	const supabase = useSupabaseClient();

	// Estado global - persiste durante navegação
	const pedidos = useState<PedidoCompleto[]>("admin-pedidos", () => []);
	const loading = useState<boolean>("admin-pedidos-loading", () => false);
	const error = useState<string | null>("admin-pedidos-erro", () => null);
	const cacheLoaded = useState<boolean>("admin-pedidos-cache-loaded", () => false);

	// Referência do intervalo de polling
	const intervalId = ref<NodeJS.Timeout | null>(null);

	/**
	 * Busca pedidos com RLS
	 * RLS garante que só vê pedidos do seu estabelecimento
	 *
	 * IMPORTANTE: Busca TODOS os pedidos e filtra no client-side
	 * para manter o cache completo e evitar perda de dados ao trocar tabs
	 */
	const fetch = async (): Promise<void> => {
		// Se já foi carregado (mesmo que vazio), não mostrar loading
		if (cacheLoaded.value) {
			loading.value = false;
		} else {
			loading.value = true;
		}

		error.value = null;

		try {
			const query = supabase
				.from("pedidos")
				.select(
					`
          *,
          itens:pedido_itens(
            *,
            adicionais:pedido_itens_adicionais(*)
          )
        `,
				)
				.order("created_at", { ascending: false });

			const { data, error: fetchError } = await query;

			if (fetchError) {
				throw fetchError;
			}

			pedidos.value = (data || []) as PedidoCompleto[];
			cacheLoaded.value = true;
		} catch (err) {
			error.value = "Erro ao buscar pedidos";
			console.error("[usePedidosFetch] Erro:", err);
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Refresh - alias para fetch
	 */
	const refresh = async (): Promise<void> => {
		await fetch();
	};

	/**
	 * Inicializa o composable
	 * Se já tem dados em cache OU já foi carregado (mesmo vazio), não faz fetch
	 */
	const init = async (): Promise<void> => {
		// Se já tem dados em cache, não faz nada
		if (pedidos.value.length > 0 && cacheLoaded.value) {
			loading.value = false;
			return;
		}

		// Se já foi carregado (mesmo que vazio), não carregar novamente
		if (cacheLoaded.value) {
			loading.value = false;
			return;
		}

		// Sem dados - faz fetch
		await fetch();
	};

	/**
	 * Inicia polling automático
	 */
	const startPolling = (intervalMs: number = 10000): void => {
		// Para polling anterior se existir
		stopPolling();

		// Busca inicial
		fetch();

		// Inicia novo polling
		intervalId.value = setInterval(() => {
			fetch();
		}, intervalMs);
	};

	/**
	 * Para polling automático
	 */
	const stopPolling = (): void => {
		if (intervalId.value) {
			clearInterval(intervalId.value);
			intervalId.value = null;
		}
	};

	return {
		pedidos,
		loading,
		error,
		fetch,
		refresh,
		init,
		startPolling,
		stopPolling,
	};
};
