/**
 * 📌 usePedido
 *
 * Composable para buscar e acompanhar pedidos.
 */

import type { PedidoCompleto, StatusInfo } from "~/features/public/pedido/types/pedido";

export const usePedido = () => {
	const supabase = useSupabaseClient();

	/**
	 * Busca um pedido pelo CÓDIGO DE RASTREAMENTO (não mais por ID)
	 * @param codigoRastreamento - Código no formato XXXX-YYYY ou XXXXXXXX
	 * @returns Pedido completo ou null se não encontrado
	 */
	const buscarPedido = async (codigoRastreamento: string): Promise<PedidoCompleto | null> => {
		// Normaliza o código (remove hífen e converte para maiúsculas)
		const codigoNormalizado = codigoRastreamento.replace("-", "").toUpperCase();

		const { data: pedido, error: pedidoError } = await supabase
			.from("pedidos")
			.select("*")
			.eq("codigo_rastreamento", codigoNormalizado)
			.single();

		if (pedidoError || !pedido) {
			return null;
		}

		/**
		 * Buscar itens do pedido
		 */
		const { data: itens, error: itensError } = await supabase
			.from("pedido_itens")
			.select("*")
			.eq("pedido_id", pedido.id);

		if (itensError || !itens) {
			return null;
		}

		/**
		 * Buscar adicionais de cada item
		 */
		const itensComAdicionais = await Promise.all(
			itens.map(async (item) => {
				const { data: adicionais } = await supabase
					.from("pedido_itens_adicionais")
					.select("*")
					.eq("pedido_item_id", item.id);

				return {
					...item,
					adicionais: adicionais || [],
				};
			}),
		);

		return {
			...pedido,
			itens: itensComAdicionais,
		} as PedidoCompleto;
	};

	/**
	 * Retorna informações de exibição do status
	 */
	const getStatusInfo = (status: string): StatusInfo => {
		const statusMap: Record<string, StatusInfo> = {
			pendente: {
				label: "Aguardando Confirmação",
				cor: "text-yellow-600 bg-yellow-500/10 border-yellow-500/20",
				icone: "lucide:clock",
				descricao: "Seu pedido foi recebido e está aguardando confirmação do estabelecimento.",
			},
			aceito: {
				label: "Pedido Aceito",
				cor: "text-blue-600 bg-blue-500/10 border-blue-500/20",
				icone: "lucide:check-circle",
				descricao: "Seu pedido foi aceito e em breve entrará em preparo.",
			},
			preparo: {
				label: "Em Preparo",
				cor: "text-orange-600 bg-orange-500/10 border-orange-500/20",
				icone: "lucide:chef-hat",
				descricao: "Seu pedido está sendo preparado com todo carinho.",
			},
			pronto: {
				label: "Pedido Pronto",
				cor: "text-purple-600 bg-purple-500/10 border-purple-500/20",
				icone: "lucide:package-check",
				descricao: "Seu pedido está pronto e aguardando retirada/entrega.",
			},
			entrega: {
				label: "Saiu para Entrega",
				cor: "text-indigo-600 bg-indigo-500/10 border-indigo-500/20",
				icone: "lucide:bike",
				descricao: "Seu pedido saiu para entrega e chegará em breve.",
			},
			concluido: {
				label: "Pedido Concluído",
				cor: "text-green-600 bg-green-500/10 border-green-500/20",
				icone: "lucide:check-circle-2",
				descricao: "Seu pedido foi concluído. Obrigado pela preferência!",
			},
			cancelado: {
				label: "Pedido Cancelado",
				cor: "text-red-600 bg-red-500/10 border-red-500/20",
				icone: "lucide:x-circle",
				descricao: "Seu pedido foi cancelado.",
			},
		};

		return (
			statusMap[status] || {
				label: "Status Desconhecido",
				cor: "text-gray-600 bg-gray-500/10 border-gray-500/20",
				icone: "lucide:help-circle",
				descricao: "Status do pedido não identificado.",
			}
		);
	};

	/**
	 * Formata forma de pagamento para exibição
	 */
	const formatarFormaPagamento = (forma: string): string => {
		const mapa: Record<string, string> = {
			dinheiro: "Dinheiro",
			pix: "PIX",
			credito: "Cartão de Crédito",
			debito: "Cartão de Débito",
		};

		return mapa[forma] || forma;
	};

	/**
	 * Formata tipo de entrega para exibição
	 */
	const formatarTipoEntrega = (tipo: string): string => {
		const mapa: Record<string, string> = {
			delivery: "Entrega",
			retirada: "Retirada no local",
		};

		return mapa[tipo] || tipo;
	};

	return {
		buscarPedido,
		getStatusInfo,
		formatarFormaPagamento,
		formatarTipoEntrega,
	};
};
