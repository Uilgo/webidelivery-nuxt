/**
 * 📌 Plugin de Cache de Pedidos (Server-side)
 *
 * Busca os dados dos pedidos NO SERVIDOR e popula o useState.
 * Quando o cliente hidrata, os dados já estão disponíveis = carregamento instantâneo.
 *
 * IMPORTANTE: Os dados são protegidos por RLS, então só carrega se o usuário estiver autenticado.
 */

import type { PedidoCompleto } from "~/features/admin/pedidos/types/pedidos-admin";

export default defineNuxtPlugin(async () => {
	// Só executar no server-side
	if (!import.meta.server) return;

	// Só carregar dados de pedidos na rota de pedidos
	const route = useRoute();
	if (!route.path.includes("/admin/pedidos")) return;

	const user = useSupabaseUser();
	const userId = user.value?.id ?? (user.value as { sub?: string } | null)?.sub;

	// Se não há usuário logado, não carregar dados de pedidos
	if (!userId) return;

	const supabase = useSupabaseClient();

	// Inicializar os estados globais
	const pedidos = useState<PedidoCompleto[]>("admin-pedidos", () => []);
	useState<boolean>("admin-pedidos-loading", () => false);
	const pedidosCacheLoaded = useState<boolean>("admin-pedidos-cache-loaded", () => false);

	try {
		// Buscar estabelecimento_id do usuário
		const { data: perfil } = await supabase
			.from("perfis")
			.select("estabelecimento_id")
			.eq("id", userId)
			.single();

		if (!perfil?.estabelecimento_id) {
			console.warn("[PedidosCache] Estabelecimento não encontrado");
			pedidosCacheLoaded.value = true; // Marcar como carregado mesmo sem dados
			return;
		}

		const estabelecimentoId = perfil.estabelecimento_id;

		// Buscar pedidos com RLS (últimos 50 pedidos para performance)
		const { data, error } = await supabase
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
			.eq("estabelecimento_id", estabelecimentoId)
			.order("created_at", { ascending: false })
			.limit(50);

		if (!error && data) {
			pedidos.value = data as PedidoCompleto[];
		}

		// SEMPRE marcar como carregado, mesmo se não houver dados
		pedidosCacheLoaded.value = true;
	} catch (error) {
		console.error("[PedidosCache] Erro ao carregar dados:", error);
		// Mesmo com erro, marcar como carregado para não bloquear a UI
		pedidosCacheLoaded.value = true;
	}
});
