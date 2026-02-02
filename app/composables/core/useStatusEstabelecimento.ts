/**
 * 📌 useStatusEstabelecimento
 *
 * Composable para calcular o status real do estabelecimento (aberto/fechado)
 * baseado no modo de funcionamento.
 *
 * Modos:
 * - automatico: Calcula baseado nos horários configurados (padrão)
 * - manual: Forçado fechado (emergência/manutenção)
 *
 * Quando o toggle é clicado:
 * - Se está em automático → muda para manual (fecha forçado)
 * - Se está em manual → volta para automático (usa horários)
 */

import type {
	HorarioFuncionamento,
	PeriodoFuncionamento,
	HorarioExcecao,
	DiaSemana,
} from "#shared/types/estabelecimentos";
import type { ModoFuncionamento } from "#shared/types/database";

export interface UseStatusEstabelecimentoReturn {
	/** Status calculado (true = aberto, false = fechado) */
	estaAberto: ComputedRef<boolean>;
	/** Modo atual de funcionamento */
	modoAtual: ComputedRef<ModoFuncionamento>;
	/** Mensagem sobre próximo horário */
	proximoHorario: ComputedRef<string>;
	/** Dia da semana atual */
	diaAtual: ComputedRef<string>;
	/** Se está em modo manual (fechado forçado) */
	emModoManual: ComputedRef<boolean>;
}

// Mapeamento de dia da semana (0 = domingo, 1 = segunda, etc.)
const DIAS_SEMANA_MAP: Record<number, string> = {
	0: "domingo",
	1: "segunda",
	2: "terca",
	3: "quarta",
	4: "quinta",
	5: "sexta",
	6: "sabado",
};

const DIAS_SEMANA_LABELS: Record<string, string> = {
	domingo: "Domingo",
	segunda: "Segunda-feira",
	terca: "Terça-feira",
	quarta: "Quarta-feira",
	quinta: "Quinta-feira",
	sexta: "Sexta-feira",
	sabado: "Sábado",
};

export const useStatusEstabelecimento = (
	modoFuncionamento: Ref<ModoFuncionamento>,
	horarios: Ref<HorarioFuncionamento[]>,
	excecoes?: Ref<HorarioExcecao[]>,
): UseStatusEstabelecimentoReturn => {
	const diaAtual = computed(() => {
		const hoje = new Date().getDay();
		return DIAS_SEMANA_MAP[hoje] || "segunda";
	});

	const modoAtual = computed(() => modoFuncionamento.value);

	const emModoManual = computed(() => modoAtual.value === "manual");

	const horaParaMinutos = (hora: string): number => {
		const [h, m] = hora.split(":").map(Number);
		return (h || 0) * 60 + (m || 0);
	};

	const excecaoHoje = computed((): HorarioExcecao | null => {
		if (!excecoes?.value) return null;
		const hoje = new Date();
		const dataHoje = hoje.toISOString().split("T")[0];
		return excecoes.value.find((exc) => exc.data === dataHoje) || null;
	});

	const horarioHoje = computed((): HorarioFuncionamento | null => {
		if (excecaoHoje.value) {
			return {
				dia_semana: diaAtual.value as DiaSemana,
				aberto: excecaoHoje.value.aberto,
				periodos: excecaoHoje.value.periodos,
			};
		}
		return horarios.value.find((h) => h.dia_semana === diaAtual.value) || null;
	});

	const dentroDeAlgumPeriodo = computed((): boolean => {
		const config = horarioHoje.value;
		if (!config || !config.aberto) return false;
		if (!config.periodos || config.periodos.length === 0) return false;

		const agora = new Date();
		const minutosAgora = agora.getHours() * 60 + agora.getMinutes();

		for (const periodo of config.periodos) {
			if (!periodo.horario_abertura || !periodo.horario_fechamento) continue;

			const abertura = horaParaMinutos(periodo.horario_abertura);
			const fechamento = horaParaMinutos(periodo.horario_fechamento);

			if (fechamento < abertura) {
				if (minutosAgora >= abertura || minutosAgora < fechamento) {
					return true;
				}
			} else {
				if (minutosAgora >= abertura && minutosAgora < fechamento) {
					return true;
				}
			}
		}

		return false;
	});

	const estaAberto = computed((): boolean => {
		if (modoAtual.value === "manual") return false;
		return dentroDeAlgumPeriodo.value;
	});

	const proximoPeriodoHoje = computed((): PeriodoFuncionamento | null => {
		const config = horarioHoje.value;
		if (!config || !config.aberto || !config.periodos) return null;

		const agora = new Date();
		const minutosAgora = agora.getHours() * 60 + agora.getMinutes();

		for (const periodo of config.periodos) {
			if (!periodo.horario_abertura) continue;
			const abertura = horaParaMinutos(periodo.horario_abertura);
			if (minutosAgora < abertura) {
				return periodo;
			}
		}

		return null;
	});

	const proximoDiaAberto = computed((): { dia: string; horario: string } | null => {
		const hoje = new Date().getDay();

		for (let i = 1; i <= 7; i++) {
			const diaIndex = (hoje + i) % 7;
			const dia = DIAS_SEMANA_MAP[diaIndex];
			if (!dia) continue;

			const config = horarios.value.find((h) => h.dia_semana === dia);
			if (config?.aberto && config.periodos && config.periodos.length > 0) {
				const primeiroPeriodo = config.periodos[0];
				if (primeiroPeriodo?.horario_abertura) {
					return {
						dia: DIAS_SEMANA_LABELS[dia] || dia,
						horario: primeiroPeriodo.horario_abertura,
					};
				}
			}
		}

		return null;
	});

	const proximoHorario = computed((): string => {
		if (modoAtual.value === "manual") {
			return "Fechado temporariamente";
		}

		const config = horarioHoje.value;

		if (excecaoHoje.value) {
			if (!excecaoHoje.value.aberto) {
				return `Fechado hoje - ${excecaoHoje.value.nome}`;
			}
		}

		if (!config || !config.aberto) {
			const proximo = proximoDiaAberto.value;
			if (proximo) {
				return `Abre ${proximo.dia} às ${proximo.horario}`;
			}
			return "Fechado";
		}

		if (!config.periodos || config.periodos.length === 0) {
			return "Horários não configurados";
		}

		if (dentroDeAlgumPeriodo.value) {
			const agora = new Date();
			const minutosAgora = agora.getHours() * 60 + agora.getMinutes();

			for (const periodo of config.periodos) {
				if (!periodo.horario_abertura || !periodo.horario_fechamento) continue;

				const abertura = horaParaMinutos(periodo.horario_abertura);
				const fechamento = horaParaMinutos(periodo.horario_fechamento);

				if (fechamento < abertura) {
					if (minutosAgora >= abertura || minutosAgora < fechamento) {
						return `Fecha às ${periodo.horario_fechamento}`;
					}
				} else {
					if (minutosAgora >= abertura && minutosAgora < fechamento) {
						return `Fecha às ${periodo.horario_fechamento}`;
					}
				}
			}

			return "Aberto agora";
		}

		const proximo = proximoPeriodoHoje.value;
		if (proximo?.horario_abertura) {
			return `Abre às ${proximo.horario_abertura}`;
		}

		const proximoDia = proximoDiaAberto.value;
		if (proximoDia) {
			return `Abre ${proximoDia.dia} às ${proximoDia.horario}`;
		}

		return "Fechado";
	});

	return {
		estaAberto,
		modoAtual,
		proximoHorario,
		diaAtual,
		emModoManual,
	};
};
