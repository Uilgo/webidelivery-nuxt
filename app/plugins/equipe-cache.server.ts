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

			// Convites pendentes com JOIN para buscar criador em uma única query
			supabase
				.from("codigos_convite")
				.select(
					`
					*,
					criador:perfis!criado_por(id, nome, sobrenome)
				`,
				)
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

		// Processar convites (agora com criador já incluído via JOIN)
		if (!convitesRes.error && convitesRes.data) {
			convites.value = convitesRes.data.map((convite) => ({
				...convite,
				criador_nome: convite.criador
					? `${convite.criador.nome} ${convite.criador.sobrenome}`
					: undefined,
			})) as Convite[];
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
