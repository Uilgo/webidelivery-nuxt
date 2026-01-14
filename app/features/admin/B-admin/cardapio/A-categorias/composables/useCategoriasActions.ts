/**
 * 📌 useCategoriasActions - Ações CRUD de Categorias
 *
 * Responsável por:
 * - Criar categoria (fn_categorias_criar)
 * - Atualizar categoria (fn_categorias_atualizar)
 * - Excluir categoria (fn_categorias_excluir)
 * - Reordenar categorias (fn_categorias_reordenar)
 * - Toggle ativo/inativo
 */

import type { CategoriaCreateData, CategoriaUpdateData } from "../../../types/categoria";

export interface UseCategoriasActionsReturn {
	creating: Ref<boolean>;
	updating: Ref<boolean>;
	deleting: Ref<boolean>;
	actionError: Ref<string | null>;
	create: (data: CategoriaCreateData) => Promise<string | null>;
	update: (id: string, data: CategoriaUpdateData) => Promise<boolean>;
	remove: (id: string) => Promise<boolean>;
	toggleAtivo: (id: string, ativo: boolean) => Promise<boolean>;
	reorder: (ids: string[]) => Promise<boolean>;
}

export const useCategoriasActions = (): UseCategoriasActionsReturn => {
	const supabase = useSupabaseClient();

	// Estados de loading por ação
	const creating = ref(false);
	const updating = ref(false);
	const deleting = ref(false);
	const actionError = ref<string | null>(null);

	/**
	 * Criar nova categoria via RPC
	 * @returns ID da categoria criada ou null em caso de erro
	 */
	const create = async (data: CategoriaCreateData): Promise<string | null> => {
		creating.value = true;
		actionError.value = null;

		try {
			const { data: result, error } = await supabase.rpc("fn_categorias_criar", {
				p_nome: data.nome,
				p_descricao: data.descricao ?? null,
				p_imagem_url: data.imagem_url ?? null,
			});

			if (error) {
				throw error;
			}

			return result as string;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao criar categoria";
			actionError.value = message;
			console.error("[useCategoriasActions] Erro ao criar:", message);
			return null;
		} finally {
			creating.value = false;
		}
	};

	/**
	 * Atualizar categoria existente via RPC
	 */
	const update = async (id: string, data: CategoriaUpdateData): Promise<boolean> => {
		updating.value = true;
		actionError.value = null;

		try {
			const { data: result, error } = await supabase.rpc("fn_categorias_atualizar", {
				p_categoria_id: id,
				p_nome: data.nome ?? null,
				p_descricao: data.descricao ?? null,
				p_imagem_url: data.imagem_url ?? null,
				p_ativo: data.ativo ?? null,
				p_ordem: data.ordem ?? null,
			});

			if (error) {
				throw error;
			}

			return result as boolean;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao atualizar categoria";
			actionError.value = message;
			console.error("[useCategoriasActions] Erro ao atualizar:", message);
			return false;
		} finally {
			updating.value = false;
		}
	};

	/**
	 * Excluir categoria via RPC
	 */
	const remove = async (id: string): Promise<boolean> => {
		deleting.value = true;
		actionError.value = null;

		try {
			const { data: result, error } = await supabase.rpc("fn_categorias_excluir", {
				p_categoria_id: id,
			});

			if (error) {
				throw error;
			}

			return result as boolean;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao excluir categoria";
			actionError.value = message;
			console.error("[useCategoriasActions] Erro ao excluir:", message);
			return false;
		} finally {
			deleting.value = false;
		}
	};

	/**
	 * Toggle ativo/inativo (atualiza apenas o campo ativo)
	 */
	const toggleAtivo = async (id: string, ativo: boolean): Promise<boolean> => {
		updating.value = true;
		actionError.value = null;

		try {
			// Busca a categoria atual para manter os outros dados
			const supabase = useSupabaseClient();
			const { data: categoria, error: fetchError } = await supabase
				.from("categorias")
				.select("nome, descricao, imagem_url, ordem")
				.eq("id", id)
				.single();

			if (fetchError || !categoria) {
				throw new Error("Categoria não encontrada");
			}

			// Atualiza mantendo todos os dados existentes
			const { data: result, error } = await supabase.rpc("fn_categorias_atualizar", {
				p_categoria_id: id,
				p_nome: categoria.nome,
				p_descricao: categoria.descricao,
				p_imagem_url: categoria.imagem_url,
				p_ativo: ativo,
				p_ordem: categoria.ordem,
			});

			if (error) {
				throw error;
			}

			return result as boolean;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao atualizar status";
			actionError.value = message;
			console.error("[useCategoriasActions] Erro ao toggle ativo:", message);
			return false;
		} finally {
			updating.value = false;
		}
	};

	/**
	 * Reordenar categorias via RPC
	 */
	const reorder = async (ids: string[]): Promise<boolean> => {
		updating.value = true;
		actionError.value = null;

		try {
			const { data: result, error } = await supabase.rpc("fn_categorias_reordenar", {
				p_categoria_ids: ids,
			});

			if (error) {
				throw error;
			}

			return result as boolean;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao reordenar categorias";
			actionError.value = message;
			console.error("[useCategoriasActions] Erro ao reordenar:", message);
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
		reorder,
	};
};
