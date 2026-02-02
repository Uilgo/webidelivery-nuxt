/**
 * 📌 useHorarioFuncionamento - Lógica de Horários para Checkout Público
 *
 * Responsável por:
 * - Verificar se estabelecimento está aberto/fechado
 * - Calcular próximos horários disponíveis
 * - Integrar com dados reais do estabelecimento
 */

import type {
	HorarioFuncionamento,
	HorarioExcecao,
	PeriodoFuncionamento,
} from "#shared/types/estabelecimentos";
import { useEstabelecimentoStore } from "~/stores/estabelecimento";

export interface UseHorarioFuncionamentoReturn {
	// Estados calculados
	estaAberto: Ref<boolean>;
	proximoHorario: Ref<string>;
	tempoPreparoMin: Ref<number>;
	tempoPreparoMax: Ref<number>;

	// Métodos
	calcularProximaEntrega: (tempoEntregaMin: number) => string;
	obterHorariosDisponiveis: (data: Date) => Array<{
		value: string;
		display: string;
		isProximoDisponivel?: boolean;
		tempoRestante?: string;
		diaSemana?: string;
	}>;
}

export const useHorarioFuncionamento = (): UseHorarioFuncionamentoReturn => {
	const estabelecimentoStore = useEstabelecimentoStore();

	/**
	 * Obter tempos de preparo
	 */
	const tempoPreparoMin = computed(() => {
		const estabelecimento = estabelecimentoStore.estabelecimento;
		if (!estabelecimento?.config_geral) return 30;

		const configGeral = estabelecimento.config_geral as Record<string, unknown>;
		return (configGeral.tempo_entrega_min as number) || 30;
	});

	const tempoPreparoMax = computed(() => {
		const estabelecimento = estabelecimentoStore.estabelecimento;
		if (!estabelecimento?.config_geral) return 45;

		const configGeral = estabelecimento.config_geral as Record<string, unknown>;
		return (configGeral.tempo_entrega_max as number) || 45;
	});

	/**
	 * Estado reativo: está aberto agora? (simulado por enquanto)
	 */
	const estaAberto = computed(() => {
		// TODO: Implementar lógica real baseada nos horários de funcionamento
		// Por enquanto, simular baseado no horário atual
		const agora = new Date();
		const hora = agora.getHours();
		return hora >= 18 && hora < 23; // Simular aberto das 18h às 23h
	});

	/**
	 * Próximo horário (simulado por enquanto)
	 */
	const proximoHorario = computed(() => {
		if (estaAberto.value) {
			return "Fecha às 23:00";
		} else {
			return "Abre às 18:00";
		}
	});

	/**
	 * Calcular próxima entrega baseada no tempo de preparo
	 */
	const calcularProximaEntrega = (tempoEntregaMin: number = 0): string => {
		const agora = new Date();
		const tempoTotalMin = tempoPreparoMin.value + tempoEntregaMin;
		const tempoTotalMax = tempoPreparoMax.value + tempoEntregaMin;

		if (estaAberto.value) {
			// Se está aberto, calcular baseado no tempo atual
			const proximoHorarioMin = new Date(agora.getTime() + tempoTotalMin * 60000);
			const proximoHorarioMax = new Date(agora.getTime() + tempoTotalMax * 60000);

			const horaMin = proximoHorarioMin.toLocaleTimeString("pt-BR", {
				hour: "2-digit",
				minute: "2-digit",
			});
			const horaMax = proximoHorarioMax.toLocaleTimeString("pt-BR", {
				hour: "2-digit",
				minute: "2-digit",
			});

			return `${horaMin}-${horaMax}`;
		} else {
			// Se está fechado, mostrar próximo horário de abertura
			return "18:45";
		}
	};

	/**
	 * Obter horários disponíveis para agendamento (simulado por enquanto)
	 */
	const obterHorariosDisponiveis = (data: Date) => {
		const horarios: Array<{
			value: string;
			display: string;
			isProximoDisponivel?: boolean;
			tempoRestante?: string;
			diaSemana?: string;
		}> = [];

		// Simular horários disponíveis
		const agora = new Date();
		const isHoje = data.toDateString() === agora.toDateString();

		// Gerar horários de 30 em 30 minutos das 18:00 às 22:30
		for (let hora = 18; hora <= 22; hora++) {
			for (let min = 0; min < 60; min += 30) {
				if (hora === 22 && min > 30) break; // Parar em 22:30

				const horarioStr = `${hora.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
				const horarioData = new Date(data);
				horarioData.setHours(hora, min, 0, 0);

				// Se é hoje, verificar se já passou + tempo de preparo
				if (isHoje) {
					const horarioComPreparo = new Date(horarioData.getTime() - tempoPreparoMin.value * 60000);
					if (horarioComPreparo <= agora) continue;

					// Calcular tempo restante
					const diffMs = horarioData.getTime() - agora.getTime();
					const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
					const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

					const item: any = {
						value: horarioStr,
						display: horarioStr,
					};

					if (diffHours > 0) {
						item.tempoRestante = `${diffHours}h ${diffMins}min`;
					} else {
						item.tempoRestante = `${diffMins}min`;
					}

					// Marcar o primeiro como próximo disponível
					if (horarios.length === 0) {
						item.isProximoDisponivel = true;
					}

					horarios.push(item);
				} else {
					// Se é outro dia, mostrar dia da semana
					const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
					horarios.push({
						value: horarioStr,
						display: horarioStr,
						diaSemana: diasSemana[data.getDay()],
					});
				}
			}
		}

		return horarios.slice(0, 12); // Limitar a 12 horários
	};

	return {
		// Estados calculados
		estaAberto,
		proximoHorario,
		tempoPreparoMin,
		tempoPreparoMax,

		// Métodos
		calcularProximaEntrega,
		obterHorariosDisponiveis,
	};
};
