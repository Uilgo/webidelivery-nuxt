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
			// Preparar variações no formato JSONB esperado pela função
			const variacoesJsonb =
				data.variacoes?.map((v, index) => ({
					nome: v.nome,
					preco: v.preco,
					preco_promocional: v.preco_promocional,
					ordem: v.ordem ?? index,
				})) ?? [];

			const { data: result, error } = await supabase.rpc("fn_produtos_criar", {
				p_categoria_id: data.categoria_id,
				p_nome: data.nome,
				p_descricao: data.descricao ?? null,
				p_imagem_url: data.imagem_url ?? null,
				p_ativo: data.ativo ?? true,
				p_destaque: data.destaque ?? false,
				p_em_promocao: data.em_promocao ?? false,
				p_variacoes: variacoesJsonb,
			});

			if (error) {
				throw error;
			}

			const produtoId = result as string;

			// Vincular grupos de adicionais após criar o produto
			if (produtoId && data.grupos_adicionais_ids && data.grupos_adicionais_ids.length > 0) {
				for (const grupoId of data.grupos_adicionais_ids) {
					const { error: vinculoError } = await supabase.rpc(
						"fn_produto_grupos_adicionais_vincular",
						{
							p_produto_id: produtoId,
							p_grupo_adicional_id: grupoId,
						},
					);

					if (vinculoError) {
						console.error("[useProdutosActions] Erro ao vincular grupo:", vinculoError);
						// Continua vinculando os outros grupos mesmo se um falhar
					}
				}
			}

			return produtoId;
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
				p_nome: data.nome,
				p_descricao: data.descricao ?? null,
				p_imagem_url: data.imagem_url ?? null,
				p_ativo: data.ativo ?? true,
				p_destaque: data.destaque ?? false,
				p_em_promocao: data.em_promocao ?? false,
				p_categoria_id: data.categoria_id ?? null,
			});

			if (error) {
				throw error;
			}

			// Atualizar variações se fornecidas
			if (data.variacoes && data.variacoes.length > 0) {
				const variacoesJsonb = data.variacoes.map((v, index) => ({
					id: (v as { id?: string }).id ?? null, // Inclui ID se existir (para update)
					nome: v.nome,
					preco: v.preco,
					preco_promocional: v.preco_promocional,
					ordem: v.ordem ?? index,
					ativo: true,
				}));

				const { error: variacoesError } = await supabase.rpc("fn_produto_variacoes_sincronizar", {
					p_produto_id: id,
					p_variacoes: variacoesJsonb,
				});

				if (variacoesError) {
					console.error("[useProdutosActions] Erro ao sincronizar variações:", variacoesError);
					throw variacoesError;
				}
			}

			// Atualizar grupos de adicionais se fornecidos
			if (data.grupos_adicionais_ids !== undefined) {
				// Buscar vínculos atuais
				const { data: vinculosAtuais } = await supabase
					.from("produto_grupos_adicionais")
					.select("id, grupo_adicional_id")
					.eq("produto_id", id);

				const idsAtuais = vinculosAtuais?.map((v) => v.grupo_adicional_id) || [];
				const idsNovos = data.grupos_adicionais_ids;

				// Remover vínculos que não estão mais selecionados
				const vinculosParaRemover = vinculosAtuais?.filter(
					(v) => !idsNovos.includes(v.grupo_adicional_id),
				);

				for (const vinculo of vinculosParaRemover || []) {
					await supabase.rpc("fn_produto_grupos_adicionais_desvincular", {
						p_vinculo_id: vinculo.id,
					});
				}

				// Adicionar novos vínculos
				const idsParaAdicionar = idsNovos.filter((id) => !idsAtuais.includes(id));

				for (const grupoId of idsParaAdicionar) {
					await supabase.rpc("fn_produto_grupos_adicionais_vincular", {
						p_produto_id: id,
						p_grupo_adicional_id: grupoId,
					});
				}
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
				.select("categoria_id, nome, descricao, imagem_url, destaque, em_promocao")
				.eq("id", id)
				.single();

			if (fetchError || !produto) {
				throw new Error("Produto não encontrado");
			}

			// Atualiza usando a assinatura correta da função
			const { data: result, error } = await supabase.rpc("fn_produtos_atualizar", {
				p_produto_id: id,
				p_nome: produto.nome,
				p_descricao: produto.descricao,
				p_imagem_url: produto.imagem_url,
				p_ativo: ativo,
				p_destaque: produto.destaque,
				p_em_promocao: produto.em_promocao,
				p_categoria_id: produto.categoria_id,
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
