<script setup lang="ts">
/**
 * 📌 UiDatePicker
 *
 * Componente de seleção de data customizado com design system próprio.
 * Suporta seleção de data única, range de datas, e formatação pt-BR.
 */

interface Props {
	/** Valor do datepicker (v-model) - formato ISO (YYYY-MM-DD) */
	modelValue?: string;
	/** Placeholder do input */
	placeholder?: string;
	/** Tamanho do input */
	size?: "sm" | "md" | "lg";
	/** Estado desabilitado */
	disabled?: boolean;
	/** Campo obrigatório */
	required?: boolean;
	/** ID customizado */
	id?: string;
	/** Estado de erro */
	error?: boolean;
	/** Data mínima permitida (formato ISO) */
	minDate?: string;
	/** Data máxima permitida (formato ISO) */
	maxDate?: string;
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: "",
	placeholder: "Selecione uma data",
	size: "md",
	disabled: false,
	required: false,
	id: undefined,
	error: false,
	minDate: undefined,
	maxDate: undefined,
});

interface Emits {
	"update:modelValue": [value: string];
}

const emit = defineEmits<Emits>();

// Estados
const isOpen = ref(false);
const inputRef = ref<HTMLInputElement>();
const calendarRef = ref<HTMLDivElement>();
const currentMonth = ref(new Date());
const selectedDate = ref<Date | null>(null);

// Gerar ID único
const generatedId = useId();
const inputId = computed(() => props.id || generatedId);

// Nomes dos meses e dias em pt-BR
const mesesPtBR = [
	"Janeiro",
	"Fevereiro",
	"Março",
	"Abril",
	"Maio",
	"Junho",
	"Julho",
	"Agosto",
	"Setembro",
	"Outubro",
	"Novembro",
	"Dezembro",
];

const diasSemanaPtBR = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Formatar data para exibição (dd/mm/aaaa)
const formatarDataExibicao = (date: Date): string => {
	const dia = String(date.getDate()).padStart(2, "0");
	const mes = String(date.getMonth() + 1).padStart(2, "0");
	const ano = date.getFullYear();
	return `${dia}/${mes}/${ano}`;
};

// Formatar data para ISO (YYYY-MM-DD)
const formatarDataISO = (date: Date): string => {
	const ano = date.getFullYear();
	const mes = String(date.getMonth() + 1).padStart(2, "0");
	const dia = String(date.getDate()).padStart(2, "0");
	return `${ano}-${mes}-${dia}`;
};

// Parse data ISO para Date
const parseDataISO = (isoString: string): Date | null => {
	if (!isoString) return null;
	const date = new Date(isoString + "T00:00:00");
	return isNaN(date.getTime()) ? null : date;
};

// Valor formatado para exibição no input
const valorExibicao = computed(() => {
	if (!props.modelValue) return "";
	const date = parseDataISO(props.modelValue);
	return date ? formatarDataExibicao(date) : "";
});

// Mês e ano atual do calendário
const mesAnoAtual = computed(() => {
	const mes = mesesPtBR[currentMonth.value.getMonth()];
	const ano = currentMonth.value.getFullYear();
	return `${mes} de ${ano}`;
});

