<script setup lang="ts">
/**
 * 📊 DashboardHeader - Cabeçalho do Dashboard
 *
 * Exibe título, data atual, filtro de período e botão de refresh.
 */

import type { DashboardPeriodo } from "../../types/filters";
import { useDashboard } from "../../composables/useDashboard";

interface Props {
	loading?: boolean;
	periodo?: DashboardPeriodo;
}

interface Emits {
	(e: "refresh"): void;
	(e: "update:periodo", value: DashboardPeriodo): void;
}

const props = withDefaults(defineProps<Props>(), {
	periodo: "hoje",
});

const emit = defineEmits<Emits>();

// Acesso ao composable do dashboard
const dashboard = useDashboard();

// Estados para datas personalizadas
const customDateStart = ref("");
const customDateEnd = ref("");

// Estado local para o período (para controlar quando "personalizado" é selecionado)
const periodoLocal = ref<DashboardPeriodo>(props.periodo);

// Sincroniza com a prop quando ela muda externamente
watch(
	() => props.periodo,
	(newVal) => {
		periodoLocal.value = newVal;
	},
);

// Proxy para o v-model do período
const localPeriodo = computed({
	get: () => periodoLocal.value,
	set: (val) => {
		periodoLocal.value = val;

		// Se mudou para personalizado, NÃO emite ainda (espera as datas)
		if (val === "personalizado") {
			customDateStart.value = "";
			customDateEnd.value = "";
			// NÃO emite o update ainda - vai emitir quando as datas forem preenchidas
			return;
		}

		// Para outros períodos, limpa as datas e emite normalmente
		customDateStart.value = "";
		customDateEnd.value = "";
		emit("update:periodo", val);
	},
});

// Data formatada (ex: Domingo, 19 de Janeiro)
const currentDate = computed(() => {
	const date = new Date();
	return new Intl.DateTimeFormat("pt-BR", {
		weekday: "long",
		day: "numeric",
		month: "long",
	}).format(date);
});

// Capitaliza a primeira letra
const formattedDate = computed(() => {
	const str = currentDate.value;
	return str.charAt(0).toUpperCase() + str.slice(1);
});

// Watch para aplicar automaticamente quando ambas as datas forem selecionadas
watch([customDateStart, customDateEnd], ([inicio, fim]) => {
	if (inicio && fim && localPeriodo.value === "personalizado") {
		// Converte strings ISO para Date e passa para o composable DOS KPIs
		const dataInicio = new Date(inicio + "T00:00:00");
		const dataFim = new Date(fim + "T00:00:00");

		dashboard.setDataInicioKpis(dataInicio);
		dashboard.setDataFimKpis(dataFim);

		emit("update:periodo", "personalizado");
	}
});

// Opções do filtro de período
const periodoOptions = [
	{ label: "Hoje", value: "hoje" },
	{ label: "Ontem", value: "ontem" },
	{ label: "Últimos 7 dias", value: "ultimos_7_dias" },
	{ label: "Este Mês", value: "este_mes" },
	{ label: "Personalizado", value: "personalizado" },
];
</script>

<template>
	<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Dashboard</h1>
			<p class="text-sm text-[var(--text-muted)] mt-1">Visão geral de {{ formattedDate }}</p>
		</div>

		<div class="flex items-center gap-3">
			<!-- DatePickers inline quando período personalizado -->
			<template v-if="localPeriodo === 'personalizado'">
				<div class="w-[200px]">
					<UiDatePicker
						v-model="customDateStart"
						placeholder="Data início"
						:max-date="customDateEnd || undefined"
						size="sm"
					/>
				</div>
				<span class="text-[var(--text-muted)] text-sm">até</span>
				<div class="w-[200px]">
					<UiDatePicker
						v-model="customDateEnd"
						placeholder="Data fim"
						:min-date="customDateStart || undefined"
						size="sm"
					/>
				</div>
			</template>

			<!-- Filtro de Período para KPIs -->
			<UiSelect
				v-model="localPeriodo"
				:options="periodoOptions"
				size="sm"
				placeholder="Período"
				class="w-[160px]"
			/>

			<UiButton
				:loading="loading"
				variant="ghost"
				size="sm"
				title="Atualizar dados"
				class="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
				@click="emit('refresh')"
			>
				<Icon name="lucide:refresh-cw" class="w-4 h-4" />
			</UiButton>
		</div>
	</div>
</template>
