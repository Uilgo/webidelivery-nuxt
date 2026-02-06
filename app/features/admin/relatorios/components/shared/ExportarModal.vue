<script setup lang="ts">
/**
 * 📌 ExportarModal
 *
 * Modal para configurar e exportar relatórios em PDF, Excel ou CSV.
 * Permite escolher formato, orientação e o que incluir na exportação.
 */

import { ref, computed } from "vue";
import type { OpcoesExportacao, TipoExportacao, OrientacaoPdf } from "../../types/relatorios";

/**
 * Props do componente
 */
interface Props {
	modelValue: boolean;
	titulo?: string;
}

/**
 * Emits do componente
 */
interface Emits {
	"update:modelValue": [value: boolean];
	exportar: [opcoes: OpcoesExportacao];
}

withDefaults(defineProps<Props>(), {
	titulo: "Exportar Relatório",
});

const emit = defineEmits<Emits>();

/**
 * Estado do formulário
 */
const tipoSelecionado = ref<TipoExportacao>("pdf");
const incluirGraficos = ref(true);
const incluirTabelas = ref(true);
const orientacao = ref<OrientacaoPdf>("retrato");

/**
 * Fecha o modal
 */
const fechar = () => {
	emit("update:modelValue", false);
};

/**
 * Confirma a exportação
 */
const confirmarExportacao = () => {
	const opcoes: OpcoesExportacao = {
		tipo: tipoSelecionado.value,
		incluir_graficos: incluirGraficos.value,
		incluir_tabelas: incluirTabelas.value,
		orientacao: tipoSelecionado.value === "pdf" ? orientacao.value : undefined,
	};

	emit("exportar", opcoes);
	fechar();
};

/**
 * Verifica se pode exportar
 */
const podeExportar = computed(() => {
	return incluirGraficos.value || incluirTabelas.value;
});
</script>

<template>
	<Teleport to="body">
		<Transition
			enter-active-class="transition-opacity duration-200"
			enter-from-class="opacity-0"
			enter-to-class="opacity-100"
			leave-active-class="transition-opacity duration-200"
			leave-from-class="opacity-100"
			leave-to-class="opacity-0"
		>
			<div
				v-if="modelValue"
				class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
				@click.self="fechar"
			>
				<!-- Modal -->
				<div class="w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-gray-800" @click.stop>
					<!-- Header -->
					<div class="flex items-center justify-between border-b p-4 dark:border-gray-700">
						<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
							{{ titulo }}
						</h3>
						<button
							type="button"
							class="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
							@click="fechar"
						>
							<Icon name="lucide:x" class="h-5 w-5" />
						</button>
					</div>

					<!-- Body -->
					<div class="space-y-4 p-4">
						<!-- Tipo de Exportação -->
						<div>
							<label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
								Formato
							</label>
							<div class="grid grid-cols-3 gap-2">
								<button
									type="button"
									class="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
									:class="{
										'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400':
											tipoSelecionado === 'pdf',
										'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300':
											tipoSelecionado !== 'pdf',
									}"
									@click="tipoSelecionado = 'pdf'"
								>
									PDF
								</button>
								<button
									type="button"
									class="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
									:class="{
										'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400':
											tipoSelecionado === 'excel',
										'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300':
											tipoSelecionado !== 'excel',
									}"
									@click="tipoSelecionado = 'excel'"
								>
									Excel
								</button>
								<button
									type="button"
									class="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
									:class="{
										'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400':
											tipoSelecionado === 'csv',
										'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300':
											tipoSelecionado !== 'csv',
									}"
									@click="tipoSelecionado = 'csv'"
								>
									CSV
								</button>
							</div>
						</div>

						<!-- Orientação (apenas PDF) -->
						<div v-if="tipoSelecionado === 'pdf'">
							<label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
								Orientação
							</label>
							<div class="grid grid-cols-2 gap-2">
								<button
									type="button"
									class="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
									:class="{
										'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400':
											orientacao === 'retrato',
										'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300':
											orientacao !== 'retrato',
									}"
									@click="orientacao = 'retrato'"
								>
									Retrato
								</button>
								<button
									type="button"
									class="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
									:class="{
										'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400':
											orientacao === 'paisagem',
										'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300':
											orientacao !== 'paisagem',
									}"
									@click="orientacao = 'paisagem'"
								>
									Paisagem
								</button>
							</div>
						</div>

						<!-- Opções de Conteúdo -->
						<div class="space-y-2">
							<label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
								Incluir
							</label>

							<!-- Incluir Gráficos -->
							<label class="flex items-center gap-2">
								<input
									v-model="incluirGraficos"
									type="checkbox"
									class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
								/>
								<span class="text-sm text-gray-700 dark:text-gray-300">Gráficos</span>
							</label>

							<!-- Incluir Tabelas -->
							<label class="flex items-center gap-2">
								<input
									v-model="incluirTabelas"
									type="checkbox"
									class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
								/>
								<span class="text-sm text-gray-700 dark:text-gray-300">Tabelas</span>
							</label>
						</div>

						<!-- Aviso -->
						<div
							v-if="!podeExportar"
							class="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
						>
							<Icon name="lucide:alert-triangle" class="mr-1 inline h-4 w-4" />
							Selecione pelo menos uma opção para exportar
						</div>
					</div>

					<!-- Footer -->
					<div class="flex justify-end gap-2 border-t p-4 dark:border-gray-700">
						<button
							type="button"
							class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
							@click="fechar"
						>
							Cancelar
						</button>
						<button
							type="button"
							class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
							:disabled="!podeExportar"
							@click="confirmarExportacao"
						>
							Exportar
						</button>
					</div>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>
