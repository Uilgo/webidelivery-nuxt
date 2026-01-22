<script setup lang="ts">
/**
 * 📌 DayCard - Card compacto para exibir status do dia
 *
 * Componente para mostrar o status de funcionamento de um dia específico
 * na visão geral da semana. Permite toggle rápido e edição detalhada.
 */

import type { HorarioFuncionamento } from "#shared/types/estabelecimentos";

interface Props {
	/** Dados do horário de funcionamento */
	horario: HorarioFuncionamento;
	/** Se o card está selecionado para edição */
	selected?: boolean;
	/** Tamanho do card */
	size?: "sm" | "md" | "lg";
}

interface Emits {
	/** Emitido quando o usuário clica no card */
	click: [];
	/** Emitido quando o toggle de aberto/fechado é alterado */
	"toggle-aberto": [aberto: boolean];
}

const props = withDefaults(defineProps<Props>(), {
	selected: false,
	size: "md",
});

const emit = defineEmits<Emits>();

/**
 * Estado para animação de feedback
 */
const isUpdating = ref(false);

/**
 * Labels abreviados dos dias
 */
const diasAbreviados: Record<string, string> = {
	domingo: "Dom",
	segunda: "Seg",
	terca: "Ter",
	quarta: "Qua",
	quinta: "Qui",
	sexta: "Sex",
	sabado: "Sáb",
};

/**
 * Formatação do horário para exibição
 */
const horarioFormatado = computed((): string => {
	if (!props.horario.aberto) return "Fechado";

	const periodos = props.horario.periodos || [];

	if (periodos.length === 0) {
		// Fallback para formato antigo
		const abertura = props.horario.horario_abertura || "08:00";
		const fechamento = props.horario.horario_fechamento || "18:00";
		return `${abertura}-${fechamento}`;
	}

	if (periodos.length === 1) {
		const periodo = periodos[0];
		return `${periodo?.horario_abertura}-${periodo?.horario_fechamento}`;
	}

	// Múltiplos períodos - mostrar quantidade
	return `${periodos.length} períodos`;
});

/**
 * Classes do card baseadas no estado
 */
const cardClasses = computed(() => {
	const baseClasses = [
		"relative flex flex-col items-center justify-center",
		"border-2 rounded-lg cursor-pointer transition-all duration-300",
		"hover:shadow-md active:scale-95 transform",
	];

	// Classes de tamanho
	const sizeClasses = {
		sm: "p-2 min-h-[60px] min-w-[75px]",
		md: "p-3 min-h-20",
		lg: "p-4 min-h-24",
	};

	// Classes de estado com animação
	const stateClasses = props.horario.aberto
		? [
				"bg-green-50 dark:bg-green-900/20",
				"border-green-200 dark:border-green-800",
				"hover:bg-green-100 dark:hover:bg-green-900/30",
				"hover:border-green-300 dark:hover:border-green-700",
			]
		: [
				"bg-red-50 dark:bg-red-900/20",
				"border-red-200 dark:border-red-800",
				"hover:bg-red-100 dark:hover:bg-red-900/30",
				"hover:border-red-300 dark:hover:border-red-700",
			];

	// Classes de seleção com animação mais suave
	const selectedClasses = props.selected
		? [
				"ring-2 ring-[var(--primary)] ring-offset-2",
				"shadow-lg scale-105",
				"border-[var(--primary)]",
			]
		: [];

	return [...baseClasses, sizeClasses[props.size], ...stateClasses, ...selectedClasses].join(" ");
});

/**
 * Classes do texto do dia
 */
const dayTextClasses = computed(() => {
	const baseClasses = "text-xs font-semibold";

	return props.horario.aberto
		? `${baseClasses} text-green-900 dark:text-green-100`
		: `${baseClasses} text-red-900 dark:text-red-100`;
});

/**
 * Classes do texto do horário
 */
const timeTextClasses = computed(() => {
	const baseClasses = "text-[10px] font-medium";

	return props.horario.aberto
		? `${baseClasses} text-green-700 dark:text-green-300`
		: `${baseClasses} text-red-700 dark:text-red-300`;
});

/**
 * Handler para clique no card
 */
const handleClick = (): void => {
	emit("click");
};
</script>

<template>
	<div :class="[cardClasses, { 'animate-pulse': isUpdating }]" @click="handleClick">
		<!-- Conteúdo Principal -->
		<div class="flex flex-col items-center space-y-1 w-full">
			<!-- Nome do Dia -->
			<span :class="dayTextClasses">
				{{ diasAbreviados[horario.dia_semana] }}
			</span>

			<!-- Horário -->
			<span :class="timeTextClasses">
				{{ horarioFormatado }}
			</span>
		</div>
	</div>
</template>
