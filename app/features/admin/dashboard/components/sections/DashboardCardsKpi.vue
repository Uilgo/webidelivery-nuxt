<script setup lang="ts">
/**
 * 📊 DashboardStatsGrid - Grid de KPIs do Topo
 *
 * Responsável por renderizar os 4 cards principais de estatísticas
 * conectando os dados da interface DashboardKpis.
 * Todos os cards respeitam o período selecionado no filtro.
 */

import type { DashboardKpis } from "../../types/dashboard";
import type { DashboardPeriodo } from "../../types/filters";
import DashboardStatsCard from "../base/DashboardStatsCard.vue";

interface Props {
	kpis: DashboardKpis;
	loading?: boolean;
	periodo: DashboardPeriodo;
}

interface Emits {
	(e: "update:periodo", value: DashboardPeriodo): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Estados
const customDateStart = ref("");
const customDateEnd = ref("");

// Proxy para o v-model do período (disponível para uso futuro)
const _localPeriodo = computed({
	get: () => props.periodo,
	set: (val) => {
		// Quando mudar para personalizado, não faz nada (os DatePickers aparecem inline)
		// Quando mudar para outro período, limpa as datas personalizadas
		if (val !== "personalizado") {
			customDateStart.value = "";
			customDateEnd.value = "";
		}
		emit("update:periodo", val);
	},
});

// Watch para aplicar automaticamente quando ambas as datas forem selecionadas
watch([customDateStart, customDateEnd], ([inicio, fim]) => {
	if (inicio && fim && _localPeriodo.value === "personalizado") {
		// Emite atualização automaticamente quando ambas as datas estão preenchidas
		emit("update:periodo", "personalizado");
	}
});

// Opções do filtro de período (disponível para uso futuro)
const _periodoOptions = [
	{ label: "Hoje", value: "hoje" },
	{ label: "Ontem", value: "ontem" },
	{ label: "Últimos 7 dias", value: "ultimos_7_dias" },
	{ label: "Este Mês", value: "este_mes" },
	{ label: "Personalizado", value: "personalizado" },
];

// === TÍTULOS DINÂMICOS BASEADOS NO PERÍODO ===

/** Título do card de faturamento baseado no período */
const tituloFaturamento = computed(() => {
	const titulos: Record<DashboardPeriodo, string> = {
		hoje: "Faturamento do Dia",
		ontem: "Faturamento de Ontem",
		ultimos_7_dias: "Faturamento (7 dias)",
		este_mes: "Faturamento do Mês",
		personalizado: "Faturamento do Período",
	};
	return titulos[props.periodo] || "Faturamento";
});

/** Título do card de pedidos baseado no período */
const tituloPedidos = computed(() => {
	const titulos: Record<DashboardPeriodo, string> = {
		hoje: "Pedidos de Hoje",
		ontem: "Pedidos de Ontem",
		ultimos_7_dias: "Pedidos (7 dias)",
		este_mes: "Pedidos do Mês",
		personalizado: "Pedidos do Período",
	};
	return titulos[props.periodo] || "Pedidos Realizados";
});

/** Título do card de clientes baseado no período */
const tituloClientes = computed(() => {
	const titulos: Record<DashboardPeriodo, string> = {
		hoje: "Novos Clientes Hoje",
		ontem: "Novos Clientes Ontem",
		ultimos_7_dias: "Novos Clientes (7 dias)",
		este_mes: "Novos Clientes no Mês",
		personalizado: "Novos Clientes",
	};
	return titulos[props.periodo] || "Novos Clientes";
});

/** Label secundário dinâmico para variação */
const labelVariacao = computed(() => {
	const labels: Record<DashboardPeriodo, string> = {
		hoje: "vs. ontem",
		ontem: "vs. anteontem",
		ultimos_7_dias: "vs. 7 dias anteriores",
		este_mes: "vs. mês anterior",
		personalizado: "vs. período anterior",
	};
	return labels[props.periodo] || "vs. período anterior";
});

// Texto descritivo do período selecionado (disponível para uso futuro)
const _periodoTexto = computed(() => {
	const hoje = new Date();
	const opcoes: Record<string, string> = {
		hoje: `Hoje - ${hoje.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}`,
		ontem: (() => {
			const ontem = new Date(hoje);
			ontem.setDate(ontem.getDate() - 1);
			return `Ontem - ${ontem.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}`;
		})(),
		ultimos_7_dias: (() => {
			const inicio = new Date(hoje);
			inicio.setDate(inicio.getDate() - 6);
			return `${inicio.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} - ${hoje.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`;
		})(),
		este_mes: `${hoje.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`,
		personalizado: (() => {
			if (customDateStart.value && customDateEnd.value) {
				const inicio = new Date(customDateStart.value + "T00:00:00");
				const fim = new Date(customDateEnd.value + "T00:00:00");
				return `${inicio.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} - ${fim.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`;
			}
			return "Período personalizado";
		})(),
	};

	return opcoes[props.periodo] || "Período não definido";
});

/**
 * Formatter simples para moeda
 */
const formatCurrency = (value: number) => {
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(value);
};
</script>

<template>
	<!-- Grid de KPIs - Todos os cards respeitam o período selecionado -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		<!-- KPI 1: Faturamento (usa novo campo 'periodo' que respeita o filtro) -->
		<DashboardStatsCard
			:title="tituloFaturamento"
			:value="formatCurrency(kpis.faturamento.periodo)"
			variant="emerald"
			icon="lucide:dollar-sign"
			:trend="{
				value: kpis.faturamento.variacao,
				positive: kpis.faturamento.variacao >= 0,
			}"
			secondary-label="Ticket Médio:"
			:secondary-value="formatCurrency(kpis.faturamento.ticket_medio)"
		/>

		<!-- KPI 2: Pedidos -->
		<DashboardStatsCard
			:title="tituloPedidos"
			:value="kpis.pedidos_hoje.total"
			variant="blue"
			icon="lucide:shopping-bag"
			:trend="{
				value: kpis.pedidos_hoje.variacao_ontem,
				positive: kpis.pedidos_hoje.variacao_ontem >= 0,
			}"
			:secondary-label="labelVariacao"
		/>

		<!-- KPI 3: Clientes -->
		<DashboardStatsCard
			:title="tituloClientes"
			:value="kpis.clientes.novos"
			variant="violet"
			icon="lucide:users"
			:trend="{
				value: kpis.clientes.variacao,
				positive: kpis.clientes.variacao >= 0,
			}"
			secondary-label="Recorrência:"
			:secondary-value="`${kpis.clientes.recorrencia}%`"
		/>

		<!-- KPI 4: Taxa de Conclusão -->
		<DashboardStatsCard
			title="Taxa de Conclusão"
			:value="`${kpis.conversao.taxa}%`"
			variant="rose"
			icon="lucide:check-circle-2"
			:trend="{
				value: kpis.conversao.variacao,
				positive: kpis.conversao.variacao >= 0,
			}"
			secondary-label="Total de Pedidos:"
			:secondary-value="`${kpis.conversao.visitas}`"
		/>
	</div>
</template>
