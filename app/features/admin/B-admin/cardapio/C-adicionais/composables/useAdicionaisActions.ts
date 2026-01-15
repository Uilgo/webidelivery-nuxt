/**
 * 📌 useAdicionaisActions - Ações CRUD de Adicionais
 *
 * Responsável por:
 * - Criar adicional (fn_adicionais_criar)
 * - Atualizar adicional (fn_adicionais_atualizar)
 * - Excluir adicional (fn_adicionais_excluir)
 * - Toggle ativo/inativo
 */

import type { AdicionalCreateData, AdicionalUpdateData } from "../../../types/adicional";

export interface UseAdicionaisActionsReturn {
	creating: Ref<boolean>;
	updating: Ref<boolean>;
	deleting: Ref<boolean>;
	actionError: Ref<string | null>;
	create: (data: AdicionalCreateData) => Promise<string | null>;
	update: (id: string, data: AdicionalUpdateData) => Promise<boolean>;
	remove: (id: string) => Promise<boolean>;
	toggleAtivo: (id: string, ativo: boolean) => Promise<boolean>;
}

export const useAdicionaisActions = (): UseAdicionaisActionsReturn => {
	const supabase = useSupabaseClient();

	// Estados de loading
	const creating = ref(false);
	const updating = ref(false);
	const deleting = ref(false);
	const actionError = ref<string | null>(null);

	/**
	 * Criar novo adicional via RPC
	 */
	const create = async (data: AdicionalCreateData): Promise<string | null> => {
		creating.value = true;
		actionError.value = null;

		try {
			const { data: result, error } = await supabase.rpc("fn_adicionais_criar", {
				p_grupo_id: data.grupo_id,
				p_nome: data.nome,
				p_descricao: data.descricao ?? null,
				p_preco: data.preco ?? 0,
			});

			if (error) {
				throw error;
			}

			return result as string;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao criar adicional";
			actionError.value = message;
			console.error("[useAdicionaisActions] Erro ao criar:", message);
			return null;
		} finally {
			creating.value = false;
		}
	};

	/**
	 * Atualizar adicional existente via RPC
	 */
	const update = async (id: string, data: AdicionalUpdateData): Promise<boolean> => {
		updating.value = true;
		actionError.value = null;

		try {
			const { data: result, error } = await supabase.rpc("fn_adicionais_atualizar", {
				p_adicional_id: id,
				p_nome: data.nome,
				p_descricao: data.descricao ?? null,
				p_preco: data.preco ?? 0,
				p_ativo: data.ativo ?? true,
			});

			if (error) {
				throw error;
			}

			return result as boolean;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao atualizar adicional";
			actionError.value = message;
			console.error("[useAdicionaisActions] Erro ao atualizar:", message);
			return false;
		} finally {
			updating.value = false;
		}
	};

	/**
	 * Excluir adicional via RPC
	 */
	const remove = async (id: string): Promise<boolean> => {
		deleting.value = true;
		actionError.value = null;

		try {
			const { data: result, error } = await supabase.rpc("fn_adicionais_excluir", {
				p_adicional_id: id,
			});

			if (error) {
				throw error;
			}

			return result as boolean;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao excluir adicional";
			actionError.value = message;
			console.error("[useAdicionaisActions] Erro ao excluir:", message);
			return false;
		} finally {
			deleting.value = false;
		}
	};

	/**
	 * Toggle ativo/inativo (busca dados atuais antes de atualizar)
	 */
	const toggleAtivo = async (id: string, ativo: boolean): Promise<boolean> => {
		updating.value = true;
		actionError.value = null;

		try {
			// Busca o adicional atual para manter os outros dados
			const { data: adicional, error: fetchError } = await supabase
				.from("adicionais")
				.select("nome, descricao, preco")
				.eq("id", id)
				.single();

			if (fetchError || !adicional) {
				throw new Error("Adicional não encontrado");
			}

			// Atualiza usando a assinatura correta da função
			const { data: result, error } = await supabase.rpc("fn_adicionais_atualizar", {
				p_adicional_id: id,
				p_nome: adicional.nome,
				p_descricao: adicional.descricao,
				p_preco: adicional.preco,
				p_ativo: ativo,
			});

			if (error) {
				throw error;
			}

			return result as boolean;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao atualizar status";
			actionError.value = message;
			console.error("[useAdicionaisActions] Erro ao toggle ativo:", message);
			return false;
		} finally {
			updating.value = false;
		}
	};

	return {
		creating,
		updating,
		deleting,
		actionError,
		create,
		update,
		remove,
		toggleAtivo,
	};
};
