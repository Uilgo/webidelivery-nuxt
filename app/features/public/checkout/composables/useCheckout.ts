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
	DadosAgendamento,
	TipoEntrega,
} from "~/features/public/checkout/types/checkout";
import { useCheckoutStorage } from "~/features/public/checkout/composables/useCheckoutStorage";
import type { ItemCarrinho } from "~/features/public/cardapio/types/cardapio-publico";
import {
	dadosClienteSchema,
	enderecoEntregaSchema,
	dadosPagamentoSchema,
	checkoutDataComValidacaoSchema,
} from "#shared/schemas/checkout";

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
		// Valida dados do cliente
		const validacao = dadosClienteSchema.safeParse(dados);

		if (!validacao.success) {
			const primeiroErro = validacao.error.issues[0];
			throw new Error(primeiroErro?.message || "Dados do cliente inválidos");
		}

		state.value.dados.cliente = validacao.data;
		salvarDadosCliente(validacao.data);
		proximaEtapa();
	};

	/**
	 * Salva tipo de entrega, endereço e agendamento (Etapa 2)
	 */
	const salvarEntrega = (
		tipo: TipoEntrega,
		endereco?: EnderecoEntrega,
		agendamento?: DadosAgendamento,
	): void => {
		state.value.dados.tipo_entrega = tipo;

		if (tipo === "delivery" && endereco) {
			// Valida endereço de entrega
			const validacao = enderecoEntregaSchema.safeParse(endereco);

			if (!validacao.success) {
				const primeiroErro = validacao.error.issues[0];
				throw new Error(primeiroErro?.message || "Endereço de entrega inválido");
			}

			state.value.dados.endereco = validacao.data;
			salvarEndereco(validacao.data);
		} else {
			state.value.dados.endereco = undefined;
		}

		// Salva dados de agendamento se fornecidos
		if (agendamento) {
			state.value.dados.agendamento = agendamento;
		}

		proximaEtapa();
	};

	/**
	 * Salva forma de pagamento (Etapa 3)
	 */
	const salvarPagamento = (dados: DadosPagamento): void => {
		// Valida dados de pagamento
		const validacao = dadosPagamentoSchema.safeParse(dados);

		if (!validacao.success) {
			const primeiroErro = validacao.error.issues[0];
			throw new Error(primeiroErro?.message || "Dados de pagamento inválidos");
		}

		state.value.dados.pagamento = validacao.data;
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

			// Valida dados completos do checkout
			const validacao = checkoutDataComValidacaoSchema.safeParse(dados);

			if (!validacao.success) {
				const primeiroErro = validacao.error.issues[0];
				throw new Error(primeiroErro?.message || "Dados do checkout inválidos");
			}

			const dadosValidados = validacao.data;

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
				dadosValidados.tipo_entrega === "delivery" && dadosValidados.endereco
					? {
							rua: dadosValidados.endereco.rua,
							numero: dadosValidados.endereco.numero,
							complemento: dadosValidados.endereco.complemento || null,
							bairro: dadosValidados.endereco.bairro,
							cidade: dadosValidados.endereco.cidade,
							estado: dadosValidados.endereco.estado,
							cep: dadosValidados.endereco.cep,
							referencia: dadosValidados.endereco.referencia || null,
						}
					: {};

			/**
			 * Chamar RPC para criar pedido
			 */
			const { data: pedidoId, error } = await supabase.rpc("fn_pedidos_criar", {
				p_estabelecimento_id: estabelecimentoId,
				p_tipo_entrega: dadosValidados.tipo_entrega,
				p_cliente_nome: dadosValidados.cliente.nome,
				p_cliente_telefone: dadosValidados.cliente.telefone,
				p_cliente_email: dadosValidados.cliente.email || null,
				p_endereco: endereco,
				p_forma_pagamento: dadosValidados.pagamento.forma_pagamento,
				p_troco_para: dadosValidados.pagamento.troco_para || null,
				p_observacoes: dadosValidados.observacoes || null,
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
