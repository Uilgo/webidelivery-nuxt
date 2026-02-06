/**
 * 📌 useHorarioFuncionamento - Lógica de Horários para Checkout Público
 *
 * Responsável por:
 * - Verificar se estabelecimento está aberto/fechado
 * - Calcular próximos horários disponíveis
 * - Integrar com dados reais do estabelecimento
 *
 * ⚠️ IMPORTANTE: Usa apenas tempo_entrega_min/max que JÁ INCLUI preparo + deslocamento
 */

import { useEstabelecimentoStore } from "~/stores/estabelecimento";

export interface UseHorarioFuncionamentoReturn {
	// Estados calculados
	estaAberto: Ref<boolean>;
	proximoHorario: Ref<string>;
	horariosFuncionamento: ComputedRef<Record<string, any> | null>;

	// Métodos
	calcularProximaEntrega: (tempoEntregaMin: number, tempoEntregaMax: number) => string;
	obterHorariosDisponiveis: (
		data: Date,
		tempoEntregaMin: number,
		tempoEntregaMax: number,
	) => Array<{
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
	 * ✅ Helper: Parsear horário "HH:MM" para [hora, minuto] com validação
	 */
	const parsearHorario = (horario: string | undefined): [number, number] | null => {
		if (!horario) return null;

		const partes = horario.split(":").map(Number);
		const [hora, minuto] = partes;

		if (
			partes.length !== 2 ||
			hora === undefined ||
			minuto === undefined ||
			isNaN(hora) ||
			isNaN(minuto) ||
			hora < 0 ||
			hora > 23 ||
			minuto < 0 ||
			minuto > 59
		) {
			return null;
		}

		return [hora, minuto];
	};

	/**
	 * ✅ Obter horários de funcionamento do config_geral.horarios
	 */
	const horariosFuncionamento = computed(() => {
		const estabelecimento = estabelecimentoStore.estabelecimento;
		if (!estabelecimento?.config_geral) return null;

		const configGeral = estabelecimento.config_geral as Record<string, unknown>;
		const horarios = configGeral.horarios as
			| Array<{
					dia_semana: string;
					aberto: boolean;
					periodos: Array<{
						horario_abertura: string;
						horario_fechamento: string;
					}>;
			  }>
			| undefined;

		if (!horarios || horarios.length === 0) return null;

		// Converter array para objeto indexado por dia da semana
		const horariosMap: Record<string, any> = {};
		horarios.forEach((h) => {
			horariosMap[h.dia_semana] = {
				ativo: h.aberto,
				periodos: h.periodos.map((p) => ({
					inicio: p.horario_abertura,
					fim: p.horario_fechamento,
				})),
			};
		});

		return horariosMap;
	});

	/**
	 * ✅ Verificar se está aberto agora
	 */
	const estaAberto = computed(() => {
		const horarios = horariosFuncionamento.value;
		if (!horarios) return false;

		const agora = new Date();
		const diaSemana = agora.getDay();
		const diasMap = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
		const diaAtual = diasMap[diaSemana];

		if (!diaAtual) return false;

		const horarioDia = horarios[diaAtual];
		if (!horarioDia || !horarioDia.ativo) return false;

		const periodos = horarioDia.periodos as Array<{ inicio: string; fim: string }> | undefined;
		if (!periodos || periodos.length === 0) return false;

		const horaAtual = agora.getHours();
		const minAtual = agora.getMinutes();
		const minutosTotaisAtual = horaAtual * 60 + minAtual;

		// Verificar se está dentro de algum período
		return periodos.some((periodo) => {
			const horarioInicio = parsearHorario(periodo.inicio);
			const horarioFim = parsearHorario(periodo.fim);

			if (!horarioInicio || !horarioFim) return false;

			const [horaInicio, minInicio] = horarioInicio;
			const [horaFim, minFim] = horarioFim;

			const minutosTotaisInicio = horaInicio * 60 + minInicio;
			const minutosTotaisFim = horaFim * 60 + minFim;

			return minutosTotaisAtual >= minutosTotaisInicio && minutosTotaisAtual < minutosTotaisFim;
		});
	});

	/**
	 * ✅ Próximo horário (quando abre/fecha)
	 */
	const proximoHorario = computed(() => {
		const horarios = horariosFuncionamento.value;
		if (!horarios) return "Horários não configurados";

		const agora = new Date();
		const diaSemana = agora.getDay();
		const diasMap = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
		const diaAtual = diasMap[diaSemana];

		if (!diaAtual) return "Fechado";

		const horarioDia = horarios[diaAtual];

		if (estaAberto.value) {
			// Se está aberto, mostrar quando fecha
			if (horarioDia?.periodos) {
				const periodos = horarioDia.periodos as Array<{ inicio: string; fim: string }>;
				const horaAtual = agora.getHours();
				const minAtual = agora.getMinutes();
				const minutosTotaisAtual = horaAtual * 60 + minAtual;

				// Encontrar o período atual
				const periodoAtual = periodos.find((periodo) => {
					const horarioInicio = parsearHorario(periodo.inicio);
					const horarioFim = parsearHorario(periodo.fim);

					if (!horarioInicio || !horarioFim) return false;

					const [horaInicio, minInicio] = horarioInicio;
					const [horaFim, minFim] = horarioFim;

					const minutosTotaisInicio = horaInicio * 60 + minInicio;
					const minutosTotaisFim = horaFim * 60 + minFim;

					return minutosTotaisAtual >= minutosTotaisInicio && minutosTotaisAtual < minutosTotaisFim;
				});

				if (periodoAtual) {
					return `Fecha às ${periodoAtual.fim}`;
				}
			}
			return "Aberto";
		} else {
			// Se está fechado, mostrar quando abre
			if (horarioDia?.ativo && horarioDia?.periodos) {
				const periodos = horarioDia.periodos as Array<{ inicio: string; fim: string }>;
				const horaAtual = agora.getHours();
				const minAtual = agora.getMinutes();
				const minutosTotaisAtual = horaAtual * 60 + minAtual;

				// Encontrar próximo período que ainda não começou
				const proximoPeriodo = periodos.find((periodo) => {
					const horarioInicio = parsearHorario(periodo.inicio);
					if (!horarioInicio) return false;

					const [horaInicio, minInicio] = horarioInicio;
					const minutosTotaisInicio = horaInicio * 60 + minInicio;
					return minutosTotaisAtual < minutosTotaisInicio;
				});

				if (proximoPeriodo) {
					return `Abre às ${proximoPeriodo.inicio}`;
				}
			}

			// Se não tem mais períodos hoje, procurar próximo dia
			for (let i = 1; i <= 7; i++) {
				const proximoDiaIndex = (diaSemana + i) % 7;
				const proximoDia = diasMap[proximoDiaIndex];

				if (!proximoDia) continue;

				const horarioProximoDia = horarios[proximoDia];

				if (horarioProximoDia?.ativo && horarioProximoDia?.periodos) {
					const periodos = horarioProximoDia.periodos as Array<{ inicio: string; fim: string }>;
					if (periodos.length > 0 && periodos[0]) {
						const diasSemanaLabel = [
							"Domingo",
							"Segunda",
							"Terça",
							"Quarta",
							"Quinta",
							"Sexta",
							"Sábado",
						];

						// Calcular a data do próximo dia
						const dataProximoDia = new Date(agora);
						dataProximoDia.setDate(dataProximoDia.getDate() + i);
						const dataFormatada = dataProximoDia.toLocaleDateString("pt-BR", {
							day: "2-digit",
							month: "2-digit",
							year: "numeric",
						});

						return `Abre ${diasSemanaLabel[proximoDiaIndex]} ${dataFormatada} às ${periodos[0].inicio}`;
					}
				}
			}

			return "Fechado";
		}
	});

	/**
	 * Calcular próxima entrega baseada no tempo de entrega
	 */
	const calcularProximaEntrega = (
		tempoEntregaMin: number = 0,
		tempoEntregaMax: number = 0,
	): string => {
		const agora = new Date();

		if (estaAberto.value) {
			// Se está aberto, calcular baseado no tempo atual
			const proximoHorarioMin = new Date(agora.getTime() + tempoEntregaMin * 60000);
			const proximoHorarioMax = new Date(agora.getTime() + tempoEntregaMax * 60000);

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
			const horarios = horariosFuncionamento.value;
			if (!horarios) return "Horário não disponível";

			const diaSemana = agora.getDay();
			const diasMap = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];

			// Procurar próximo dia aberto
			for (let i = 0; i <= 7; i++) {
				const diaIndex = (diaSemana + i) % 7;
				const dia = diasMap[diaIndex];

				if (!dia) continue;

				const horarioDia = horarios[dia];

				if (horarioDia?.ativo && horarioDia?.periodos) {
					const periodos = horarioDia.periodos as Array<{ inicio: string; fim: string }>;
					if (periodos.length > 0 && periodos[0]) {
						return periodos[0].inicio;
					}
				}
			}

			return "Horário não disponível";
		}
	};

