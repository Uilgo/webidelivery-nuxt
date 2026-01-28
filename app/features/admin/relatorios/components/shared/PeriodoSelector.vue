<script setup lang="ts">
/**
 * 📅 PeriodoSelector
 *
 * Seletor de período para relatórios com opções:
 * - Hoje
 * - Ontem
 * - Últimos 7 dias
 * - Este Mês
 * - Personalizado (com date pickers)
 */

import type { FiltrosPeriodo, PeriodoPreset } from "../../types/relatorios";

interface Props {
	modelValue: FiltrosPeriodo;
	loading?: boolean;
}

interface Emits {
	(e: "update:modelValue", value: FiltrosPeriodo): void;
}

const props = withDefaults(defineProps<Props>(), {
	loading: false,
});

const emit = defineEmits<Emits>();

// Estado local para datas personalizadas
const customDateStart = ref("");
const customDateEnd = ref("");

// Período selecionado
const periodoSelecionado = computed({
	get: () => props.modelValue.preset,
	set: (preset: PeriodoPreset) => {
		if (preset === "personalizado") {
			// Limpa as datas e emite com datas vazias para mostrar os date pickers
			customDateStart.value = "";
			customDateEnd.value = "";

			// Emite com datas temporárias (hoje) para permitir a mudança visual
			const hoje = new Date();
			const inicioHoje = new Date(hoje);
			inicioHoje.setHours(0, 0, 0, 0);
			const fimHoje = new Date(hoje);
			fimHoje.setHours(23, 59, 59, 999);

			emit("update:modelValue", {
				preset: "personalizado",
				data_inicio: inicioHoje.toISOString(),
				data_fim: fimHoje.toISOString(),
			});
			return;
		}

		// Calcular datas baseado no preset (ISO completo)
		const hoje = new Date();
		let dataInicio: string;
		let dataFim: string;

		switch (preset) {
			case "hoje": {
				const inicioHoje = new Date(hoje);
				inicioHoje.setHours(0, 0, 0, 0);
				const fimHoje = new Date(hoje);
				fimHoje.setHours(23, 59, 59, 999);
				dataInicio = inicioHoje.toISOString();
				dataFim = fimHoje.toISOString();
				break;
			}

			case "ontem": {
				const ontem = new Date(hoje);
				ontem.setDate(hoje.getDate() - 1);
				const inicioOntem = new Date(ontem);
				inicioOntem.setHours(0, 0, 0, 0);
				const fimOntem = new Date(ontem);
				fimOntem.setHours(23, 59, 59, 999);
				dataInicio = inicioOntem.toISOString();
				dataFim = fimOntem.toISOString();
				break;
			}

			case "ultimos_7_dias": {
				const seteDiasAtras = new Date(hoje);
				seteDiasAtras.setDate(hoje.getDate() - 7);
				seteDiasAtras.setHours(0, 0, 0, 0);
				const fimHoje = new Date(hoje);
				fimHoje.setHours(23, 59, 59, 999);
				dataInicio = seteDiasAtras.toISOString();
				dataFim = fimHoje.toISOString();
				break;
			}

			case "este_mes": {
				const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
				primeiroDia.setHours(0, 0, 0, 0);
				const fimHoje = new Date(hoje);
				fimHoje.setHours(23, 59, 59, 999);
				dataInicio = primeiroDia.toISOString();
				dataFim = fimHoje.toISOString();
				break;
			}

			case "este_ano": {
				const primeiroDiaAno = new Date(hoje.getFullYear(), 0, 1);
				primeiroDiaAno.setHours(0, 0, 0, 0);
				const fimHoje = new Date(hoje);
				fimHoje.setHours(23, 59, 59, 999);
				dataInicio = primeiroDiaAno.toISOString();
				dataFim = fimHoje.toISOString();
				break;
			}

			case "mes_passado": {
				const primeiroDiaMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
				primeiroDiaMesAnterior.setHours(0, 0, 0, 0);
				const ultimoDiaMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
				ultimoDiaMesAnterior.setHours(23, 59, 59, 999);
				dataInicio = primeiroDiaMesAnterior.toISOString();
				dataFim = ultimoDiaMesAnterior.toISOString();
				break;
			}

			case "ano_passado": {
				const primeiroDiaAnoAnterior = new Date(hoje.getFullYear() - 1, 0, 1);
				primeiroDiaAnoAnterior.setHours(0, 0, 0, 0);
				const ultimoDiaAnoAnterior = new Date(hoje.getFullYear() - 1, 11, 31);
				ultimoDiaAnoAnterior.setHours(23, 59, 59, 999);
				dataInicio = primeiroDiaAnoAnterior.toISOString();
				dataFim = ultimoDiaAnoAnterior.toISOString();
				break;
			}

			default: {
				const inicioHoje = new Date(hoje);
				inicioHoje.setHours(0, 0, 0, 0);
				const fimHoje = new Date(hoje);
				fimHoje.setHours(23, 59, 59, 999);
				dataInicio = inicioHoje.toISOString();
				dataFim = fimHoje.toISOString();
			}
		}

		const novoPeriodo = {
			preset,
			data_inicio: dataInicio,
			data_fim: dataFim,
		};

		emit("update:modelValue", novoPeriodo);
	},
});

// Watch para aplicar datas personalizadas
watch([customDateStart, customDateEnd], ([inicio, fim]) => {
	if (inicio && fim && periodoSelecionado.value === "personalizado") {
		// Converter YYYY-MM-DD para ISO completo
		const dataInicio = new Date(inicio + "T00:00:00");
		const dataFim = new Date(fim + "T23:59:59.999");

		emit("update:modelValue", {
			preset: "personalizado",
			data_inicio: dataInicio.toISOString(),
			data_fim: dataFim.toISOString(),
		});
	}
});

// Opções do filtro
const periodoOptions = [
	{ label: "Hoje", value: "hoje" },
	{ label: "Ontem", value: "ontem" },
	{ label: "Últimos 7 dias", value: "ultimos_7_dias" },
	{ label: "Últimos 30 dias", value: "ultimos_30_dias" },
	{ label: "Este mês", value: "este_mes" },
	{ label: "Mês passado", value: "mes_passado" },
	{ label: "Este ano", value: "este_ano" },
	{ label: "Ano passado", value: "ano_passado" },
	{ label: "Personalizado", value: "personalizado" },
];
</script>

<template>
	<div class="flex items-center gap-3 flex-wrap">
		<!-- Filtro de Período (sempre visível à esquerda) -->
		<UiSelect
			v-model="periodoSelecionado"
			:options="periodoOptions"
			size="sm"
			placeholder="Período"
			class="w-[180px]"
			:disabled="loading"
		/>

		<!-- DatePickers inline quando período personalizado (à direita do select) -->
		<template v-if="periodoSelecionado === 'personalizado'">
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
	</div>
</template>
