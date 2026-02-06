<script setup lang="ts">
/**
 * 📌 WeekOverview - Visão geral da semana
 *
 * Componente que exibe todos os dias da semana em cards compactos,
 * permitindo visualização rápida do status e seleção para edição.
 */

import type { HorarioFuncionamento } from "#shared/types/estabelecimentos";
import DayCard from "./DayCard.vue";

interface Props {
	/** Array com os horários de todos os dias da semana */
	horarios: HorarioFuncionamento[];
	/** Dia atualmente selecionado para edição */
	selectedDay?: string | null;
}

interface Emits {
	/** Emitido quando um dia é selecionado */
	"select-day": [diaSemana: string];
	/** Emitido quando o status de um dia é alterado */
	"toggle-day": [diaSemana: string, aberto: boolean];
}

const props = withDefaults(defineProps<Props>(), {
	selectedDay: null,
});

const emit = defineEmits<Emits>();

/**
 * Ordem correta dos dias da semana
 */
const ordemDias = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];

/**
 * Horários ordenados pela sequência correta dos dias
 */
const horariosOrdenados = computed(() => {
	return ordemDias
		.map((dia) => props.horarios.find((h) => h.dia_semana === dia))
		.filter(Boolean) as HorarioFuncionamento[];
});

/**
 * Estatísticas da semana
 */
const estatisticas = computed(() => {
	const diasAbertos = props.horarios.filter((h) => h.aberto).length;
	const diasFechados = props.horarios.length - diasAbertos;

	// Contar total de períodos
	const totalPeriodos = props.horarios.reduce((acc, h) => {
		if (!h.aberto) return acc;
		return acc + (h.periodos?.length || 1); // Fallback para formato antigo
	}, 0);

	return {
		diasAbertos,
		diasFechados,
		total: props.horarios.length,
		totalPeriodos,
		percentualAberto: Math.round((diasAbertos / props.horarios.length) * 100),
	};
});

/**
 * Handler para seleção de dia
 */
const handleSelectDay = (horario: HorarioFuncionamento): void => {
	emit("select-day", horario.dia_semana);
};

/**
 * Handler para toggle de dia
 */
const handleToggleDay = (horario: HorarioFuncionamento, aberto: boolean): void => {
	emit("toggle-day", horario.dia_semana, aberto);
};
</script>

<template>
	<div class="space-y-4">
		<!-- Cabeçalho com Estatísticas -->
		<div class="flex items-center justify-between">
			<div>
				<h3 class="text-lg font-semibold text-gray-900 dark:text-white">Horários da Semana</h3>
				<p class="text-sm text-gray-600 dark:text-gray-400">
					{{ estatisticas.diasAbertos }} dias abertos • {{ estatisticas.totalPeriodos }} períodos
					configurados
				</p>
			</div>

			<!-- Indicador de Progresso -->
			<div class="flex items-center space-x-2">
				<div class="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
					<div
						class="h-full bg-green-500 transition-all duration-300"
						:style="{ width: `${estatisticas.percentualAberto}%` }"
					></div>
				</div>
				<span class="text-sm font-medium text-gray-700 dark:text-gray-300">
					{{ estatisticas.percentualAberto }}%
				</span>
			</div>
		</div>

		<!-- Grid de Dias - Layout mais flexível -->
		<div class="flex flex-wrap gap-2 justify-between">
			<DayCard
				v-for="horario in horariosOrdenados"
				:key="horario.dia_semana"
				:horario="horario"
				:selected="selectedDay === horario.dia_semana"
				size="sm"
				class="flex-1 min-w-[75px] max-w-[110px]"
				@click="handleSelectDay(horario)"
				@toggle-aberto="(aberto) => handleToggleDay(horario, aberto)"
			/>
		</div>
	</div>
</template>