	/**
	 * ✅ CORRIGIDO: Obter horários disponíveis para agendamento
	 *
	 * Usa apenas o tempo de entrega (que JÁ INCLUI preparo + deslocamento)
	 */
	const obterHorariosDisponiveis = (
		data: Date,
		tempoEntregaMin: number,
		tempoEntregaMax: number,
	) => {
		const horarios: Array<{
			value: string;
			display: string;
			isProximoDisponivel?: boolean;
			tempoRestante?: string;
			diaSemana?: string;
		}> = [];

		const horariosConfig = horariosFuncionamento.value;
		if (!horariosConfig) return horarios;

		const agora = new Date();
		const isHoje = data.toDateString() === agora.toDateString();
		const diaSemana = data.getDay();
		const diasMap = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
		const diaAtual = diasMap[diaSemana];

		if (!diaAtual) return horarios;

		const horarioDia = horariosConfig[diaAtual];
		if (!horarioDia?.ativo || !horarioDia?.periodos) return horarios;

		const periodos = horarioDia.periodos as Array<{ inicio: string; fim: string }>;

		console.log("🔍 Debug obterHorariosDisponiveis:", {
			data: data.toISOString(),
			tempoEntregaMin,
			tempoEntregaMax,
		});

		// Para cada período, gerar horários de 30 em 30 minutos
		periodos.forEach((periodo) => {
			const horarioInicio = parsearHorario(periodo.inicio);
			const horarioFim = parsearHorario(periodo.fim);

			if (!horarioInicio || !horarioFim) return;

			const [horaInicio, minInicio] = horarioInicio;
			const [horaFim, minFim] = horarioFim;

			// Calcular horário limite considerando tempo de entrega
			// Ex: Se fecha às 18:00 e tempo máximo é 60min, último horário é 17:00
			const minutosFim = horaFim * 60 + minFim;
			const minutosLimite = minutosFim - tempoEntregaMax;
			const horaLimite = Math.floor(minutosLimite / 60);
			const minLimite = minutosLimite % 60;

			console.log("🔍 Cálculo de limite:", {
				periodoFim: `${horaFim}:${minFim}`,
				minutosFim,
				tempoEntregaMax,
				minutosLimite,
				horaLimite,
				minLimite,
			});

			let horaAtual = horaInicio;
			let minAtual = minInicio;

			// Gerar horários até o limite (inclusive)
			while (horaAtual < horaLimite || (horaAtual === horaLimite && minAtual <= minLimite)) {
				const horarioStr = `${horaAtual.toString().padStart(2, "0")}:${minAtual.toString().padStart(2, "0")}`;
				const horarioData = new Date(data);
				horarioData.setHours(horaAtual, minAtual, 0, 0);

				// Se é hoje, verificar se já passou + tempo de entrega
				if (isHoje) {
					const horarioComEntrega = new Date(horarioData.getTime() - tempoEntregaMin * 60000);
					if (horarioComEntrega <= agora) {
						// Avançar para próximo horário
						minAtual += 30;
						if (minAtual >= 60) {
							minAtual = 0;
							horaAtual++;
						}
						continue;
					}

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

				// Avançar 30 minutos
				minAtual += 30;
				if (minAtual >= 60) {
					minAtual = 0;
					horaAtual++;
				}
			}
		});

		return horarios; // Retornar todos os horários disponíveis
	};

	return {
		// Estados calculados
		estaAberto,
		proximoHorario,
		horariosFuncionamento,

		// Métodos
		calcularProximaEntrega,
		obterHorariosDisponiveis,
	};
};
