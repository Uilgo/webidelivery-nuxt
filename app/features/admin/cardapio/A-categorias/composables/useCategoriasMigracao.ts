/**
 * 📌 useCategoriasMigracao
 *
 * Composable para gerenciar migração de produtos entre categorias.
 * Usado quando uma categoria pai ganha subcategorias e precisa migrar produtos.
 */

import type { UUID } from "#shared/types/database";
import { useToast } from "~/composables/ui/useToast";

interface ProdutoParaMigracao {
	readonly id: UUID;
	readonly nome: string;
	readonly imagem_url: string | null;
}

export const useCategoriasMigracao = () => {
	// Estados reativos
	const produtosParaMigracao = ref<ProdutoParaMigracao[]>([]);
	const produtosSelecionados = ref<Set<UUID>>(new Set());
	const isLoading = ref(false);
	const error = ref<string | null>(null);

	const toast = useToast();

	/**
	 * Verifica se uma categoria tem produtos que precisam ser migrados
	 */
	const verificarProdutos = async (categoriaId: UUID): Promise<boolean> => {
		try {
			const { data, error: queryError } = await $fetch<{
				data: { count: number }[];
				error: unknown;
			}>("/api/supabase/rpc", {
				method: "POST",
				body: {
					fn: "fn_categorias_verificar_produtos",
					args: { p_categoria_id: categoriaId },
				},
			});

			if (queryError) {
				console.error("Erro ao verificar produtos:", queryError);
				return false;
			}

			return (data?.[0]?.count ?? 0) > 0;
		} catch (err) {
			console.error("Erro ao verificar produtos:", err);
			return false;
		}
	};

	/**
	 * Busca produtos de uma categoria para migração
	 */
	const buscarProdutos = async (categoriaId: UUID): Promise<void> => {
		isLoading.value = true;
		error.value = null;

		try {
			const { data } = await $fetch<{
				data: ProdutoParaMigracao[];
			}>("/api/supabase/query", {
				method: "POST",
				body: {
					query: `
						SELECT id, nome, imagem_url
						FROM produtos
						WHERE categoria_id = $1
						AND ativo = true
						ORDER BY nome
					`,
					params: [categoriaId],
				},
			});

			produtosParaMigracao.value = data || [];
			produtosSelecionados.value.clear();
		} catch (err) {
			console.error("Erro ao buscar produtos:", err);
			error.value = "Erro ao carregar produtos para migração";
			produtosParaMigracao.value = [];
		} finally {
			isLoading.value = false;
		}
	};

	/**
	 * Migra produtos selecionados para nova categoria
	 */
	const migrarProdutos = async (produtoIds: UUID[], novaCategoria: UUID): Promise<boolean> => {
		if (produtoIds.length === 0) {
			toast.add({
				title: "Nenhum produto selecionado",
				description: "Selecione pelo menos um produto para migrar",
				color: "warning",
				duration: 3000,
			});
			return false;
		}

		isLoading.value = true;
		error.value = null;

		try {
			const { error: rpcError } = await $fetch<{ error: unknown }>("/api/supabase/rpc", {
				method: "POST",
				body: {
					fn: "fn_produtos_migrar_categoria",
					args: {
						p_produto_ids: produtoIds,
						p_nova_categoria_id: novaCategoria,
					},
				},
			});

			if (rpcError) {
				console.error("Erro na migração:", rpcError);
				error.value = "Erro ao migrar produtos";
				return false;
			}

			toast.add({
				title: "Produtos migrados",
				description: `${produtoIds.length} produto(s) migrado(s) com sucesso`,
				color: "success",
				duration: 3000,
			});

			// Limpa seleção após sucesso
			produtosSelecionados.value.clear();
			return true;
		} catch (err) {
			console.error("Erro ao migrar produtos:", err);
			error.value = "Erro ao migrar produtos";
			return false;
		} finally {
			isLoading.value = false;
		}
	};

	/**
	 * Migra todos os produtos de uma categoria
	 */
	const migrarTodosProdutos = async (
		categoriaOrigemId: UUID,
		novaCategoria: UUID,
	): Promise<boolean> => {
		const todosProdutoIds = produtosParaMigracao.value.map((p) => p.id);
		return await migrarProdutos(todosProdutoIds, novaCategoria);
	};

	/**
	 * Toggle seleção de produto
	 */
	const toggleProdutoSelecionado = (produtoId: UUID): void => {
		if (produtosSelecionados.value.has(produtoId)) {
			produtosSelecionados.value.delete(produtoId);
		} else {
			produtosSelecionados.value.add(produtoId);
		}
	};

	/**
	 * Seleciona todos os produtos
	 */
	const selecionarTodos = (): void => {
		produtosParaMigracao.value.forEach((produto) => {
			produtosSelecionados.value.add(produto.id);
		});
	};

	/**
	 * Desmarca todos os produtos
	 */
	const desmarcarTodos = (): void => {
		produtosSelecionados.value.clear();
	};

	/**
	 * Computed para verificar se todos estão selecionados
	 */
	const todosSelecionados = computed(() => {
		return (
			produtosParaMigracao.value.length > 0 &&
			produtosParaMigracao.value.every((produto) => produtosSelecionados.value.has(produto.id))
		);
	});

	/**
	 * Computed para verificar se alguns estão selecionados
	 */
	const algunsSelecionados = computed(() => {
		return produtosSelecionados.value.size > 0 && !todosSelecionados.value;
	});

	/**
	 * Computed para contar produtos selecionados
	 */
	const totalSelecionados = computed(() => produtosSelecionados.value.size);

	/**
	 * Reset do estado
	 */
	const reset = (): void => {
		produtosParaMigracao.value = [];
		produtosSelecionados.value.clear();
		error.value = null;
		isLoading.value = false;
	};

	return {
		// Estados
		produtosParaMigracao: readonly(produtosParaMigracao),
		produtosSelecionados: readonly(produtosSelecionados),
		isLoading: readonly(isLoading),
		error: readonly(error),

		// Computeds
		todosSelecionados,
		algunsSelecionados,
		totalSelecionados,

		// Métodos
		verificarProdutos,
		buscarProdutos,
		migrarProdutos,
		migrarTodosProdutos,
		toggleProdutoSelecionado,
		selecionarTodos,
		desmarcarTodos,
		reset,
	};
};
