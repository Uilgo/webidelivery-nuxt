<script setup lang="ts">
/**
 * PeriodoSelector
 *
 * Componente para seleção de período dos relatórios.
 * Suporta presets (hoje, últimos 7 dias, etc) e período personalizado.
 */

import type { PeriodoPreset } from "../../types/relatorios";
import { PERIODOS_PRESET } from "#shared/constants/relatorios";
import { useRelatoriosFiltros } from "../../composables/useRelatoriosFiltros";

const { periodo, setPeriodo, labelPeriodo } = useRelatoriosFiltros();

// Opções de período para o select
const opcoesPeriodo = Object.entries(PERIODOS_PRESET)
	.filter(([key]) => key !== "personalizado")
	.map(([key, value]) => ({
		value: key as PeriodoPreset,
		label: value.label,
	}));

// Handler de mudança de período
const handlePeriodoChange = (value: string | number | null) => {
	if (value && typeof value === "string") {
		setPeriodo(value as PeriodoPreset);
	}
};
</script>

<template>
	<div class="periodo-selector">
		<UiSelect
			:model-value="periodo.preset"
			:options="opcoesPeriodo"
			placeholder="Selecione o período"
			@update:model-value="handlePeriodoChange"
		>
			<template #trigger>
				<UiButton variant="outline" size="md" class="w-full justify-between">
					<div class="flex items-center gap-2">
						<Icon name="lucide:calendar" class="w-4 h-4" />
						<span>{{ labelPeriodo }}</span>
					</div>
					<Icon name="lucide:chevron-down" class="w-4 h-4" />
				</UiButton>
			</template>
		</UiSelect>
	</div>
</template>
