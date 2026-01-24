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
 */

import { useToast } from "~/composables/ui/useToast";
import type { BannerCompleto, BannerFormData, TipoBanner } from "#shared/types/marketing";
import type { BannerFilters, BannerPreview } from "../types/marketing";

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

	// ========================================
	// ESTADO REATIVO
	// ========================================

	const banners = ref<BannerCompleto[]>([]);
	const loading = ref(false);
	const error = ref<string | null>(null);
	const currentFilters = ref<BannerFilters>({});

	// ========================================
	// COMPUTADAS - ESTATÍSTICAS
	// ========================================

	const bannersCount = computed(() => banners.value.length);

	const bannersAtivos = computed(() => banners.value.filter((banner) => banner.ativo).length);

	const bannersPorTipo = computed(() => {
		const tipos: Record<TipoBanner, number> = {
			carrossel: 0,
			destaque: 0,
			popup: 0,
		};

		banners.value.forEach((banner) => {
			tipos[banner.tipo]++;
		});

		return tipos;
	});

	// ========================================
	// COMPUTADAS - FILTROS
	// ========================================

	const filteredBanners = computed(() => {
		let result = [...banners.value];

		// Filtro por tipo
		if (currentFilters.value.tipo) {
			result = result.filter((banner) => banner.tipo === currentFilters.value.tipo);
		}

		// Filtro por tipo de conteúdo
		if (currentFilters.value.tipo_conteudo) {
			result = result.filter(
				(banner) => banner.tipo_conteudo === currentFilters.value.tipo_conteudo,
			);
		}

		// Filtro por status
		if (currentFilters.value.status) {
			const isActive = currentFilters.value.status === "ativo";
			result = result.filter((banner) => banner.ativo === isActive);
		}

		// Ordenar por ordem
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
		} catch (err) {
			error.value = "Erro ao carregar banners";
			console.error("Erro ao buscar banners:", err);
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Cria novo banner via RPC
	 */
	const createBanner = async (data: BannerFormData): Promise<void> => {
		try {
			loading.value = true;
			error.value = null;

			const { data: response, error: supabaseError } = await supabase.rpc("fn_banners_criar", {
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
				p_ativo: true, // Banner criado sempre ativo
				p_configuracoes: {}, // Configurações padrão vazias
			});

			if (supabaseError) {
				throw supabaseError;
			}

			if (response && response.length > 0) {
				banners.value.push(response[0]);
			}

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

			const { error: supabaseError } = await supabase.rpc("fn_banners_excluir", {
				p_banner_id: id,
			});

			if (supabaseError) {
				throw supabaseError;
			}

			banners.value = banners.value.filter((banner) => banner.id !== id);
			toast.success({ title: "Banner excluído com sucesso!" });
		} catch (err) {
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
	const applyFilters = (filters: BannerFilters): void => {
		currentFilters.value = filters;
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

	// Carregar banners na inicialização
	onMounted(() => {
		fetchBanners();
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
