/**
 * 📌 usePersonalizacao - Gerenciamento de Personalização e Tema
 *
 * Responsável por:
 * - Buscar configurações de tema (config_tema)
 * - Atualizar tema via RPC fn_rpc_admin_atualizar_estabelecimento
 */

import type { ConfiguracoesTema } from "../types/configuracoes";
import { useEstabelecimentoStore } from "~/stores/estabelecimento";
import { useToast } from "~/composables/ui/useToast";

export interface UsePersonalizacaoReturn {
	// Dados
	tema: Ref<ConfiguracoesTema | null>;

	// Estados
	loading: Ref<boolean>;
	saving: Ref<boolean>;
	error: Ref<string | null>;

	// Métodos
	buscarTema: () => Promise<void>;
	salvarTema: (tema: Partial<ConfiguracoesTema>) => Promise<boolean>;
}

export const usePersonalizacao = (): UsePersonalizacaoReturn => {
	const supabase = useSupabaseClient();
	const estabelecimentoStore = useEstabelecimentoStore();
	const { success, error: showError } = useToast();

	// Estados
	const tema = ref<ConfiguracoesTema | null>(null);
	const loading = ref(false);
	const saving = ref(false);
	const error = ref<string | null>(null);

	/**
	 * Buscar configurações de tema (READ via RLS)
	 */
	const buscarTema = async (): Promise<void> => {
		loading.value = true;
		error.value = null;

		try {
			const estabelecimento = estabelecimentoStore.estabelecimento;

			if (!estabelecimento) {
				throw new Error("Estabelecimento não encontrado");
			}

			// Extrair config_tema
			const configTema = estabelecimento.config_tema as ConfiguracoesTema | null;

			tema.value = configTema || {
				cor_primaria: "#3b82f6",
				cor_secundaria: "#10b981",
				cor_fundo: "#ffffff",
				cor_texto: "#1f2937",
				estilo_botoes: "rounded",
				layout_cardapio: "grid",
			};
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao buscar tema";
			error.value = message;
			console.error("[usePersonalizacao] Erro ao buscar tema:", err);
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Salvar configurações de tema (UPDATE via RPC)
	 */
	const salvarTema = async (temaAtualizado: Partial<ConfiguracoesTema>): Promise<boolean> => {
		saving.value = true;
		error.value = null;

		try {
			// Mesclar com tema existente
			const temaAtual = (estabelecimentoStore.estabelecimento?.config_tema || {}) as Record<
				string,
				unknown
			>;

			const novoTema = {
				...temaAtual,
				...temaAtualizado,
			};

			// Chamar RPC fn_rpc_admin_atualizar_estabelecimento
			const { error: rpcError } = await supabase.rpc("fn_rpc_admin_atualizar_estabelecimento", {
				p_dados: {
					config_tema: novoTema,
				},
			});

			if (rpcError) {
				throw rpcError;
			}

			// Atualizar store local usando função mutadora
			if (estabelecimentoStore.estabelecimento) {
				estabelecimentoStore.$patch((state) => {
					if (state.estabelecimento) {
						const temaAtual = (state.estabelecimento.config_tema || {}) as Record<string, unknown>;
						state.estabelecimento.config_tema = {
							...temaAtual,
							...temaAtualizado,
						};
					}
				});
			}

			// Atualizar dados locais
			tema.value = novoTema as ConfiguracoesTema;

			success({
				title: "Tema atualizado",
				description: "As configurações de personalização foram salvas com sucesso",
			});

			return true;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao salvar tema";
			error.value = message;
			showError({
				title: "Erro ao salvar",
				description: message,
			});
			console.error("[usePersonalizacao] Erro ao salvar tema:", err);
			return false;
		} finally {
			saving.value = false;
		}
	};

	// Watch para reagir a mudanças na store (dados carregados pelo plugin)
	watch(
		() => estabelecimentoStore.estabelecimento?.config_tema,
		() => {
			buscarTema();
		},
		{ immediate: true },
	);

	return {
		// Dados
		tema,

		// Estados
		loading,
		saving,
		error,

		// Métodos
		buscarTema,
		salvarTema,
	};
};
