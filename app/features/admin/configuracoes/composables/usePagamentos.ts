/**
 * 📌 usePagamentos - Gerenciamento de Métodos de Pagamento
 *
 * Responsável por:
 * - Buscar métodos de pagamento (config_pagamento)
 * - Atualizar métodos via RPC fn_rpc_onboarding_salvar_pagamentos
 * - Reutiliza lógica do onboarding
 */

import type { ConfiguracoesPagamento } from "../types/configuracoes";
import { useEstabelecimentoStore } from "~/stores/estabelecimento";
import { useToast } from "~/composables/ui/useToast";

export interface UsePagamentosReturn {
	// Dados
	pagamentos: Ref<ConfiguracoesPagamento | null>;

	// Estados
	loading: Ref<boolean>;
	saving: Ref<boolean>;
	error: Ref<string | null>;

	// Métodos
	buscarPagamentos: () => Promise<void>;
	salvarPagamentos: (pagamentos: ConfiguracoesPagamento) => Promise<boolean>;
}

export const usePagamentos = (): UsePagamentosReturn => {
	const supabase = useSupabaseClient();
	const estabelecimentoStore = useEstabelecimentoStore();
	const { success, error: showError } = useToast();

	// Estados
	const pagamentos = ref<ConfiguracoesPagamento | null>(null);
	const loading = ref(false);
	const saving = ref(false);
	const error = ref<string | null>(null);

	/**
	 * Buscar métodos de pagamento (READ via RLS)
	 */
	const buscarPagamentos = async (): Promise<void> => {
		loading.value = true;
		error.value = null;

		try {
			const estabelecimento = estabelecimentoStore.estabelecimento;

			if (!estabelecimento) {
				throw new Error("Estabelecimento não encontrado");
			}

			// Extrair config_pagamento
			const configPagamento = estabelecimento.config_pagamento as ConfiguracoesPagamento | null;

			pagamentos.value = configPagamento || {
				aceita_dinheiro: false,
				aceita_pix: false,
				tipo_chave_pix: undefined,
				chave_pix: undefined,
				aceita_cartao_credito: false,
				aceita_cartao_debito: false,
			};
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao buscar métodos de pagamento";
			error.value = message;
			console.error("[usePagamentos] Erro ao buscar pagamentos:", err);

			// Inicializar com valores padrão em caso de erro
			pagamentos.value = {
				aceita_dinheiro: false,
				aceita_pix: false,
				tipo_chave_pix: undefined,
				chave_pix: undefined,
				aceita_cartao_credito: false,
				aceita_cartao_debito: false,
			};
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Salvar métodos de pagamento (UPDATE via RPC)
	 */
	const salvarPagamentos = async (
		pagamentosAtualizados: ConfiguracoesPagamento,
	): Promise<boolean> => {
		saving.value = true;
		error.value = null;

		try {
			// Chamar RPC fn_rpc_onboarding_salvar_pagamentos (reutiliza do onboarding)
			const { error: rpcError } = await supabase.rpc("fn_rpc_onboarding_salvar_pagamentos", {
				p_metodos: pagamentosAtualizados,
			});

			if (rpcError) {
				throw rpcError;
			}

			// Atualizar store local usando função mutadora
			if (estabelecimentoStore.estabelecimento) {
				estabelecimentoStore.$patch((state) => {
					if (state.estabelecimento) {
						state.estabelecimento.config_pagamento = pagamentosAtualizados as unknown as Record<
							string,
							unknown
						>;
					}
				});
			}

			// Atualizar dados locais
			pagamentos.value = pagamentosAtualizados;

			success({
				title: "Pagamentos atualizados",
				description: "Os métodos de pagamento foram salvos com sucesso",
			});

			return true;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao salvar métodos de pagamento";
			error.value = message;
			showError({
				title: "Erro ao salvar",
				description: message,
			});
			console.error("[usePagamentos] Erro ao salvar pagamentos:", err);
			return false;
		} finally {
			saving.value = false;
		}
	};

	// Watch para reagir a mudanças na store (dados carregados pelo plugin)
	watch(
		() => estabelecimentoStore.estabelecimento?.config_pagamento,
		() => {
			buscarPagamentos();
		},
		{ immediate: true },
	);

	return {
		// Dados
		pagamentos,

		// Estados
		loading,
		saving,
		error,

		// Métodos
		buscarPagamentos,
		salvarPagamentos,
	};
};
