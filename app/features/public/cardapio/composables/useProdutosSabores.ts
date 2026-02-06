/**
 * 📌 useProdutosSabores
 *
 * Composable para buscar TODOS os produtos de uma categoria pai.
 * Usado no drawer de múltiplos sabores - sem paginação.
 */

import type { ProdutoPublico } from "../types/cardapio-publico";

export const useProdutosSabores = () => {
	const supabase = useSupabaseClient();

	/**
	 * Busca todos os produtos das subcategorias de uma categoria pai
	 */
	const buscarProdutosPorCategoriaPai = async (
		estabelecimentoId: string,
		subcategoriasIds: string[],
	): Promise<ProdutoPublico[]> => {
		if (subcategoriasIds.length === 0) return [];

		try {
			const { data: produtosData, error } = await supabase
				.from("produtos")
				.select(
					`
					id,
					nome,
					descricao,
					imagem_url,
					destaque,
					em_promocao,
					categoria_id,
					produto_variacoes (
						id,
						nome,
						preco,
						preco_promocional
					)
				`,
				)
				.eq("estabelecimento_id", estabelecimentoId)
				.eq("ativo", true)
				.in("categoria_id", subcategoriasIds)
				.order("nome", { ascending: true });

			if (error) {
				console.error("Erro ao buscar produtos:", error);
				return [];
			}

			return (produtosData ?? []).map((produto) => ({
				id: produto.id,
				nome: produto.nome,
				descricao: produto.descricao,
				imagem_url: produto.imagem_url,
				destaque: produto.destaque,
				em_promocao: produto.em_promocao,
				categoria_id: produto.categoria_id,
				permite_divisao_sabores: false,
				max_sabores_divisao: 0,
				variacoes: ((produto.produto_variacoes as unknown[]) ?? []).map((v) => {
					const variacao = v as Record<string, unknown>;
					return {
						id: variacao.id as string,
						nome: variacao.nome as string,
						preco: parseFloat(variacao.preco as string),
						preco_promocional: variacao.preco_promocional
							? parseFloat(variacao.preco_promocional as string)
							: null,
					};
				}),
				grupos_adicionais: [],
			}));
		} catch (err) {
			console.error("Erro ao buscar produtos:", err);
			return [];
		}
	};

	return {
		buscarProdutosPorCategoriaPai,
	};
};
