/**
 * 📌 Plugin de Cache de Equipe (Server-side)
 *
 * Busca os dados de equipe (membros e convites) NO SERVIDOR e popula o useState.
 * Quando o cliente hidrata, os dados já estão disponíveis = carregamento instantâneo.
 *
 * IMPORTANTE: Os dados são protegidos por RLS, então só carrega se o usuário estiver autenticado.
 */

import type { Membro, Convite } from "~/features/admin/equipe/types/equipe";

export default defineNuxtPlugin(async () => {
	// Só executar no server-side
	if (!import.meta.server) return;

	// Só carregar dados de equipe na rota de equipe
	const route = useRoute();
	if (!route.path.includes("/admin/equipe")) return;

	const user = useSupabaseUser();
	const userId = user.value?.id ?? (user.value as { sub?: string } | null)?.sub;

	// Se não há usuário logado, não carregar dados de equipe
	if (!userId) return;

	const supabase = useSupabaseClient();

	// Inicializar os estados globais
	const membros = useState<Membro[]>("equipe.membros", () => []);
	useState<boolean>("equipe.membros.loading", () => false);
	const membrosCacheLoaded = useState<boolean>("equipe-membros-cache-loaded", () => false);

	const convites = useState<Convite[]>("equipe.convites", () => []);
	useState<boolean>("equipe.convites.loading", () => false);
	const convitesCacheLoaded = useState<boolean>("equipe-convites-cache-loaded", () => false);

	// Estado global de loading da equipe
	const equipeCacheLoaded = useState<boolean>("equipe-cache-loaded", () => false);

	try {
		// Buscar estabelecimento_id do usuário
		const { data: perfil } = await supabase
			.from("perfis")
			.select("estabelecimento_id")
			.eq("id", userId)
			.single();

		if (!perfil?.estabelecimento_id) {
			console.warn("[EquipeCache] Estabelecimento não encontrado");
			membrosCacheLoaded.value = true;
			convitesCacheLoaded.value = true;
			equipeCacheLoaded.value = true;
			return;
		}

		const estabelecimentoId = perfil.estabelecimento_id;

		// Buscar membros e convites em paralelo
		const [membrosRes, convitesRes] = await Promise.all([
			// Membros da equipe
			supabase
				.from("perfis")
				.select("*")
				.eq("estabelecimento_id", estabelecimentoId)
				.order("created_at", { ascending: false }),

			// Convites pendentes
			supabase
				.from("codigos_convite")
				.select("*")
				.eq("estabelecimento_id", estabelecimentoId)
				.eq("tipo", "membro_equipe")
				.eq("usado", false)
				.order("created_at", { ascending: false }),
		]);

		// Processar membros
		if (!membrosRes.error && membrosRes.data) {
			membros.value = membrosRes.data as Membro[];
		}
		membrosCacheLoaded.value = true;

		// Processar convites
		if (!convitesRes.error && convitesRes.data) {
			// Buscar nomes dos criadores dos convites
			const criadoresIds = [...new Set(convitesRes.data.map((c) => c.criado_por).filter(Boolean))];

			if (criadoresIds.length > 0) {
				const { data: criadoresData } = await supabase
					.from("perfis")
					.select("id, nome, sobrenome")
					.in("id", criadoresIds);

				// Criar mapa de criadores
				const criadoresMap = new Map(
					(criadoresData || []).map((criador) => [
						criador.id,
						`${criador.nome} ${criador.sobrenome}`,
					]),
				);

				// Mapear convites com nomes dos criadores
				convites.value = convitesRes.data.map((convite) => ({
					...convite,
					criador_nome: convite.criado_por ? criadoresMap.get(convite.criado_por) : undefined,
				})) as Convite[];
			} else {
				convites.value = convitesRes.data as Convite[];
			}
		}
		convitesCacheLoaded.value = true;

		// Marcar cache geral como carregado
		equipeCacheLoaded.value = true;
	} catch (error) {
		console.error("[EquipeCache] Erro ao carregar dados:", error);
		// Mesmo com erro, marcar como carregado para não bloquear a UI
		membrosCacheLoaded.value = true;
		convitesCacheLoaded.value = true;
		equipeCacheLoaded.value = true;
	}
});
