/**
 * 📌 useProdutosActions - Ações CRUD de Produtos
 *
 * Responsável por:
 * - Criar produto (fn_produtos_criar)
 * - Atualizar produto (fn_produtos_atualizar)
 * - Excluir produto (fn_produtos_excluir)
 * - Toggle ativo/inativo
 */

import type { ProdutoCreateData, ProdutoUpdateData } from "../../../types/produto";

export interface UseProdutosActionsReturn {
	creating: Ref<boolean>;
	updating: Ref<boolean>;
	deleting: Ref<boolean>;
	actionError: Ref<string | null>;
	create: (data: ProdutoCreateData) => Promise<string | null>;
	update: (id: string, data: ProdutoUpdateData) => Promise<boolean>;
	remove: (id: string) => Promise<boolean>;
	toggleAtivo: (id: string, ativo: boolean) => Promise<boolean>;
}

export const useProdutosActions = (): UseProdutosActionsReturn => {
	const supabase = useSupabaseClient();

	// Estados de loading
	const creating = ref(false);
	const updating = ref(false);
	const deleting = ref(false);
	const actionError = ref<string | null>(null);

	/**
	 * Criar novo produto via RPC
	 */
	const create = async (data: ProdutoCreateData): Promise<string | null> => {
		creating.value = true;
		actionError.value = null;

		try {
			const { data: result, error } = await supabase.rpc("fn_produtos_criar", {
				p_categoria_id: data.categoria_id,
				p_nome: data.nome,
				p_descricao: data.descricao ?? null,
				p_imagem_url: data.imagem_url ?? null,
			});

			if (error) {
				throw error;
			}

			return result as string;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao criar produto";
			actionError.value = message;
			console.error("[useProdutosActions] Erro ao criar:", message);
			return null;
		} finally {
			creating.value = false;
		}
	};

	/**
	 * Atualizar produto existente via RPC
	 */
	const update = async (id: string, data: ProdutoUpdateData): Promise<boolean> => {
		updating.value = true;
		actionError.value = null;

		try {
			const { data: result, error } = await supabase.rpc("fn_produtos_atualizar", {
				p_produto_id: id,
				p_categoria_id: data.categoria_id ?? null,
				p_nome: data.nome ?? null,
				p_descricao: data.descricao ?? null,
				p_imagem_url: data.imagem_url ?? null,
				p_ativo: data.ativo ?? null,
				p_destaque: data.destaque ?? null,
				p_em_promocao: data.em_promocao ?? null,
				p_ordem: data.ordem ?? null,
			});

			if (error) {
				throw error;
			}

			return result as boolean;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao atualizar produto";
			actionError.value = message;
			console.error("[useProdutosActions] Erro ao atualizar:", message);
			return false;
		} finally {
			updating.value = false;
		}
	};

	/**
	 * Excluir produto via RPC
	 */
	const remove = async (id: string): Promise<boolean> => {
		deleting.value = true;
		actionError.value = null;

		try {
			const { data: result, error } = await supabase.rpc("fn_produtos_excluir", {
				p_produto_id: id,
			});

			if (error) {
				throw error;
			}

			return result as boolean;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao excluir produto";
			actionError.value = message;
			console.error("[useProdutosActions] Erro ao excluir:", message);
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
			// Busca o produto atual para manter os outros dados
			const { data: produto, error: fetchError } = await supabase
				.from("produtos")
				.select("categoria_id, nome, descricao, imagem_url, destaque, em_promocao, ordem")
				.eq("id", id)
				.single();

			if (fetchError || !produto) {
				throw new Error("Produto não encontrado");
			}

			// Atualiza mantendo todos os dados existentes
			const { data: result, error } = await supabase.rpc("fn_produtos_atualizar", {
				p_produto_id: id,
				p_categoria_id: produto.categoria_id,
				p_nome: produto.nome,
				p_descricao: produto.descricao,
				p_imagem_url: produto.imagem_url,
				p_ativo: ativo,
				p_destaque: produto.destaque,
				p_em_promocao: produto.em_promocao,
				p_ordem: produto.ordem,
			});

			if (error) {
				throw error;
			}

			return result as boolean;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao atualizar status";
			actionError.value = message;
			console.error("[useProdutosActions] Erro ao toggle ativo:", message);
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