// Gerar dias do calendário
const diasCalendario = computed(() => {
	const ano = currentMonth.value.getFullYear();
	const mes = currentMonth.value.getMonth();

	// Primeiro dia do mês
	const primeiroDia = new Date(ano, mes, 1);
	const diaSemana = primeiroDia.getDay();

	// Último dia do mês
	const ultimoDia = new Date(ano, mes + 1, 0);
	const totalDias = ultimoDia.getDate();

	// Dias do mês anterior para preencher
	const diasMesAnterior = diaSemana;
	const ultimoDiaMesAnterior = new Date(ano, mes, 0).getDate();

	const dias: Array<{
		dia: number;
		mes: "anterior" | "atual" | "proximo";
		data: Date;
		isHoje: boolean;
		isSelecionado: boolean;
		isDesabilitado: boolean;
	}> = [];

	// Dias do mês anterior
	for (let i = diasMesAnterior - 1; i >= 0; i--) {
		const dia = ultimoDiaMesAnterior - i;
		const data = new Date(ano, mes - 1, dia);
		dias.push({
			dia,
			mes: "anterior",
			data,
			isHoje: false,
			isSelecionado: false,
			isDesabilitado: isDataDesabilitada(data),
		});
	}

	// Dias do mês atual
	const hoje = new Date();
	hoje.setHours(0, 0, 0, 0);

	for (let dia = 1; dia <= totalDias; dia++) {
		const data = new Date(ano, mes, dia);
		const isHoje = data.getTime() === hoje.getTime();
		const isSelecionado =
			selectedDate.value !== null && data.getTime() === selectedDate.value.getTime();

		dias.push({
			dia,
			mes: "atual",
			data,
			isHoje,
			isSelecionado,
			isDesabilitado: isDataDesabilitada(data),
		});
	}

	// Dias do próximo mês para completar a grade
	const diasRestantes = 42 - dias.length; // 6 semanas * 7 dias
	for (let dia = 1; dia <= diasRestantes; dia++) {
		const data = new Date(ano, mes + 1, dia);
		dias.push({
			dia,
			mes: "proximo",
			data,
			isHoje: false,
			isSelecionado: false,
			isDesabilitado: isDataDesabilitada(data),
		});
	}

	return dias;
});

// Verificar se data está desabilitada
const isDataDesabilitada = (date: Date): boolean => {
	if (props.disabled) return true;

	const timestamp = date.getTime();

	if (props.minDate) {
		const minTimestamp = parseDataISO(props.minDate)?.getTime();
		if (minTimestamp && timestamp < minTimestamp) return true;
	}

	if (props.maxDate) {
		const maxTimestamp = parseDataISO(props.maxDate)?.getTime();
		if (maxTimestamp && timestamp > maxTimestamp) return true;
	}

	return false;
};

// Navegar mês anterior
const mesAnterior = (): void => {
	currentMonth.value = new Date(
		currentMonth.value.getFullYear(),
		currentMonth.value.getMonth() - 1,
	);
};

// Navegar próximo mês
const proximoMes = (): void => {
	currentMonth.value = new Date(
		currentMonth.value.getFullYear(),
		currentMonth.value.getMonth() + 1,
	);
};

// Ir para hoje
const irParaHoje = (): void => {
	const hoje = new Date();
	currentMonth.value = new Date(hoje.getFullYear(), hoje.getMonth());
	selecionarData(hoje);
};

// Limpar seleção
const limpar = (): void => {
	selectedDate.value = null;
	emit("update:modelValue", "");
	isOpen.value = false;
};

// Selecionar data
const selecionarData = (date: Date): void => {
	if (isDataDesabilitada(date)) return;

	selectedDate.value = date;
	emit("update:modelValue", formatarDataISO(date));
	isOpen.value = false;
};

// Toggle calendário
const toggleCalendario = (): void => {
	if (props.disabled) return;
	isOpen.value = !isOpen.value;
};

// Fechar ao clicar fora
const handleClickOutside = (event: MouseEvent): void => {
	const target = event.target as Node;
	if (
		calendarRef.value &&
		!calendarRef.value.contains(target) &&
		inputRef.value &&
		!inputRef.value.contains(target)
	) {
		isOpen.value = false;
	}
};

// Inicializar data selecionada
watch(
	() => props.modelValue,
	(newValue) => {
		if (newValue) {
			const date = parseDataISO(newValue);
			if (date) {
				selectedDate.value = date;
				currentMonth.value = new Date(date.getFullYear(), date.getMonth());
			}
		} else {
			selectedDate.value = null;
		}
	},
	{ immediate: true },
);

// Lifecycle
onMounted(() => {
	document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
	document.removeEventListener("click", handleClickOutside);
});

