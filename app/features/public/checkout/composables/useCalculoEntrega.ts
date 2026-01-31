/**
 * 📌 useCalculoEntrega - Cálculo Dinâmico de Tempo e Taxa de Entrega
 *
 * Responsável por:
 * - Validar cidade do cliente (primeira barreira)
 * - Calcular tempo de entrega baseado no CEP/bairro
 * - Calcular taxa de entrega baseada nas configurações
 * - Matching inteligente de bairro com normalização
 * - Aplicar taxa padrão quando bairro não cadastrado
 */

import type { TaxaLocalizacao } from "#shared/types/estabelecimentos";
import { useEstabelecimentoStore } from "~/stores/estabelecimento";

export interface CalculoEntrega {
	tempoMin: number;
	tempoMax: number;
	taxa: number;
	disponivel: boolean;
	cidadeValida: boolean; // Nova propriedade para validação de cidade
	motivo?: string;
	tipoTaxa?: string; // Tipo de taxa detectado
}

export interface UseCalculoEntregaReturn {
	// Métodos
	calcularEntregaPorCEP: (cep: string, cidade: string, bairro: string) => Promise<CalculoEntrega>;
	calcularEntregaPorBairro: (bairro: string, cidade: string) => CalculoEntrega;
	validarCidade: (cidade: string) => boolean;
}

/**
 * Normalizar string para matching (remove acentos, lowercase, trim)
 * ✅ CORRIGIDO: Validar se texto existe antes de processar
 */
const normalizarTexto = (texto: string | undefined | null): string => {
	if (!texto) return "";
	return texto
		.toLowerCase()
		.trim()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, ""); // Remove acentos
};

