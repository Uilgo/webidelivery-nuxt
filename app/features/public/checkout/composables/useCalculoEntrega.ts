/**
 * 📌 useCalculoEntrega - Cálculo Dinâmico de Tempo e Taxa de Entrega
 *
 * Responsável por:
 * - Calcular tempo de entrega baseado no CEP/distância
 * - Calcular taxa de entrega baseada nas configurações
 * - Integrar com dados reais do estabelecimento
 */

import type { TaxaDistancia, TaxaLocalizacao } from "#shared/types/estabelecimentos";
import { useEstabelecimentoStore } from "~/stores/estabelecimento";

export interface CalculoEntrega {
	tempoMin: number;
	tempoMax: number;
	taxa: number;
	disponivel: boolean;
	motivo?: string;
}

export interface UseCalculoEntregaReturn {
	// Métodos
	calcularEntregaPorCEP: (cep: string) => Promise<CalculoEntrega>;
	calcularEntregaPorBairro: (bairro: string) => CalculoEntrega;
}

export const useCalculoEntrega = (): UseCalculoEntregaReturn => {
	const estabelecimentoStore = useEstabelecimentoStore();

	/**
	 * Obter configurações de entrega do estabelecimento
	 */
	const configEntrega = computed(() => {
		const estabelecimento = estabelecimentoStore.estabelecimento;
		if (!estabelecimento?.config_geral) return null;

		const configGeral = estabelecimento.config_geral as Record<string, unknown>;
		return {
			tipo_taxa_entrega: (configGeral.tipo_taxa_entrega as string) || "taxa_unica",
			taxa_entrega: (configGeral.taxa_entrega as number) || 0,
			taxas_por_distancia: (configGeral.taxas_por_distancia || []) as TaxaDistancia[],
			taxas_por_localizacao: (configGeral.taxas_por_localizacao || []) as TaxaLocalizacao[],
			raio_entrega_km: (configGeral.raio_entrega_km as number) ?? 0,
			valor_minimo_pedido: (configGeral.valor_minimo_pedido as number) || 0,
		};
	});

	/**
	 * Calcular distância aproximada baseada no CEP (simulação)
	 * TODO: Integrar com API real de geolocalização
	 */
	const calcularDistanciaAproximada = async (cep: string): Promise<number> => {
		// Simulação baseada nos últimos dígitos do CEP
		// Em produção, usar API de geolocalização real
		const ultimosDigitos = parseInt(cep.replace(/\D/g, "").slice(-3));

		// Simular distância entre 0.5km e 8km baseado no CEP
		const distanciaSimulada = 0.5 + (ultimosDigitos / 1000) * 7.5;

		// Adicionar pequeno delay para simular chamada de API
		await new Promise((resolve) => setTimeout(resolve, 500));

		return Math.round(distanciaSimulada * 10) / 10; // Arredondar para 1 casa decimal
	};

	/**
	 * Calcular entrega por CEP (com distância)
	 */
	const calcularEntregaPorCEP = async (cep: string): Promise<CalculoEntrega> => {
		const config = configEntrega.value;

		if (!config) {
			return {
				tempoMin: 30,
				tempoMax: 60,
				taxa: 0,
				disponivel: false,
				motivo: "Configurações não encontradas",
			};
		}

		try {
			const distancia = await calcularDistanciaAproximada(cep);

			// Verificar se está dentro do raio de entrega (se raio > 0)
			if (config.raio_entrega_km > 0 && distancia > config.raio_entrega_km) {
				return {
					tempoMin: 0,
					tempoMax: 0,
					taxa: 0,
					disponivel: false,
					motivo: `Fora da área de entrega (${distancia}km > ${config.raio_entrega_km}km)`,
				};
			}

			// Calcular baseado no tipo de taxa
			switch (config.tipo_taxa_entrega) {
				case "sem_taxa":
					return {
						tempoMin: Math.max(15, Math.round(distancia * 3)), // 3 min por km, mín 15min
						tempoMax: Math.max(25, Math.round(distancia * 5)), // 5 min por km, mín 25min
						taxa: 0,
						disponivel: true,
					};

				case "taxa_unica":
					return {
						tempoMin: Math.max(15, Math.round(distancia * 3)),
						tempoMax: Math.max(25, Math.round(distancia * 5)),
						taxa: config.taxa_entrega,
						disponivel: true,
					};

				case "taxa_distancia":
					// Encontrar faixa de distância correspondente
					const faixaDistancia = config.taxas_por_distancia
						.filter((t) => t.status === "ativado")
						.find((t) => distancia <= t.distancia_km);

					if (!faixaDistancia) {
						return {
							tempoMin: 0,
							tempoMax: 0,
							taxa: 0,
							disponivel: false,
							motivo: `Nenhuma faixa de distância configurada para ${distancia}km`,
						};
					}

					return {
						tempoMin: faixaDistancia.tempo_min,
						tempoMax: faixaDistancia.tempo_max,
						taxa: faixaDistancia.taxa_valor,
						disponivel: true,
					};

				case "taxa_localizacao":
					// Para CEP, não temos bairro específico, usar taxa padrão
					return {
						tempoMin: Math.max(15, Math.round(distancia * 3)),
						tempoMax: Math.max(25, Math.round(distancia * 5)),
						taxa: config.taxa_entrega || 0,
						disponivel: true,
					};

				default:
					return {
						tempoMin: 30,
						tempoMax: 60,
						taxa: 0,
						disponivel: false,
						motivo: "Tipo de taxa não reconhecido",
					};
			}
		} catch (error) {
			console.error("[useCalculoEntrega] Erro ao calcular entrega:", error);
			return {
				tempoMin: 30,
				tempoMax: 60,
				taxa: 0,
				disponivel: false,
				motivo: "Erro ao calcular distância",
			};
		}
	};

	/**
	 * Calcular entrega por bairro (taxa por localização)
	 */
	const calcularEntregaPorBairro = (bairro: string): CalculoEntrega => {
		const config = configEntrega.value;

		if (!config) {
			return {
				tempoMin: 30,
				tempoMax: 60,
				taxa: 0,
				disponivel: false,
				motivo: "Configurações não encontradas",
			};
		}

		if (config.tipo_taxa_entrega !== "taxa_localizacao") {
			// Se não é taxa por localização, usar cálculo padrão
			return {
				tempoMin: 20,
				tempoMax: 40,
				taxa: config.taxa_entrega || 0,
				disponivel: true,
			};
		}

		// Procurar bairro nas configurações
		const bairroConfig = config.taxas_por_localizacao
			.filter((t) => t.status === "ativado")
			.find((t) => t.nome.toLowerCase().includes(bairro.toLowerCase()));

		if (!bairroConfig) {
			return {
				tempoMin: 0,
				tempoMax: 0,
				taxa: 0,
				disponivel: false,
				motivo: `Bairro "${bairro}" não atendido`,
			};
		}

		return {
			tempoMin: bairroConfig.tempo_min,
			tempoMax: bairroConfig.tempo_max,
			taxa: bairroConfig.taxa_valor,
			disponivel: true,
		};
	};

	return {
		calcularEntregaPorCEP,
		calcularEntregaPorBairro,
	};
};
