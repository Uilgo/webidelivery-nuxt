/**
 * 📌 useValidarCupom
 *
 * Composable para validar cupons de desconto no cardápio público.
 * Integra com a função RPC fn_rpc_marketing_validar_cupom do Supabase.
 */

export interface ResultadoValidacaoCupom {
	valido: boolean;
	motivo_invalido: string | null;
	cupom_id: string | null;
	tipo: "percentual" | "valor_fixo" | "frete_gratis" | null;
	valor_desconto: number;
	valor_minimo: number | null;
}

export const useValidarCupom = () => {
	const supabase = useSupabaseClient();

	/**
	 * Valida um cupom de desconto
	 *
	 * @param estabelecimentoId - ID do estabelecimento
	 * @param codigo - Código do cupom (case-insensitive)
	 * @param valorPedido - Valor total do pedido (para validar valor mínimo)
	 * @returns Resultado da validação com dados do cupom
	 */
	const validarCupom = async (
		estabelecimentoId: string,
		codigo: string,
		valorPedido: number,
	): Promise<ResultadoValidacaoCupom> => {
		try {
			// Chama a função RPC de validação
			const { data, error } = await supabase.rpc("fn_rpc_marketing_validar_cupom", {
				p_estabelecimento_id: estabelecimentoId,
				p_codigo: codigo.trim(),
				p_valor_pedido: valorPedido,
			});

			if (error) {
				console.error("Erro ao validar cupom:", error);
				return {
					valido: false,
					motivo_invalido: "Erro ao validar cupom. Tente novamente.",
					cupom_id: null,
					tipo: null,
					valor_desconto: 0,
					valor_minimo: null,
				};
			}

			// A função RPC retorna um array com 1 resultado
			if (!data || data.length === 0) {
				return {
					valido: false,
					motivo_invalido: "Cupom não encontrado",
					cupom_id: null,
					tipo: null,
					valor_desconto: 0,
					valor_minimo: null,
				};
			}

			const resultado = data[0];

			return {
				valido: resultado.valido,
				motivo_invalido: resultado.motivo_invalido || null,
				cupom_id: resultado.cupom_id || null,
				tipo: resultado.tipo || null,
				valor_desconto: parseFloat(resultado.valor_desconto || "0"),
				valor_minimo: resultado.valor_minimo ? parseFloat(resultado.valor_minimo) : null,
			};
		} catch (err) {
			console.error("Erro ao validar cupom:", err);
			return {
				valido: false,
				motivo_invalido: "Erro ao validar cupom. Tente novamente.",
				cupom_id: null,
				tipo: null,
				valor_desconto: 0,
				valor_minimo: null,
			};
		}
	};

	/**
	 * Calcula o valor do desconto baseado no tipo do cupom
	 *
	 * @param tipo - Tipo do cupom (percentual, valor_fixo, frete_gratis)
	 * @param valorDesconto - Valor do desconto configurado no cupom
	 * @param valorPedido - Valor total do pedido
	 * @returns Valor do desconto a ser aplicado
	 */
	const calcularDesconto = (
		tipo: "percentual" | "valor_fixo" | "frete_gratis",
		valorDesconto: number,
		valorPedido: number,
	): number => {
		switch (tipo) {
			case "percentual":
				// Desconto percentual (ex: 10% de R$ 100 = R$ 10)
				return (valorPedido * valorDesconto) / 100;

			case "valor_fixo":
				// Desconto fixo (ex: R$ 5 de desconto)
				return valorDesconto;

			case "frete_gratis":
				// Frete grátis será implementado no checkout
				// Por enquanto retorna 0 (não afeta o valor do pedido aqui)
				return 0;

			default:
				return 0;
		}
	};

	return {
		validarCupom,
		calcularDesconto,
	};
};
