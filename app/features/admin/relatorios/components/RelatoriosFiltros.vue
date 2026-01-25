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

interface Emits {
	refresh: [];
	exportar: [];
}

const emit = defineEmits<Emits>();

const { periodo } = useRelatoriosFiltros();
const { podeExportar } = useRelatoriosPermissions();

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
			<div class="flex-1 min-w-[300px]">
				<PeriodoSelector />
			</div>

			<!-- Ações -->
			<div class="flex items-center gap-2">
				<!-- Botão Refresh -->
				<UiButton variant="outline" size="md" @click="handleRefresh">
					<Icon name="lucide:refresh-cw" class="w-4 h-4" />
					<span>Atualizar</span>
				</UiButton>

				<!-- Botão Exportar -->
				<UiButton v-if="podeExportar" variant="solid" size="md" @click="handleExportar">
					<Icon name="lucide:download" class="w-4 h-4" />
					<span>Exportar</span>
				</UiButton>
			</div>
		</div>

		<!-- Info do Período Selecionado -->
		<div v-if="periodo" class="mt-3 text-sm text-gray-600 dark:text-gray-400">
			<Icon name="lucide:calendar" class="w-4 h-4 inline mr-1" />
			<span>
				Período: {{ new Date(periodo.data_inicio).toLocaleDateString("pt-BR") }} até
				{{ new Date(periodo.data_fim).toLocaleDateString("pt-BR") }}
			</span>
		</div>
	</div>
</template>