export const useCalculoEntrega = (): UseCalculoEntregaReturn => {
	const estabelecimentoStore = useEstabelecimentoStore();

	/**
	 * Detectar tipo de taxa de entrega automaticamente baseado nas configurações
	 */
	const detectarTipoTaxa = (configGeral: Record<string, unknown>): string => {
		// Se tipo_taxa_entrega está definido, usar ele
		if (configGeral.tipo_taxa_entrega) {
			return configGeral.tipo_taxa_entrega as string;
		}

		// Detectar automaticamente baseado nas configurações disponíveis
		const taxasPorLocalizacao = (configGeral.taxas_por_localizacao || []) as TaxaLocalizacao[];
		const taxaEntrega = configGeral.taxa_entrega as number | undefined;

		// Se tem taxas por localização configuradas e ativas
		if (taxasPorLocalizacao.length > 0 && taxasPorLocalizacao.some((t) => t.status === "ativado")) {
			return "taxa_localizacao";
		}

		// Se tem taxa_entrega definida e > 0
		if (taxaEntrega !== undefined && taxaEntrega > 0) {
			return "taxa_unica";
		}

		// Se taxa_entrega é 0 ou não definida
		return "sem_taxa";
	};

	/**
	 * Obter configurações de entrega do estabelecimento
	 */
	const configEntrega = computed(() => {
		const estabelecimento = estabelecimentoStore.estabelecimento;
		if (!estabelecimento?.config_geral) return null;

		const configGeral = estabelecimento.config_geral as Record<string, unknown>;
		const tipoTaxa = detectarTipoTaxa(configGeral);

		return {
			tipo_taxa_entrega: tipoTaxa,
			taxa_entrega: (configGeral.taxa_entrega as number) || 0,
			cidades_atendidas: (configGeral.cidades_atendidas as string[]) || [],
			taxas_por_localizacao: (configGeral.taxas_por_localizacao || []) as TaxaLocalizacao[],
			taxa_padrao_outros_bairros: (configGeral.taxa_padrao_outros_bairros as number) || 0,
			tempo_preparo_min: (configGeral.tempo_preparo_min as number) || 30,
			tempo_preparo_max: (configGeral.tempo_preparo_max as number) || 60,
			valor_minimo_pedido: (configGeral.valor_minimo_pedido as number) || 0,
		};
	});

	/**
	 * Validar se cidade está na lista de cidades atendidas
	 */
	const validarCidade = (cidade: string): boolean => {
		const config = configEntrega.value;
		if (!config || !config.cidades_atendidas.length) return false;

		const cidadeNormalizada = normalizarTexto(cidade);

		return config.cidades_atendidas.some((cidadeAtendida) => {
			const cidadeAtendidaNormalizada = normalizarTexto(cidadeAtendida);
			return (
				cidadeAtendidaNormalizada === cidadeNormalizada ||
				cidadeAtendidaNormalizada.includes(cidadeNormalizada) ||
				cidadeNormalizada.includes(cidadeAtendidaNormalizada)
			);
		});
	};

	/**
	 * Matching inteligente de bairro (normalização + match parcial)
	 */
	const encontrarBairro = (
		bairro: string,
		cidade: string,
	): TaxaLocalizacao | "taxa_padrao" | null => {
		const config = configEntrega.value;
		if (!config) return null;

		const bairroNormalizado = normalizarTexto(bairro);
		const cidadeNormalizada = normalizarTexto(cidade);

		// Filtrar apenas bairros ativos da cidade correta
		const bairrosAtivos = config.taxas_por_localizacao.filter((t) => {
			// ✅ Validar se cidade existe antes de normalizar
			if (!t.cidade) return false; // Ignorar bairros sem cidade

			const bairroCidadeNormalizada = normalizarTexto(t.cidade);
			return (
				t.status === "ativado" &&
				(bairroCidadeNormalizada === cidadeNormalizada ||
					bairroCidadeNormalizada.includes(cidadeNormalizada) ||
					cidadeNormalizada.includes(bairroCidadeNormalizada))
			);
		});

		// 1. Tentar match exato
		let bairroEncontrado = bairrosAtivos.find((t) => {
			const nomeBairroNormalizado = normalizarTexto(t.nome);
			return nomeBairroNormalizado === bairroNormalizado;
		});

		// 2. Tentar match parcial (contém)
		if (!bairroEncontrado) {
			bairroEncontrado = bairrosAtivos.find((t) => {
				const nomeBairroNormalizado = normalizarTexto(t.nome);
				return (
					nomeBairroNormalizado.includes(bairroNormalizado) ||
					bairroNormalizado.includes(nomeBairroNormalizado)
				);
			});
		}

		// 3. Se encontrou, retornar
		if (bairroEncontrado) {
			return bairroEncontrado;
		}

		// 4. Se não encontrou e tem taxa padrão, retornar indicador
		if (config.taxa_padrao_outros_bairros && config.taxa_padrao_outros_bairros > 0) {
			return "taxa_padrao";
		}

		// 5. Não encontrou e não tem taxa padrão
		return null;
	};

	/**
	 * Calcular entrega por CEP (com validação de cidade e bairro)
	 */
	const calcularEntregaPorCEP = async (
		_cep: string,
		cidade: string,
		bairro: string,
	): Promise<CalculoEntrega> => {
		const config = configEntrega.value;

		if (!config) {
			return {
				tempoMin: 30,
				tempoMax: 60,
				taxa: 0,
				disponivel: false,
				cidadeValida: false,
				motivo: "Configurações não encontradas",
				tipoTaxa: "taxa_unica",
			};
		}

		// PRIMEIRA BARREIRA: Validar cidade
		const cidadeValida = validarCidade(cidade);

		if (!cidadeValida) {
			const cidadesFormatadas = config.cidades_atendidas.join(", ");
			return {
				tempoMin: 0,
				tempoMax: 0,
				taxa: 0,
				disponivel: false,
				cidadeValida: false,
				motivo: `Não entregamos em ${cidade}. Entregamos em: ${cidadesFormatadas}`,
				tipoTaxa: config.tipo_taxa_entrega,
			};
		}

		try {
			// Calcular baseado no tipo de taxa
			switch (config.tipo_taxa_entrega) {
				case "sem_taxa": {
					const tempoBase = 20;
					return {
						tempoMin: tempoBase,
						tempoMax: tempoBase + 10,
						taxa: 0,
						disponivel: true,
						cidadeValida: true,
						tipoTaxa: "sem_taxa",
					};
				}

				case "taxa_unica": {
					const tempoBase = 20;
					return {
						tempoMin: tempoBase,
						tempoMax: tempoBase + 10,
						taxa: config.taxa_entrega,
						disponivel: true,
						cidadeValida: true,
						tipoTaxa: "taxa_unica",
					};
				}

				case "taxa_localizacao": {
					// Matching inteligente de bairro
					const resultado = encontrarBairro(bairro, cidade);

					if (resultado === null) {
						// Sem match e sem taxa padrão - BLOQUEAR
						const bairrosDaCidade = config.taxas_por_localizacao
							.filter(
								(t) =>
									t.status === "ativado" &&
									normalizarTexto(t.cidade).includes(normalizarTexto(cidade)),
							)
							.map((t) => t.nome)
							.join(", ");

						return {
							tempoMin: 0,
							tempoMax: 0,
							taxa: 0,
							disponivel: false,
							cidadeValida: true,
							motivo: `Não entregamos no bairro ${bairro}. Bairros atendidos em ${cidade}: ${bairrosDaCidade}`,
							tipoTaxa: "taxa_localizacao",
						};
					}

					if (resultado === "taxa_padrao") {
						// Aplicar taxa padrão
						return {
							tempoMin: config.tempo_preparo_min,
							tempoMax: config.tempo_preparo_max,
							taxa: config.taxa_padrao_outros_bairros || 0,
							disponivel: true,
							cidadeValida: true,
							motivo: `Taxa padrão aplicada - Seu bairro não está na lista específica`,
							tipoTaxa: "taxa_localizacao",
						};
					}

					// Match encontrado - aplicar taxa específica
					return {
						tempoMin: resultado.tempo_min,
						tempoMax: resultado.tempo_max,
						taxa: resultado.taxa_valor,
						disponivel: true,
						cidadeValida: true,
						tipoTaxa: "taxa_localizacao",
					};
				}

				default:
					return {
						tempoMin: 30,
						tempoMax: 60,
						taxa: 0,
						disponivel: false,
						cidadeValida: true,
						motivo: "Tipo de taxa não reconhecido",
						tipoTaxa: config.tipo_taxa_entrega,
					};
			}
		} catch (error) {
			console.error("[useCalculoEntrega] Erro ao calcular entrega:", error);
			return {
				tempoMin: 30,
				tempoMax: 60,
				taxa: 0,
				disponivel: false,
				cidadeValida: true,
				motivo: "Erro ao calcular entrega",
				tipoTaxa: config.tipo_taxa_entrega,
			};
		}
	};

	/**
	 * Calcular entrega por bairro (taxa por localização)
	 */
	const calcularEntregaPorBairro = (bairro: string, cidade: string): CalculoEntrega => {
		const config = configEntrega.value;

		if (!config) {
			return {
				tempoMin: 30,
				tempoMax: 60,
				taxa: 0,
				disponivel: false,
				cidadeValida: false,
				motivo: "Configurações não encontradas",
				tipoTaxa: "taxa_unica",
			};
		}

		// Validar cidade primeiro
		const cidadeValida = validarCidade(cidade);

		if (!cidadeValida) {
			const cidadesFormatadas = config.cidades_atendidas.join(", ");
			return {
				tempoMin: 0,
				tempoMax: 0,
				taxa: 0,
				disponivel: false,
				cidadeValida: false,
				motivo: `Não entregamos em ${cidade}. Entregamos em: ${cidadesFormatadas}`,
				tipoTaxa: config.tipo_taxa_entrega,
			};
		}

		if (config.tipo_taxa_entrega !== "taxa_localizacao") {
			// Se não é taxa por localização, usar cálculo padrão
			return {
				tempoMin: 20,
				tempoMax: 40,
				taxa: config.taxa_entrega || 0,
				disponivel: true,
				cidadeValida: true,
				tipoTaxa: config.tipo_taxa_entrega,
			};
		}

		// Matching inteligente de bairro
		const resultado = encontrarBairro(bairro, cidade);

		if (resultado === null) {
			// Sem match e sem taxa padrão - BLOQUEAR
			const bairrosDaCidade = config.taxas_por_localizacao
				.filter(
					(t) =>
						t.status === "ativado" && normalizarTexto(t.cidade).includes(normalizarTexto(cidade)),
				)
				.map((t) => t.nome)
				.join(", ");

			return {
				tempoMin: 0,
				tempoMax: 0,
				taxa: 0,
				disponivel: false,
				cidadeValida: true,
				motivo: `Não entregamos no bairro ${bairro}. Bairros atendidos em ${cidade}: ${bairrosDaCidade}`,
				tipoTaxa: "taxa_localizacao",
			};
		}

		if (resultado === "taxa_padrao") {
			// Aplicar taxa padrão
			return {
				tempoMin: config.tempo_preparo_min,
				tempoMax: config.tempo_preparo_max,
				taxa: config.taxa_padrao_outros_bairros || 0,
				disponivel: true,
				cidadeValida: true,
				motivo: `Taxa padrão aplicada - Seu bairro não está na lista específica`,
				tipoTaxa: "taxa_localizacao",
			};
		}

		// Match encontrado - aplicar taxa específica
		return {
			tempoMin: resultado.tempo_min,
			tempoMax: resultado.tempo_max,
			taxa: resultado.taxa_valor,
			disponivel: true,
			cidadeValida: true,
			tipoTaxa: "taxa_localizacao",
		};
	};

	return {
		calcularEntregaPorCEP,
		calcularEntregaPorBairro,
		validarCidade,
	};
};
