/**
 * 📌 useBanners - Gerenciamento de Banners
 *
 * Responsável por:
 * - CRUD de banners via RPC
 * - Leitura via RLS
 * - Ordenação direta
 * - Preview em tempo real
 * - Upload de imagens
 * - Filtros e busca
 * - Validação de limites (3-8 banners)
 */

import { useToast } from "~/composables/ui/useToast";
import type { BannerCompleto, BannerFormData, TipoBanner } from "#shared/types/marketing";
import type { BannerFilters, BannerPreview } from "../types/marketing";
import { useMarketing } from "./useMarketing";

/**
 * Limites recomendados de banners baseados em pesquisas de UX
 * Fonte: Nielsen Norman Group, Baymard Institute
 */
export const BANNER_LIMITS = {
	MIN: 3, // Mínimo para ter rotação e variedade
	IDEAL: 5, // Recomendado para melhor UX e engagement
	MAX: 8, // Limite máximo antes de prejudicar a experiência
} as const;

/** Interface de retorno do composable */
export interface UseBannersReturn {
	// Estado
	banners: Ref<BannerCompleto[]>;
	loading: Readonly<Ref<boolean>>;
	error: Readonly<Ref<string | null>>;

	// Estatísticas
	bannersCount: ComputedRef<number>;
	bannersAtivos: ComputedRef<number>;
	bannersPorTipo: ComputedRef<Record<TipoBanner, number>>;

	// Validações de limites
	canCreateBanner: ComputedRef<boolean>;
	isAtMinimum: ComputedRef<boolean>;
	isAtIdeal: ComputedRef<boolean>;
	isAtMaximum: ComputedRef<boolean>;
	bannerLimitStatus: ComputedRef<"below-min" | "optimal" | "at-max" | "over-max">;

	// CRUD
	createBanner: (data: BannerFormData) => Promise<void>;
	updateBanner: (id: string, data: BannerFormData) => Promise<void>;
	deleteBanner: (id: string) => Promise<void>;
	toggleBannerStatus: (id: string) => Promise<void>;

	// Ordenação
	reorderBanner: (id: string, newOrder: number) => Promise<void>;

	// Upload
	uploadBannerImage: (file: File) => Promise<string>;

	// Filtros
	filteredBanners: ComputedRef<BannerCompleto[]>;
	applyFilters: (filters: BannerFilters) => void;

	// Utilitários
	refreshBanners: () => Promise<void>;
	duplicateBanner: (id: string) => Promise<void>;
	generateBannerPreview: (data: BannerFormData) => BannerPreview;
	getBannerById: (id: string) => ComputedRef<BannerCompleto | undefined>;
}