// Classes do container
const containerClasses = computed(() => {
	const baseClasses = [
		"flex items-center",
		"bg-[var(--input-bg)]",
		"border border-[var(--input-border)]",
		"rounded-lg",
		"transition-all duration-200",
		"focus-within:border-[var(--input-border-focus)]",
		"focus-within:ring-2 focus-within:ring-[var(--input-border-focus)] focus-within:ring-opacity-20",
	];

	const sizeClasses = {
		sm: "min-h-[32px] px-3",
		md: "min-h-[40px] px-3",
		lg: "min-h-[48px] px-4",
	};

	const stateClasses = [];
	if (props.error) {
		stateClasses.push(
			"border-[var(--error)]",
			"focus-within:border-[var(--error)]",
			"focus-within:ring-[var(--error)]",
		);
	}
	if (props.disabled) {
		stateClasses.push("opacity-50", "cursor-not-allowed");
	}

	return [...baseClasses, sizeClasses[props.size], ...stateClasses].join(" ");
});
</script>

<template>
	<div class="relative">
		<!-- Input -->
		<div :class="containerClasses" @click="toggleCalendario">
			<!-- Ícone de calendário -->
			<Icon name="lucide:calendar" class="w-5 h-5 text-[var(--text-muted)] mr-2 flex-shrink-0" />

			<!-- Input readonly -->
			<input
				:id="inputId"
				ref="inputRef"
				type="text"
				:value="valorExibicao"
				:placeholder="placeholder"
				:disabled="disabled"
				:required="required"
				readonly
				class="flex-1 bg-transparent border-0 outline-none text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] cursor-pointer disabled:cursor-not-allowed"
			/>

			<!-- Botão limpar (se tiver valor) -->
			<button
				v-if="valorExibicao && !disabled"
				type="button"
				class="flex items-center justify-center p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
				@click.stop="limpar"
			>
				<Icon name="lucide:x" class="w-4 h-4" />
			</button>
		</div>

		<!-- Calendário Dropdown -->
		<Transition
			enter-active-class="transition duration-200 ease-out"
			enter-from-class="opacity-0 scale-95"
			enter-to-class="opacity-100 scale-100"
			leave-active-class="transition duration-150 ease-in"
			leave-from-class="opacity-100 scale-100"
			leave-to-class="opacity-0 scale-95"
		>
			<div
				v-if="isOpen"
				ref="calendarRef"
				class="absolute z-50 mt-2 p-4 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg shadow-lg min-w-[320px]"
			>
				<!-- Header: Navegação de mês -->
				<div class="flex items-center justify-between mb-4">
					<button
						type="button"
						class="p-2 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
						@click="mesAnterior"
					>
						<Icon name="lucide:chevron-left" class="w-5 h-5" />
					</button>

					<span class="text-sm font-semibold text-[var(--text-primary)]">{{ mesAnoAtual }}</span>

					<button
						type="button"
						class="p-2 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
						@click="proximoMes"
					>
						<Icon name="lucide:chevron-right" class="w-5 h-5" />
					</button>
				</div>

				<!-- Dias da semana -->
				<div class="grid grid-cols-7 gap-1 mb-2">
					<div
						v-for="dia in diasSemanaPtBR"
						:key="dia"
						class="text-center text-xs font-medium text-[var(--text-muted)] py-2"
					>
						{{ dia }}
					</div>
				</div>

				<!-- Grade de dias -->
				<div class="grid grid-cols-7 gap-1">
					<button
						v-for="(item, index) in diasCalendario"
						:key="index"
						type="button"
						:disabled="item.isDesabilitado"
						:class="[
							'aspect-square flex items-center justify-center rounded-md text-sm transition-colors',
							item.mes === 'atual'
								? 'text-[var(--text-primary)]'
								: 'text-[var(--text-muted)] opacity-50',
							item.isHoje && !item.isSelecionado
								? 'border-2 border-[var(--primary)] font-semibold'
								: '',
							item.isSelecionado
								? 'bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold'
								: 'hover:bg-[var(--bg-hover)]',
							item.isDesabilitado ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
						]"
						@click="selecionarData(item.data)"
					>
						{{ item.dia }}
					</button>
				</div>

				<!-- Footer: Ações -->
				<div
					class="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border-muted)]"
				>
					<button
						type="button"
						class="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium transition-colors"
						@click="limpar"
					>
						Limpar
					</button>

					<button
						type="button"
						class="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium transition-colors"
						@click="irParaHoje"
					>
						Hoje
					</button>
				</div>
			</div>
		</Transition>
	</div>
</template>
