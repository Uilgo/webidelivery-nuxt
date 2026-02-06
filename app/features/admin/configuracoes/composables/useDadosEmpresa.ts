/**
 * 📌 useDadosEmpresa - Gerenciamento de Dados da Empresa
 *
 * Responsável por:
 * - Buscar dados da empresa (nome, slug, descrição, logo, etc.)
 * - Atualizar dados via RPC fn_rpc_admin_atualizar_estabelecimento
 * - Validar slug em tempo real
 */

import type { DadosEmpresa } from "../types/configuracoes";
import { useEstabelecimentoStore } from "~/stores/estabelecimento";
import { useToast } from "~/composables/ui/useToast";

export interface UseDadosEmpresaReturn {
	// Dados
	dados: Ref<DadosEmpresa | null>;

	// Estados
	loading: Ref<boolean>;
	saving: Ref<boolean>;
	error: Ref<string | null>;

	// Validação de slug
	slugValidation: Ref<{
		isValid: boolean;
		isChecking: boolean;
		message: string;
		available: boolean;
	}>;

	// Métodos
	buscarDados: () => Promise<void>;
	salvarDados: (dados: Partial<DadosEmpresa>) => Promise<boolean>;
	validarSlug: (slug: string) => Promise<void>;
}

export const useDadosEmpresa = (): UseDadosEmpresaReturn => {
	const supabase = useSupabaseClient();
	const estabelecimentoStore = useEstabelecimentoStore();
	const { success, error: showError } = useToast();

	// Estados
	const dados = ref<DadosEmpresa | null>(null);
	const loading = ref(false);
	const saving = ref(false);
	const error = ref<string | null>(null);

	// Validação de slug
	const slugValidation = ref({
		isValid: false,
		isChecking: false,
		message: "",
		available: false,
	});

	/**
	 * Buscar dados da empresa (READ via RLS)
	 */
	const buscarDados = async (): Promise<void> => {
		loading.value = true;
		error.value = null;

		try {
			const estabelecimento = estabelecimentoStore.estabelecimento;

			if (!estabelecimento) {
				throw new Error("Estabelecimento não encontrado");
			}

			// Mapear dados do estabelecimento para DadosEmpresa
			dados.value = {
				nome: estabelecimento.nome || "",
				slug: estabelecimento.slug || "",
				descricao: estabelecimento.descricao || undefined,
				logo_url: estabelecimento.logo_url || undefined,
				logo_url_dark: estabelecimento.logo_url_dark || undefined,
				capa_url: estabelecimento.capa_url || undefined,
				foto_capa_url: estabelecimento.foto_capa_url || undefined,
				whatsapp: estabelecimento.whatsapp || undefined,
				cor_fundo: estabelecimento.cor_fundo || undefined,
			};
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao buscar dados da empresa";
			error.value = message;
			console.error("[useDadosEmpresa] Erro ao buscar dados:", err);
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Salvar dados da empresa (UPDATE via RPC)
	 */
	const salvarDados = async (dadosAtualizados: Partial<DadosEmpresa>): Promise<boolean> => {
		saving.value = true;
		error.value = null;

		try {
			// Chamar RPC fn_rpc_admin_atualizar_estabelecimento
			const { error: rpcError } = await supabase.rpc("fn_rpc_admin_atualizar_estabelecimento", {
				p_dados: dadosAtualizados,
			});

			if (rpcError) {
				throw rpcError;
			}

			// Atualizar store local usando função mutadora
			if (estabelecimentoStore.estabelecimento) {
				estabelecimentoStore.$patch((state) => {
					if (state.estabelecimento) {
						Object.assign(state.estabelecimento, dadosAtualizados);
					}
				});
			}

			// Atualizar dados locais
			if (dados.value) {
				Object.assign(dados.value, dadosAtualizados);
			}

			success({
				title: "Dados atualizados",
				description: "As informações da empresa foram salvas com sucesso",
			});

			return true;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao salvar dados da empresa";
			error.value = message;
			showError({
				title: "Erro ao salvar",
				description: message,
			});
			console.error("[useDadosEmpresa] Erro ao salvar dados:", err);
			return false;
		} finally {
			saving.value = false;
		}
	};

	/**
	 * Validar slug em tempo real
	 */
	const validarSlug = async (slug: string): Promise<void> => {
		slugValidation.value.isChecking = true;
		slugValidation.value.message = "";

		try {
			// Validação de formato
			const slugRegex = /^[a-z0-9-]{3,50}$/;
			if (!slugRegex.test(slug)) {
				slugValidation.value.isValid = false;
				slugValidation.value.available = false;
				slugValidation.value.message =
					"Slug inválido. Use apenas letras minúsculas, números e hífens (3-50 caracteres)";
				return;
			}

			// Verificar disponibilidade (ignorar se for o slug atual)
			const slugAtual = estabelecimentoStore.estabelecimento?.slug;
			if (slug === slugAtual) {
				slugValidation.value.isValid = true;
				slugValidation.value.available = true;
				slugValidation.value.message = "Slug atual";
				return;
			}

			// Buscar no banco
			const { data, error: queryError } = await supabase
				.from("estabelecimentos")
				.select("id")
				.eq("slug", slug)
				.maybeSingle();

			if (queryError) {
				throw queryError;
			}

			if (data) {
				slugValidation.value.isValid = false;
				slugValidation.value.available = false;
				slugValidation.value.message = "Slug já está em uso";
			} else {
				slugValidation.value.isValid = true;
				slugValidation.value.available = true;
				slugValidation.value.message = "Slug disponível ✅";
			}
		} catch (err) {
			console.error("[useDadosEmpresa] Erro ao validar slug:", err);
			slugValidation.value.isValid = false;
			slugValidation.value.available = false;
			slugValidation.value.message = "Erro ao verificar disponibilidade";
		} finally {
			slugValidation.value.isChecking = false;
		}
	};

	// Watch para reagir a mudanças na store (dados carregados pelo plugin)
	watch(
		() => estabelecimentoStore.estabelecimento,
		() => {
			buscarDados();
		},
		{ immediate: true, deep: true },
	);

	return {
		// Dados
		dados,

		// Estados
		loading,
		saving,
		error,

		// Validação de slug
		slugValidation,

		// Métodos
		buscarDados,
		salvarDados,
		validarSlug,
	};
};