export const useBanners = (): UseBannersReturn => {
	const toast = useToast();
	const supabase = useSupabaseClient();

	// Integração com useMarketing para atualizar contadores das tabs
	const { setTabData } = useMarketing();

	// ========================================
	// ESTADO REATIVO (usando useState para SSR)
	// ========================================

	const banners = useState<BannerCompleto[]>("marketing-banners", () => []);
	const loading = useState<boolean>("marketing-banners-loading", () => false);
	const error = ref<string | null>(null);
	const currentFilters = ref<BannerFilters>({});
	const cacheLoaded = useState<boolean>("marketing-banners-cache-loaded", () => false);

	// ========================================
	// COMPUTADAS - ESTATÍSTICAS
	// ========================================

	const bannersCount = computed(() => banners.value.length);

	const bannersAtivos = computed(() => banners.value.filter((banner) => banner.ativo).length);

	const bannersPorTipo = computed(() => {
		const tipos: Record<TipoBanner, number> = {
			carrossel: 0,
		};

		banners.value.forEach((banner) => {
			tipos[banner.tipo]++;
		});

		return tipos;
	});

	// ========================================
	// COMPUTADAS - VALIDAÇÕES DE LIMITES
	// ========================================

	/**
	 * Verifica se pode criar novo banner (não atingiu o máximo)
	 */
	const canCreateBanner = computed(() => bannersCount.value < BANNER_LIMITS.MAX);

	/**
	 * Verifica se está no mínimo recomendado
	 */
	const isAtMinimum = computed(() => bannersCount.value >= BANNER_LIMITS.MIN);

	/**
	 * Verifica se está no número ideal
	 */
	const isAtIdeal = computed(() => bannersCount.value === BANNER_LIMITS.IDEAL);

	/**
	 * Verifica se atingiu o máximo
	 */
	const isAtMaximum = computed(() => bannersCount.value >= BANNER_LIMITS.MAX);

	/**
	 * Status atual em relação aos limites
	 */
	const bannerLimitStatus = computed<"below-min" | "optimal" | "at-max" | "over-max">(() => {
		const count = bannersCount.value;

		if (count < BANNER_LIMITS.MIN) return "below-min";
		if (count >= BANNER_LIMITS.MIN && count <= BANNER_LIMITS.IDEAL) return "optimal";
		if (count > BANNER_LIMITS.IDEAL && count < BANNER_LIMITS.MAX) return "at-max";
		return "over-max";
	});

	// ========================================
	// COMPUTADAS - FILTROS
	// ========================================

	const filteredBanners = computed(() => {
		let result = [...banners.value];

		// Filtro por status (ativo/inativo)
		if (currentFilters.value.status) {
			const isActive = currentFilters.value.status === "ativo";
			result = result.filter((banner) => banner.ativo === isActive);
		}

		// Filtro por tipo de conteúdo (imagem/texto)
		if (currentFilters.value.tipo_conteudo) {
			result = result.filter(
				(banner) => banner.tipo_conteudo === currentFilters.value.tipo_conteudo,
			);
		}

		// Ordenar por ordem (padrão)
		return result.sort((a, b) => a.ordem - b.ordem);
	});

	// ========================================
	// UTILITÁRIOS
	// ========================================

	/**
	 * Busca banner por ID
	 */
	const getBannerById = (id: string): ComputedRef<BannerCompleto | undefined> => {
		return computed(() => banners.value.find((banner) => banner.id === id));
	};

	/**
	 * Gera preview do banner baseado nos dados do formulário
	 */
	const generateBannerPreview = (data: BannerFormData): BannerPreview => {
		return {
			titulo: data.titulo,
			descricao: data.descricao,
			tipo: data.tipo,
			tipo_conteudo: data.tipo_conteudo,
			imagem_url: data.imagem_url,
			cor_fundo: data.cor_fundo,
			cor_texto: data.cor_texto,
			texto_cta: data.texto_cta,
			texto_posicao: data.texto_posicao,
			texto_cor_fundo: data.texto_cor_fundo,
		};
	};

	// ========================================
	// CRUD OPERATIONS
	// ========================================

	/**
	 * Busca todos os banners via RLS
	 */
	const fetchBanners = async (): Promise<void> => {
		// Se já carregou do cache, não buscar novamente
		if (cacheLoaded.value) {
			return;
		}

		try {
			loading.value = true;
			error.value = null;

			const { data, error: supabaseError } = await supabase
				.from("banners")
				.select(
					`
					*,
					estabelecimentos!inner(nome)
				`,
				)
				.order("ordem", { ascending: true });

			if (supabaseError) {
				throw supabaseError;
			}

			// Transformar dados para o formato esperado
			banners.value = (data || []).map((banner) => ({
				...banner,
				estabelecimento_nome: banner.estabelecimentos.nome,
			}));

			// Atualizar dados no useMarketing para contadores das tabs
			setTabData("banners", banners.value);
			cacheLoaded.value = true;
		} catch {
			error.value = "Erro ao carregar banners";
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Cria novo banner via RPC
	 */
	const createBanner = async (data: BannerFormData): Promise<void> => {
		try {
			// Validar limite máximo
			if (!canCreateBanner.value) {
				toast.warning({
					title: "Limite atingido",
					description: `Você já possui ${bannersCount.value} banners. O máximo recomendado é ${BANNER_LIMITS.MAX}.`,
				});
				throw new Error("Limite máximo de banners atingido");
			}

			loading.value = true;
			error.value = null;

			// Obter estabelecimento_id do usuário atual
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (!user) {
				throw new Error("Usuário não autenticado");
			}

			// Buscar perfil do usuário para obter estabelecimento_id
			const { data: perfil, error: perfilError } = await supabase
				.from("perfis")
				.select("estabelecimento_id")
				.eq("id", user.id)
				.single();

			if (perfilError || !perfil?.estabelecimento_id) {
				throw new Error("Estabelecimento não encontrado");
			}

			const { data: _bannerId, error: supabaseError } = await supabase.rpc("fn_banners_criar", {
				p_estabelecimento_id: perfil.estabelecimento_id,
				p_titulo: data.titulo,
				p_descricao: data.descricao || null,
				p_tipo: data.tipo,
				p_tipo_conteudo: data.tipo_conteudo,
				p_imagem_url: data.imagem_url || null,
				p_link_url: data.link_url || null,
				p_cor_fundo: data.cor_fundo || "#3b82f6",
				p_cor_texto: data.cor_texto || "#ffffff",
				p_texto_cta: data.texto_cta || null,
				p_texto_posicao: data.texto_posicao || "centro",
				p_texto_cor_fundo: data.texto_cor_fundo || null,
			});

			if (supabaseError) {
				throw supabaseError;
			}

			// Invalidar cache e recarregar lista de banners
			cacheLoaded.value = false;
			await fetchBanners();

			toast.success({ title: "Banner criado com sucesso!" });
		} catch (err) {
			error.value = "Erro ao criar banner";
			toast.error({ title: "Erro ao criar banner" });
			throw err;
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Atualiza banner existente via RPC
	 */
	const updateBanner = async (id: string, data: BannerFormData): Promise<void> => {
		try {
			loading.value = true;
			error.value = null;

			const { data: response, error: supabaseError } = await supabase.rpc("fn_banners_atualizar", {
				p_banner_id: id,
				p_titulo: data.titulo,
				p_descricao: data.descricao,
				p_imagem_url: data.imagem_url,
				p_link_url: data.link_url,
				p_texto_cta: data.texto_cta,
				p_tipo: data.tipo,
				p_tipo_conteudo: data.tipo_conteudo,
				p_cor_fundo: data.cor_fundo,
				p_cor_texto: data.cor_texto,
				p_texto_posicao: data.texto_posicao,
				p_texto_cor_fundo: data.texto_cor_fundo,
				p_ativo: true, // Manter ativo na atualização
				p_configuracoes: {}, // Configurações padrão vazias
			});

			if (supabaseError) {
				throw supabaseError;
			}

			if (response && response.length > 0) {
				const index = banners.value.findIndex((banner) => banner.id === id);
				if (index !== -1) {
					banners.value[index] = response[0];
				}
			}

			toast.success({ title: "Banner atualizado com sucesso!" });
		} catch (err) {
			error.value = "Erro ao atualizar banner";
			toast.error({ title: "Erro ao atualizar banner" });
			throw err;
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Exclui banner via RPC
	 */
	const deleteBanner = async (id: string): Promise<void> => {
		try {
			loading.value = true;
			error.value = null;

			// A função retorna boolean, não precisa de destructuring de data
			const { data, error: supabaseError } = await supabase.rpc("fn_banners_excluir", {
				p_banner_id: id,
			});

			if (supabaseError) {
				console.error("❌ Erro do Supabase:", supabaseError);
				throw supabaseError;
			}

			// Verificar se a exclusão foi bem-sucedida
			if (data === true) {
				// Remover banner da lista local
				banners.value = banners.value.filter((banner) => banner.id !== id);
				toast.success({ title: "Banner excluído com sucesso!" });
			} else {
				throw new Error("Falha ao excluir banner");
			}
		} catch (err) {
			console.error("❌ Erro ao excluir banner:", err);
			error.value = "Erro ao excluir banner";
			toast.error({ title: "Erro ao excluir banner" });
			throw err;
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Alterna status do banner (ativo/inativo) via RPC
	 */
	const toggleBannerStatus = async (id: string): Promise<void> => {
		try {
			const { data: response, error: supabaseError } = await supabase.rpc(
				"fn_banners_toggle_ativo",
				{
					p_banner_id: id,
				},
			);

			if (supabaseError) {
				throw supabaseError;
			}

			if (response && response.length > 0) {
				const index = banners.value.findIndex((b) => b.id === id);
				if (index !== -1) {
					banners.value[index] = response[0];
				}

				const status = response[0].ativo ? "ativado" : "desativado";
				toast.success({ title: `Banner ${status} com sucesso!` });
			}
		} catch (err) {
			error.value = "Erro ao alterar status do banner";
			toast.error({ title: "Erro ao alterar status do banner" });
			throw err;
		}
	};

	/**
	 * Duplica banner existente via RPC
	 */
	const duplicateBanner = async (id: string): Promise<void> => {
		try {
			loading.value = true;
			error.value = null;

			const { data: response, error: supabaseError } = await supabase.rpc("fn_banners_duplicar", {
				p_banner_id: id,
			});

			if (supabaseError) {
				throw supabaseError;
			}

			if (response && response.length > 0) {
				banners.value.push(response[0]);
			}

			toast.success({ title: "Banner duplicado com sucesso!" });
		} catch (err) {
			error.value = "Erro ao duplicar banner";
			toast.error({ title: "Erro ao duplicar banner" });
			throw err;
		} finally {
			loading.value = false;
		}
	};

	// ========================================
	// ORDENAÇÃO
	// ========================================

	/**
	 * Reordena banner para nova posição via RPC
	 */
	const reorderBanner = async (id: string, newOrder: number): Promise<void> => {
		try {
			const { data: response, error: supabaseError } = await supabase.rpc("fn_banners_reordenar", {
				p_banner_id: id,
				p_new_ordem: newOrder,
			});

			if (supabaseError) {
				throw supabaseError;
			}

			if (response && response.length > 0) {
				// Atualizar todos os banners com a nova ordenação
				banners.value = response;
			}

			toast.success({ title: "Banner reordenado com sucesso!" });
		} catch (err) {
			error.value = "Erro ao reordenar banner";
			toast.error({ title: "Erro ao reordenar banner" });
			throw err;
		}
	};

	// ========================================
	// UPLOAD DE IMAGENS
	// ========================================

	/**
	 * Faz upload de imagem do banner via Supabase Storage
	 */
	const uploadBannerImage = async (file: File): Promise<string> => {
		try {
			// Validar arquivo
			if (!file.type.startsWith("image/")) {
				throw new Error("Arquivo deve ser uma imagem");
			}

			if (file.size > 5 * 1024 * 1024) {
				// 5MB
				throw new Error("Imagem deve ter no máximo 5MB");
			}

			// Gerar nome único para o arquivo
			const fileExt = file.name.split(".").pop();
			const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
			const filePath = `banners/${fileName}`;

			// Upload para Supabase Storage
			const { error: uploadError } = await supabase.storage
				.from("marketing")
				.upload(filePath, file);

			if (uploadError) {
				throw uploadError;
			}

			// Obter URL pública
			const { data: urlData } = supabase.storage.from("marketing").getPublicUrl(filePath);

			if (!urlData?.publicUrl) {
				throw new Error("Erro ao obter URL da imagem");
			}

			toast.success({ title: "Imagem enviada com sucesso!" });
			return urlData.publicUrl;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao enviar imagem";
			toast.error({ title: message });
			throw err;
		}
	};

	// ========================================
	// FILTROS
	// ========================================

	/**
	 * Aplica filtros aos banners
	 */
	const applyFilters = (_filters: BannerFilters): void => {
		// No-op, use useMarketing logic
		console.warn("Use handleFilter do useMarketing para aplicar filtros");
	};

	// ========================================
	// UTILITÁRIOS
	// ========================================

	/**
	 * Recarrega lista de banners
	 */
	const refreshBanners = async (): Promise<void> => {
		await fetchBanners();
	};

	// ========================================
	// INICIALIZAÇÃO
	// ========================================

	// Carregar banners na inicialização (apenas se não veio do cache)
	onMounted(() => {
		if (!cacheLoaded.value) {
			fetchBanners();
		} else {
			// Se veio do cache, atualizar contadores
			setTabData("banners", banners.value);
		}
	});

	// ========================================
	// RETORNO
	// ========================================

	return {
		// Estado
		banners,
		loading: readonly(loading),
		error: readonly(error),

		// Estatísticas
		bannersCount,
		bannersAtivos,
		bannersPorTipo,

		// Validações de limites
		canCreateBanner,
		isAtMinimum,
		isAtIdeal,
		isAtMaximum,
		bannerLimitStatus,

		// CRUD
		createBanner,
		updateBanner,
		deleteBanner,
		toggleBannerStatus,

		// Ordenação
		reorderBanner,

		// Upload
		uploadBannerImage,

		// Filtros
		filteredBanners,
		applyFilters,

		// Utilitários
		refreshBanners,
		duplicateBanner,
		generateBannerPreview,
		getBannerById,
	};
};
