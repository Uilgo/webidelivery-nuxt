<script setup lang="ts">
/**
 * 🔍 RelatoriosFiltros
 *
 * Barra de filtros globais dos relatórios:
 * - Seletor de período
 * - Botão de refresh
 * - Botão de exportar
 */

import PeriodoSelector from "./shared/PeriodoSelector.vue";
import { useRelatoriosFiltros } from "../composables/useRelatoriosFiltros";
import { useRelatoriosPermissions } from "../composables/useRelatoriosPermissions";
import type { FiltrosPeriodo } from "../types/relatorios";

interface Props {
	loading?: boolean;
}

interface Emits {
	refresh: [];
	exportar: [];
}

withDefaults(defineProps<Props>(), {
	loading: false,
});

const emit = defineEmits<Emits>();

const { periodo, setPeriodo, setPeriodoCustomizado } = useRelatoriosFiltros();
const { podeExportar } = useRelatoriosPermissions();

// Handler para mudança de período
const handlePeriodoChange = (novoPeriodo: FiltrosPeriodo) => {
	// Se for personalizado, usar setPeriodoCustomizado com as datas
	if (novoPeriodo.preset === "personalizado") {
		setPeriodoCustomizado(novoPeriodo.data_inicio, novoPeriodo.data_fim);
	} else {
		// Para outros presets, usar setPeriodo que recalcula as datas
		setPeriodo(novoPeriodo.preset);
	}
};

// Handlers
const handleRefresh = () => {
	emit("refresh");
};

const handleExportar = () => {
	emit("exportar");
};
</script>

<template>
	<div
		class="relatorios-filtros bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
	>
		<div class="flex items-center justify-between gap-4 flex-wrap">
			<!-- Seletor de Período -->
			<div class="flex items-center gap-4 flex-1 min-w-0">
				<PeriodoSelector :model-value="periodo" @update:model-value="handlePeriodoChange" />

				<!-- Info do Período ao lado -->
				<div
					v-if="periodo"
					class="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap hidden lg:flex items-center"
				>
					<Icon name="lucide:calendar" class="w-4 h-4 mr-1" />
					<span>
						{{ new Date(periodo.data_inicio).toLocaleDateString("pt-BR") }} até
						{{ new Date(periodo.data_fim).toLocaleDateString("pt-BR") }}
					</span>
				</div>
			</div>

			<!-- Ações -->
			<div class="flex items-center gap-2 shrink-0">
				<!-- Botão Refresh (apenas ícone com rotação) -->
				<UiButton
					variant="outline"
					size="md"
					icon="lucide:refresh-cw"
					:disabled="loading"
					:class="{ 'animate-spin': loading }"
					title="Atualizar relatório"
					@click="handleRefresh"
				/>

				<!-- Botão Exportar -->
				<UiButton v-if="podeExportar" variant="solid" size="md" @click="handleExportar">
					<template #iconLeft>
						<Icon name="lucide:download" class="w-4 h-4" />
					</template>
					<span>Exportar</span>
				</UiButton>
			</div>
		</div>
	</div>
</template>
