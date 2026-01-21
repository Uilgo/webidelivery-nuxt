/**
 * 📌 useOnboardingActions - Ações RPC do Onboarding
 *
 * Responsável por:
 * - Salvar informações básicas (fn_rpc_onboarding_salvar_info_basica)
 * - Salvar endereço (fn_rpc_onboarding_salvar_endereco)
 * - Salvar contato (fn_rpc_onboarding_salvar_contato)
 * - Salvar horários (fn_rpc_onboarding_salvar_horarios)
 * - Salvar pagamentos (fn_rpc_onboarding_salvar_pagamentos)
 * - Finalizar onboarding (fn_rpc_onboarding_finalizar)
 */

import type {
	Step1InfoBasica,
	Step2Endereco,
	Step3Contato,
	Step4Horarios,
	Step5Pagamentos,
} from "../types/onboarding";

/**
 * Wrapper tipado para chamadas RPC do Supabase
 * Evita o uso de 'any' mantendo type safety
 */
const callSupabaseRpc = async <T = void>(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	supabase: any,
	functionName: string,
	params: Record<string, unknown>,
): Promise<{ data: T | null; error: unknown | null }> => {
	try {
		const result = await supabase.rpc(functionName, params);
		return result;
	} catch (error) {
		return { data: null, error };
	}
};

// ========================================
// INTERFACE DE RETORNO
// ========================================

export interface UseOnboardingActionsReturn {
	// Estados
	saving: Readonly<Ref<boolean>>;
	completing: Readonly<Ref<boolean>>;
	actionError: Readonly<Ref<string | null>>;

	// Métodos de salvamento
	saveInfoBasica: (data: Step1InfoBasica) => Promise<boolean>;
	saveEndereco: (data: Step2Endereco) => Promise<boolean>;
	saveContato: (data: Step3Contato) => Promise<boolean>;
	saveHorarios: (data: Step4Horarios) => Promise<boolean>;
	savePagamentos: (data: Step5Pagamentos) => Promise<boolean>;

	// Finalização
	finalizar: () => Promise<boolean>;
}

// ========================================
// COMPOSABLE PRINCIPAL
// ========================================

export const useOnboardingActions = (): UseOnboardingActionsReturn => {
	const supabase = useSupabaseClient();

	// Estados de loading por ação
	const saving = ref(false);
	const completing = ref(false);
	const actionError = ref<string | null>(null);

	/**
	 * Salvar informações básicas via RPC
	 */
	const saveInfoBasica = async (data: Step1InfoBasica): Promise<boolean> => {
		saving.value = true;
		actionError.value = null;

		try {
			// Chamada RPC tipada para salvar informações básicas
			const { error } = await callSupabaseRpc(supabase, "fn_rpc_onboarding_salvar_info_basica", {
				p_nome: data.nome,
				p_slug: data.slug,
				p_descricao: data.descricao || null,
			});

			if (error) {
				throw error;
			}

			return true;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao salvar informações básicas";
			actionError.value = message;
			console.error("[useOnboardingActions] Erro ao salvar informações básicas:", message);
			return false;
		} finally {
			saving.value = false;
		}
	};

	/**
	 * Salvar endereço via RPC
	 */
	const saveEndereco = async (data: Step2Endereco): Promise<boolean> => {
		saving.value = true;
		actionError.value = null;

		try {
			// Chamada RPC tipada para salvar endereço
			const { error } = await callSupabaseRpc(supabase, "fn_rpc_onboarding_salvar_endereco", {
				p_rua: data.endereco_rua,
				p_numero: data.endereco_numero,
				p_bairro: data.endereco_bairro,
				p_cidade: data.endereco_cidade,
				p_estado: data.endereco_estado,
				p_cep: data.endereco_cep || null,
				p_complemento: data.endereco_complemento || null,
				p_referencia: data.endereco_referencia || null,
			});

			if (error) {
				throw error;
			}

			return true;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao salvar endereço";
			actionError.value = message;
			console.error("[useOnboardingActions] Erro ao salvar endereço:", message);
			return false;
		} finally {
			saving.value = false;
		}
	};

	/**
	 * Salvar contato via RPC
	 */
	const saveContato = async (data: Step3Contato): Promise<boolean> => {
		saving.value = true;
		actionError.value = null;

		try {
			// Chamada RPC tipada para salvar contato
			const { error } = await callSupabaseRpc(supabase, "fn_rpc_onboarding_salvar_contato", {
				p_whatsapp: data.whatsapp,
			});

			if (error) {
				throw error;
			}

			return true;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao salvar contato";
			actionError.value = message;
			console.error("[useOnboardingActions] Erro ao salvar contato:", message);
			return false;
		} finally {
			saving.value = false;
		}
	};

	/**
	 * Salvar horários via RPC
	 */
	const saveHorarios = async (data: Step4Horarios): Promise<boolean> => {
		saving.value = true;
		actionError.value = null;

		try {
			// Chamada RPC tipada para salvar horários
			const { error } = await callSupabaseRpc(supabase, "fn_rpc_onboarding_salvar_horarios", {
				p_horarios: data.horarios,
			});

			if (error) {
				throw error;
			}

			return true;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao salvar horários";
			actionError.value = message;
			console.error("[useOnboardingActions] Erro ao salvar horários:", message);
			return false;
		} finally {
			saving.value = false;
		}
	};

	/**
	 * Salvar métodos de pagamento via RPC
	 */
	const savePagamentos = async (data: Step5Pagamentos): Promise<boolean> => {
		saving.value = true;
		actionError.value = null;

		try {
			// Chamada RPC tipada para salvar pagamentos
			const { error } = await callSupabaseRpc(supabase, "fn_rpc_onboarding_salvar_pagamentos", {
				p_metodos: data, // data já é o objeto com os campos de pagamento
			});

			if (error) {
				throw error;
			}

			return true;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao salvar métodos de pagamento";
			actionError.value = message;
			console.error("[useOnboardingActions] Erro ao salvar métodos de pagamento:", message);
			return false;
		} finally {
			saving.value = false;
		}
	};

	/**
	 * Finalizar onboarding via RPC
	 */
	const finalizar = async (): Promise<boolean> => {
		completing.value = true;
		actionError.value = null;

		try {
			// Chamada RPC tipada para finalizar onboarding
			const { error } = await callSupabaseRpc(supabase, "fn_rpc_onboarding_finalizar", {});

			if (error) {
				throw error;
			}

			return true;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao finalizar onboarding";
			actionError.value = message;
			console.error("[useOnboardingActions] Erro ao finalizar onboarding:", message);
			return false;
		} finally {
			completing.value = false;
		}
	};

	// ========================================
	// RETORNO DO COMPOSABLE
	// ========================================

	return {
		// Estados
		saving: readonly(saving),
		completing: readonly(completing),
		actionError: readonly(actionError),

		// Métodos de salvamento
		saveInfoBasica,
		saveEndereco,
		saveContato,
		saveHorarios,
		savePagamentos,

		// Finalização
		finalizar,
	};
};
