/**
 * 📌 useGruposAdicionaisActions - Ações CRUD de Grupos de Adicionais
 *
 * Responsável por:
 * - Criar grupo (fn_grupos_adicionais_criar)
 * - Atualizar grupo (fn_grupos_adicionais_atualizar)
 * - Excluir grupo (fn_grupos_adicionais_excluir)
 * - Toggle ativo/inativo
 */

import type { GrupoAdicionalCreateData, GrupoAdicionalUpdateData } from "../../../types/adicional";

export interface UseGruposAdicionaisActionsReturn {
	creating: Ref<boolean>;
	updating: Ref<boolean>;
	deleting: Ref<boolean>;
	actionError: Ref<string | null>;
	create: (data: GrupoAdicionalCreateData) => Promise<string | null>;
	update: (id: string, data: GrupoAdicionalUpdateData) => Promise<boolean>;
	remove: (id: string) => Promise<boolean>;
	toggleAtivo: (id: string, ativo: boolean) => Promise<boolean>;
}

export const useGruposAdicionaisActions = (): UseGruposAdicionaisActionsReturn => {
	const supabase = useSupabaseClient();

	// Estados de loading
	const creating = ref(false);
	const updating = ref(false);
	const deleting = ref(false);
	const actionError = ref<string | null>(null);

	/**
	 * Criar novo grupo via RPC
	 */
	const create = async (data: GrupoAdicionalCreateData): Promise<string | null> => {
		creating.value = true;
		actionError.value = null;

		try {
			const { data: result, error } = await supabase.rpc("fn_grupos_adicionais_criar", {
				p_nome: data.nome,
				p_descricao: data.descricao ?? null,
				p_min_selecao: data.min_selecao ?? 0,
				p_max_selecao: data.max_selecao ?? 1,
				p_obrigatorio: data.obrigatorio ?? false,
			});

			if (error) {
				throw error;
			}

			return result as string;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao criar grupo de adicionais";
			actionError.value = message;
			console.error("[useGruposAdicionaisActions] Erro ao criar:", message);
			return null;
		} finally {
			creating.value = false;
		}
	};

	/**
	 * Atualizar grupo existente via RPC
	 */
	const update = async (id: string, data: GrupoAdicionalUpdateData): Promise<boolean> => {
		updating.value = true;
		actionError.value = null;

		try {
			const { data: result, error } = await supabase.rpc("fn_grupos_adicionais_atualizar", {
				p_grupo_id: id,
				p_nome: data.nome,
				p_descricao: data.descricao ?? null,
				p_min_selecao: data.min_selecao ?? 0,
				p_max_selecao: data.max_selecao ?? 1,
				p_obrigatorio: data.obrigatorio ?? false,
				p_ativo: data.ativo ?? true,
			});

			if (error) {
				throw error;
			}

			return result as boolean;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao atualizar grupo de adicionais";
			actionError.value = message;
			console.error("[useGruposAdicionaisActions] Erro ao atualizar:", message);
			return false;
		} finally {
			updating.value = false;
		}
	};

	/**
	 * Excluir grupo via RPC
	 */
	const remove = async (id: string): Promise<boolean> => {
		deleting.value = true;
		actionError.value = null;

		try {
			const { data: result, error } = await supabase.rpc("fn_grupos_adicionais_excluir", {
				p_grupo_id: id,
			});

			if (error) {
				throw error;
			}

			return result as boolean;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao excluir grupo de adicionais";
			actionError.value = message;
			console.error("[useGruposAdicionaisActions] Erro ao excluir:", message);
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
			// Busca o grupo atual para manter os outros dados
			const { data: grupo, error: fetchError } = await supabase
				.from("grupos_adicionais")
				.select("nome, descricao, min_selecao, max_selecao, obrigatorio")
				.eq("id", id)
				.single();

			if (fetchError || !grupo) {
				throw new Error("Grupo de adicionais não encontrado");
			}

			// Atualiza usando a assinatura correta da função
			const { data: result, error } = await supabase.rpc("fn_grupos_adicionais_atualizar", {
				p_grupo_id: id,
				p_nome: grupo.nome,
				p_descricao: grupo.descricao,
				p_min_selecao: grupo.min_selecao,
				p_max_selecao: grupo.max_selecao,
				p_obrigatorio: grupo.obrigatorio,
				p_ativo: ativo,
			});

			if (error) {
				throw error;
			}

			return result as boolean;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao atualizar status";
			actionError.value = message;
			console.error("[useGruposAdicionaisActions] Erro ao toggle ativo:", message);
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
