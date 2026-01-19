/**
 * 📌 useHorarioFuncionamento
 *
 * Composable para verificar se o estabelecimento está aberto
 * baseado no horário de funcionamento configurado.
 */

import type { HorarioFuncionamento, HorarioDia } from "../types/cardapio-publico";
import { DIAS_SEMANA_LABELS } from "#shared/constants/estabelecimento";

export interface UseHorarioFuncionamentoReturn {
	estaAberto: ComputedRef<boolean>;
	proximoHorario: ComputedRef<string>;
	horarioHoje: ComputedRef<HorarioDia | null>;
	diaAtual: ComputedRef<string>;
}

// Mapeamento de dia da semana (0 = domingo, 1 = segunda, etc.)
const DIAS_SEMANA_MAP: Record<number, keyof HorarioFuncionamento> = {
	0: "domingo",
	1: "segunda",
	2: "terca",
	3: "quarta",
	4: "quinta",
	5: "sexta",
	6: "sabado",
};

export const useHorarioFuncionamento = (
	horario: Ref<HorarioFuncionamento | null>,
): UseHorarioFuncionamentoReturn => {
	// Dia atual da semana
	const diaAtual = computed(() => {
		const hoje = new Date().getDay();
		return DIAS_SEMANA_MAP[hoje] || "segunda";
	});

	// Horário configurado para hoje
	const horarioHoje = computed((): HorarioDia | null => {
		if (!horario.value) return null;
		return horario.value[diaAtual.value] || null;
	});

	/**
	 * Converte string "HH:MM" para minutos desde meia-noite
	 */
	const horaParaMinutos = (hora: string): number => {
		const [h, m] = hora.split(":").map(Number);
		return (h || 0) * 60 + (m || 0);
	};

	/**
	 * Verifica se o horário atual está dentro do período de funcionamento
	 */
	const estaAberto = computed((): boolean => {
		const config = horarioHoje.value;

		// Se não tem configuração ou está marcado como fechado
		if (!config || !config.aberto) return false;

		// Se não tem horários definidos, considera aberto o dia todo
		if (!config.abertura || !config.fechamento) return true;

		const agora = new Date();
		const minutosAgora = agora.getHours() * 60 + agora.getMinutes();

		const abertura = horaParaMinutos(config.abertura);
		const fechamento = horaParaMinutos(config.fechamento);

		// Verifica se está no horário de funcionamento
		let dentroHorario = minutosAgora >= abertura && minutosAgora < fechamento;

		// Verifica intervalo (se configurado)
		if (dentroHorario && config.intervalo) {
			const inicioIntervalo = horaParaMinutos(config.intervalo.inicio);
			const fimIntervalo = horaParaMinutos(config.intervalo.fim);

			// Se está no intervalo, está fechado
			if (minutosAgora >= inicioIntervalo && minutosAgora < fimIntervalo) {
				dentroHorario = false;
			}
		}

		return dentroHorario;
	});

	/**
	 * Retorna mensagem sobre próximo horário de abertura/fechamento
	 */
	const proximoHorario = computed((): string => {
		const config = horarioHoje.value;

		if (!config || !config.aberto) {
			// Buscar próximo dia aberto
			const proximoDia = encontrarProximoDiaAberto();
			if (proximoDia) {
				return `Abre ${DIAS_SEMANA_LABELS[proximoDia]}`;
			}
			return "Fechado";
		}

		if (!config.abertura || !config.fechamento) {
			return "Aberto hoje";
		}

		const agora = new Date();
		const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
		const abertura = horaParaMinutos(config.abertura);
		const fechamento = horaParaMinutos(config.fechamento);

		// Ainda não abriu
		if (minutosAgora < abertura) {
			return `Abre às ${config.abertura}`;
		}

		// Já fechou
		if (minutosAgora >= fechamento) {
			const proximoDia = encontrarProximoDiaAberto();
			if (proximoDia) {
				return `Abre ${DIAS_SEMANA_LABELS[proximoDia]}`;
			}
			return "Fechado";
		}

		// Está no intervalo
		if (config.intervalo) {
			const inicioIntervalo = horaParaMinutos(config.intervalo.inicio);
			const fimIntervalo = horaParaMinutos(config.intervalo.fim);

			if (minutosAgora >= inicioIntervalo && minutosAgora < fimIntervalo) {
				return `Retorna às ${config.intervalo.fim}`;
			}
		}

		// Está aberto
		return `Fecha às ${config.fechamento}`;
	});

	/**
	 * Encontra o próximo dia que o estabelecimento abre
	 */
	const encontrarProximoDiaAberto = (): keyof HorarioFuncionamento | null => {
		if (!horario.value) return null;

		const hoje = new Date().getDay();

		// Verifica os próximos 7 dias
		for (let i = 1; i <= 7; i++) {
			const diaIndex = (hoje + i) % 7;
			const dia = DIAS_SEMANA_MAP[diaIndex];
			if (dia) {
				const config = horario.value[dia];
				if (config?.aberto) {
					return dia;
				}
			}
		}

		return null;
	};

	return {
		estaAberto,
		proximoHorario,
		horarioHoje,
		diaAtual,
	};
};
