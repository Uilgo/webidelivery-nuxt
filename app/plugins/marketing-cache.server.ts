/**
 * 📌 Plugin de Cache de Marketing (Server-side)
 *
 * Busca os dados de marketing (cupons e banners) NO SERVIDOR e popula o useState.
 * Quando o cliente hidrata, os dados já estão disponíveis = carregamento instantâneo.
 *
 * IMPORTANTE: Os dados são protegidos por RLS, então só carrega se o usuário estiver autenticado.
 */

import type { CupomCompleto, BannerCompleto } from "#shared/types/marketing";

export default defineNuxtPlugin(async () => {
	// Só executar no server-side
	if (!import.meta.server) return;

	// Só carregar dados de marketing na rota de marketing
	const route = useRoute();
	if (!route.path.includes("/admin/marketing")) return;

	const user = useSupabaseUser();
	const userId = user.value?.id ?? (user.value as { sub?: string } | null)?.sub;

	// Se não há usuário logado, não carregar dados de marketing
	if (!userId) return;

	const supabase = useSupabaseClient();

	// Inicializar os estados globais
	const cupons = useState<CupomCompleto[]>("marketing-cupons", () => []);
	useState<boolean>("marketing-cupons-loading", () => false);
	const cuponsCacheLoaded = useState<boolean>("marketing-cupons-cache-loaded", () => false);

	const banners = useState<BannerCompleto[]>("marketing-banners", () => []);
	useState<boolean>("marketing-banners-loading", () => false);
	const bannersCacheLoaded = useState<boolean>("marketing-banners-cache-loaded", () => false);

	// Estado global de loading do marketing
	const marketingCacheLoaded = useState<boolean>("marketing-cache-loaded", () => false);

	// Estados do useMarketing para contadores das tabs
	const tabData = useState<Record<string, unknown[]>>("marketing-tab-data", () => ({
		cupons: [],
		banners: [],
	}));

	try {
		// Buscar estabelecimento_id do usuário
		const { data: perfil } = await supabase
			.from("perfis")
			.select("estabelecimento_id")
			.eq("id", userId)
			.single();

		if (!perfil?.estabelecimento_id) {
			console.warn("[MarketingCache] Estabelecimento não encontrado");
			cuponsCacheLoaded.value = true;
			bannersCacheLoaded.value = true;
			marketingCacheLoaded.value = true;
			return;
		}

		const estabelecimentoId = perfil.estabelecimento_id;

		// Buscar cupons e banners em paralelo
		const [cuponsRes, bannersRes] = await Promise.all([
			// Cupons com estatísticas de uso
			supabase
				.from("cupons")
				.select(
					`
					*,
					estabelecimentos!inner(nome)
				`,
				)
				.eq("estabelecimento_id", estabelecimentoId)
				.order("created_at", { ascending: false }),

			// Banners ordenados por ordem
			supabase
				.from("banners")
				.select(
					`
					*,
					estabelecimentos!inner(nome)
				`,
				)
				.eq("estabelecimento_id", estabelecimentoId)
				.order("ordem", { ascending: true }),
		]);

		// Processar cupons
		if (!cuponsRes.error && cuponsRes.data) {
			const processedCupons = cuponsRes.data.map((cupom) => ({
				...cupom,
				estabelecimento_nome: cupom.estabelecimentos.nome,
			})) as CupomCompleto[];
			cupons.value = processedCupons;
			// Atualizar tabData para contadores
			tabData.value.cupons = processedCupons;
		}
		cuponsCacheLoaded.value = true;

		// Processar banners
		if (!bannersRes.error && bannersRes.data) {
			const processedBanners = bannersRes.data.map((banner) => ({
				...banner,
				estabelecimento_nome: banner.estabelecimentos.nome,
			})) as BannerCompleto[];
			banners.value = processedBanners;
			// Atualizar tabData para contadores
			tabData.value.banners = processedBanners;
		}
		bannersCacheLoaded.value = true;

		// Marcar cache geral como carregado
		marketingCacheLoaded.value = true;
	} catch (error) {
		console.error("[MarketingCache] Erro ao carregar dados:", error);
		// Mesmo com erro, marcar como carregado para não bloquear a UI
		cuponsCacheLoaded.value = true;
		bannersCacheLoaded.value = true;
		marketingCacheLoaded.value = true;
	}
});
