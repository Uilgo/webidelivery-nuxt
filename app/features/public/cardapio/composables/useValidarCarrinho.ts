/**
 * 📌 useValidarCarrinho
 *
 * Composable para validar o carrinho no backend antes de finalizar o pedido.
 * Garante que os preços não foram manipulados no frontend.
 */

import type { ItemCarrinho } from "../types/cardapio-publico";

interface ValidacaoCarrinhoResponse {
	valido: boolean;
	erros?: Array<{
		item: string;
		erro: string;
		preco_correto?: number;
		preco_enviado?: number;
	}>;
	itens?: Array<{
		produto_id: string;
		nome: string;
		variacao_id: string;
		variacao_nome: string;
		preco_unitario: number;
		quantidade: number;
		preco_total: number;
	}>;
	erro?: string;
}

export const useValidarCarrinho = () => {
	const supabase = useSupabaseClient();

	/**
	 * Valida o carrinho no backend
	 * Recalcula todos os preços do zero para garantir integridade
	 */
	const validar = async (
		estabelecimentoId: string,
		itens: ItemCarrinho[],
	): Promise<ValidacaoCarrinhoResponse> => {
		try {
			// Formata itens para enviar ao backend
			const itensFormatados = itens.map((item) => {
				if (!item.variacao) {
					throw new Error(`Item ${item.nome} não possui variação selecionada`);
				}

				return {
					produto_id: item.produto_id,
					nome: item.nome,
					variacao: {
						id: item.variacao.id,
						nome: item.variacao.nome,
					},
					adicionais: item.adicionais.map((a) => ({
						id: a.id,
						nome: a.nome,
						quantidade: a.quantidade,
					})),
					quantidade: item.quantidade,
					preco_unitario: item.preco_unitario,
					preco_total: item.preco_total,
				};
			});

			// Chama função RPC no Supabase
			const { data, error } = await supabase.rpc("fn_rpc_pedidos_validar_carrinho", {
				p_estabelecimento_id: estabelecimentoId,
				p_itens: itensFormatados,
			});

			if (error) {
				console.error("Erro ao validar carrinho:", error);
				return {
					valido: false,
					erro: "Erro ao validar carrinho. Tente novamente.",
				};
			}

			return data as ValidacaoCarrinhoResponse;
		} catch (err) {
			console.error("Erro inesperado ao validar carrinho:", err);
			return {
				valido: false,
				erro: "Erro inesperado. Tente novamente.",
			};
		}
	};

	return {
		validar,
	};
};
