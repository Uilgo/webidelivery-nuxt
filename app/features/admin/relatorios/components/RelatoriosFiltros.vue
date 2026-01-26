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
			<!-- Seletor de Período com Info -->
			<div class="flex items-center gap-4 flex-1">
				<!-- Select com largura máxima -->
				<div class="w-full max-w-xs">
					<PeriodoSelector />
				</div>

				<!-- Info do Período ao lado -->
				<div v-if="periodo" class="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
					<Icon name="lucide:calendar" class="w-4 h-4 inline mr-1" />
					<span>
						Período: {{ new Date(periodo.data_inicio).toLocaleDateString("pt-BR") }} até
						{{ new Date(periodo.data_fim).toLocaleDateString("pt-BR") }}
					</span>
				</div>
			</div>

			<!-- Ações -->
			<div class="flex items-center gap-2">
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
