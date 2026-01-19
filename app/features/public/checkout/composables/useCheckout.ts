/**
 * 📌 useCheckout
 *
 * Composable principal do fluxo de checkout.
 * Gerencia estado, navegação entre etapas e validações.
 */

import type {
	CheckoutState,
	EtapaCheckout,
	DadosCliente,
	EnderecoEntrega,
	DadosPagamento,
	TipoEntrega,
} from "~/features/public/checkout/types/checkout";
import { useCheckoutStorage } from "~/features/public/checkout/composables/useCheckoutStorage";
import type { ItemCarrinho } from "~/features/public/cardapio/types/cardapio-publico";

export const useCheckout = () => {
	const { salvarDadosCliente, carregarDadosCliente, salvarEndereco, carregarEndereco } =
		useCheckoutStorage();

	/**
	 * Estado do checkout
	 */
	const state = useState<CheckoutState>("checkout", () => ({
		etapa_atual: 1,
		dados: {},
		loading: false,
		erro: undefined,
	}));

	/**
	 * Carrega dados salvos do localStorage ao iniciar
	 */
	const inicializar = (): void => {
		const clienteSalvo = carregarDadosCliente();
		const enderecoSalvo = carregarEndereco();

		if (clienteSalvo) {
			state.value.dados.cliente = clienteSalvo;
		}

		if (enderecoSalvo) {
			state.value.dados.endereco = enderecoSalvo;
		}
	};

	/**
	 * Avança para próxima etapa
	 */
	const proximaEtapa = (): void => {
		if (state.value.etapa_atual < 4) {
			state.value.etapa_atual = (state.value.etapa_atual + 1) as EtapaCheckout;
		}
	};

	/**
	 * Volta para etapa anterior
	 */
	const etapaAnterior = (): void => {
		if (state.value.etapa_atual > 1) {
			state.value.etapa_atual = (state.value.etapa_atual - 1) as EtapaCheckout;
		}
	};

	/**
	 * Vai para uma etapa específica
	 */
	const irParaEtapa = (etapa: EtapaCheckout): void => {
		state.value.etapa_atual = etapa;
	};

	/**
	 * Salva dados do cliente (Etapa 1)
	 */
	const salvarCliente = (dados: DadosCliente): void => {
		state.value.dados.cliente = dados;
		salvarDadosCliente(dados);
		proximaEtapa();
	};

	/**
	 * Salva tipo de entrega e endereço (Etapa 2)
	 */
	const salvarEntrega = (tipo: TipoEntrega, endereco?: EnderecoEntrega): void => {
		state.value.dados.tipo_entrega = tipo;

		if (tipo === "delivery" && endereco) {
			state.value.dados.endereco = endereco;
			salvarEndereco(endereco);
		} else {
			state.value.dados.endereco = undefined;
		}

		proximaEtapa();
	};

	/**
	 * Salva forma de pagamento (Etapa 3)
	 */
	const salvarPagamento = (dados: DadosPagamento): void => {
		state.value.dados.pagamento = dados;
		proximaEtapa();
	};

	/**
	 * Salva observações (Etapa 4)
	 */
	const salvarObservacoes = (observacoes: string): void => {
		state.value.dados.observacoes = observacoes;
	};

	/**
	 * Finaliza o pedido
	 */
	const finalizarPedido = async (
		estabelecimentoId: string,
		itens: ItemCarrinho[],
	): Promise<string | null> => {
		state.value.loading = true;
		state.value.erro = undefined;

		try {
			const supabase = useSupabaseClient();
			const { dados } = state.value;

			if (!dados.cliente || !dados.tipo_entrega || !dados.pagamento) {
				throw new Error("Dados incompletos para finalizar o pedido");
			}

			/**
			 * Formatar itens para a RPC
			 */
			const itensFormatados = itens.map((item) => ({
				produto_id: item.produto_id || "",
				variacao_id: item.variacao?.id || null,
				produto_nome: item.nome,
				variacao_nome: item.variacao?.nome || null,
				quantidade: item.quantidade,
				preco_unitario: item.variacao?.preco || 0,
				observacoes: item.observacao || null,
				adicionais: item.adicionais.map(
					(adicional: { id: string; nome: string; quantidade: number; preco: number }) => ({
						adicional_id: adicional.id,
						adicional_nome: adicional.nome,
						quantidade: adicional.quantidade,
						preco_unitario: adicional.preco,
					}),
				),
			}));

			/**
			 * Formatar endereço (apenas para delivery)
			 */
			const endereco =
				dados.tipo_entrega === "delivery" && dados.endereco
					? {
							rua: dados.endereco.rua,
							numero: dados.endereco.numero,
							complemento: dados.endereco.complemento || null,
							bairro: dados.endereco.bairro,
							cidade: dados.endereco.cidade,
							estado: dados.endereco.estado,
							cep: dados.endereco.cep,
							referencia: dados.endereco.referencia || null,
						}
					: {};

			/**
			 * Chamar RPC para criar pedido
			 */
			const { data: pedidoId, error } = await supabase.rpc("fn_pedidos_criar", {
				p_estabelecimento_id: estabelecimentoId,
				p_tipo_entrega: dados.tipo_entrega,
				p_cliente_nome: dados.cliente.nome,
				p_cliente_telefone: dados.cliente.telefone,
				p_cliente_email: dados.cliente.email || null,
				p_endereco: endereco,
				p_forma_pagamento: dados.pagamento.forma_pagamento,
				p_troco_para: dados.pagamento.troco_para || null,
				p_observacoes: dados.observacoes || null,
				p_itens: itensFormatados,
			});

			if (error) {
				throw error;
			}

			if (!pedidoId) {
				throw new Error("Pedido não foi criado");
			}

			return pedidoId;
		} catch (error) {
			state.value.erro = "Erro ao finalizar pedido. Tente novamente.";
			return null;
		} finally {
			state.value.loading = false;
		}
	};

	/**
	 * Reseta o checkout
	 */
	const resetar = (): void => {
		state.value = {
			etapa_atual: 1,
			dados: {},
			loading: false,
			erro: undefined,
		};
	};

	/**
	 * Verifica se pode avançar para próxima etapa
	 */
	const podeAvancar = computed((): boolean => {
		const { etapa_atual, dados } = state.value;

		switch (etapa_atual) {
			case 1:
				return !!(dados.cliente?.nome && dados.cliente?.telefone);
			case 2:
				if (dados.tipo_entrega === "delivery") {
					return !!(
						dados.endereco?.cep &&
						dados.endereco?.rua &&
						dados.endereco?.numero &&
						dados.endereco?.bairro &&
						dados.endereco?.cidade &&
						dados.endereco?.estado
					);
				}
				return !!dados.tipo_entrega;
			case 3:
				return !!dados.pagamento?.forma_pagamento;
			case 4:
				return true;
			default:
				return false;
		}
	});

	return {
		state: readonly(state),
		inicializar,
		proximaEtapa,
		etapaAnterior,
		irParaEtapa,
		salvarCliente,
		salvarEntrega,
		salvarPagamento,
		salvarObservacoes,
		finalizarPedido,
		resetar,
		podeAvancar,
	};
};
