<script setup lang="ts">
/**
 * 📌 LogsTab
 *
 * Aba de Logs e Auditoria nas Configurações.
 * Exibe logs operacionais do estabelecimento com retenção de 12 meses.
 */

import { useLogsEstabelecimento } from "../../composables/useLogsEstabelecimento";
import { LOG_PERIODOS, LOG_ACOES_OPTIONS, LOG_TABELAS_OPTIONS } from "../../types/logs";
import type { LogComputado, LogPeriodo } from "#shared/types/logs";
import LogDetailModal from "../shared/LogDetailModal.vue";

const {
	logs,
	logsPorMes,
	stats,
	isLoading,
	error,
	filtros,
	buscarLogs,
	exportarLogs,
	setFiltros,
	limparFiltros,
} = useLogsEstabelecimento();

// Estado local
const viewMode = ref<"list" | "grouped">("grouped");
const showFilters = ref(false);
const selectedLog = ref<LogComputado | null>(null);
const showLogModal = ref(false);

// Formatar data
const formatarData = (data: string): string => {
	return new Date(data).toLocaleString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

// Badge de status
const getBadgeStatus = (
	diasAteExclusao: number | null,
): {
	text: string;
	color: "default" | "primary" | "success" | "warning" | "error" | "info" | "outline";
} => {
	if (diasAteExclusao === null) return { text: "Logs recentes", color: "success" };
	if (diasAteExclusao <= 7)
		return { text: `Será excluído em ${diasAteExclusao} dias`, color: "error" };
	if (diasAteExclusao <= 30)
		return { text: `Será excluído em ${diasAteExclusao} dias`, color: "warning" };
	return { text: "Logs recentes", color: "success" };
};
</script>

<template>
	<div class="space-y-6">
		<!-- Banner de Política de Retenção -->
		<div
			class="rounded-lg border border-info-200 bg-info-50 p-4 dark:border-info-800 dark:bg-info-900/20"
		>
			<div class="flex items-start gap-3">
				<Icon
					name="lucide:info"
					class="mt-0.5 h-5 w-5 flex-shrink-0 text-info-600 dark:text-info-400"
				/>
				<div class="flex-1 space-y-2">
					<h3 class="text-sm font-semibold text-info-900 dark:text-info-100">
						Política de Retenção de Logs
					</h3>
					<div class="space-y-1 text-xs text-info-700 dark:text-info-300">
						<p>• <strong>Logs Operacionais:</strong> mantidos por 12 meses</p>
						<p>
							• <strong>Logs de Segurança:</strong> mantidos permanentemente (gerenciados pela
							plataforma)
						</p>
					</div>
					<p class="text-xs text-info-600 dark:text-info-400">
						Logs com mais de 11 meses serão excluídos automaticamente. Faça backup regularmente para
						manter seu histórico.
					</p>
				</div>
			</div>
		</div>

		<!-- Estatísticas -->
		<div v-if="stats" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<div
				class="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800"
			>
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-neutral-600 dark:text-neutral-400">Total de Logs</p>
						<p class="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
							{{ stats.total }}
						</p>
					</div>
					<Icon name="lucide:file-text" class="h-8 w-8 text-neutral-400" />
				</div>
			</div>

			<div
				class="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800"
			>
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-neutral-600 dark:text-neutral-400">Próximos da Exclusão</p>
						<p class="mt-1 text-2xl font-semibold text-warning-600 dark:text-warning-400">
							{{ stats.logs_proximos_exclusao }}
						</p>
					</div>
					<Icon name="lucide:alert-triangle" class="h-8 w-8 text-warning-400" />
				</div>
			</div>

			<div
				class="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800"
			>
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-neutral-600 dark:text-neutral-400">Tabela Mais Ativa</p>
						<p class="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
							{{ Object.keys(stats.por_tabela)[0] || "N/A" }}
						</p>
					</div>
					<Icon name="lucide:trending-up" class="h-8 w-8 text-neutral-400" />
				</div>
			</div>

			<div
				class="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800"
			>
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-neutral-600 dark:text-neutral-400">Período</p>
						<p class="mt-1 text-xs font-medium text-neutral-700 dark:text-neutral-300">
							{{
								stats.periodo_mais_antigo
									? formatarData(stats.periodo_mais_antigo).split(" ")[0]
									: "N/A"
							}}
						</p>
					</div>
					<Icon name="lucide:calendar" class="h-8 w-8 text-neutral-400" />
				</div>
			</div>
		</div>

		<!-- Controles -->
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div class="flex items-center gap-2">
				<UiButton variant="outline" size="sm" @click="showFilters = !showFilters">
					<Icon name="lucide:filter" class="h-4 w-4" />
					Filtros
				</UiButton>

				<UiButton
					variant="outline"
					size="sm"
					@click="viewMode = viewMode === 'list' ? 'grouped' : 'list'"
				>
					<Icon
						:name="viewMode === 'list' ? 'lucide:layout-grid' : 'lucide:list'"
						class="h-4 w-4"
					/>
					{{ viewMode === "list" ? "Agrupar" : "Lista" }}
				</UiButton>
			</div>

			<div class="flex items-center gap-2">
				<UiButton variant="outline" size="sm" :disabled="isLoading" @click="buscarLogs">
					<Icon name="lucide:refresh-cw" class="h-4 w-4" :class="{ 'animate-spin': isLoading }" />
					Atualizar
				</UiButton>

				<UiButton variant="solid" color="primary" size="sm" @click="exportarLogs('excel')">
					<Icon name="lucide:download" class="h-4 w-4" />
					Exportar Todos
				</UiButton>
			</div>
		</div>

		<!-- Filtros -->
		<div
			v-if="showFilters"
			class="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50"
		>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<UiFormField label="Período">
					<UiSelect
						:model-value="filtros.periodo"
						:options="LOG_PERIODOS"
						@update:model-value="setFiltros({ periodo: $event as LogPeriodo })"
					/>
				</UiFormField>

				<UiFormField label="Ação">
					<UiSelect
						:model-value="filtros.acao"
						:options="[{ label: 'Todas', value: '' }, ...LOG_ACOES_OPTIONS]"
						@update:model-value="setFiltros({ acao: $event ? String($event) : undefined })"
					/>
				</UiFormField>

				<UiFormField label="Tabela">
					<UiSelect
						:model-value="filtros.tabela"
						:options="[{ label: 'Todas', value: '' }, ...LOG_TABELAS_OPTIONS]"
						@update:model-value="setFiltros({ tabela: $event ? String($event) : undefined })"
					/>
				</UiFormField>

				<UiFormField label="Buscar">
					<UiInput
						:model-value="filtros.search"
						placeholder="Buscar..."
						@update:model-value="setFiltros({ search: $event as string })"
					/>
				</UiFormField>
			</div>

			<div class="mt-4 flex justify-end">
				<UiButton variant="ghost" size="sm" @click="limparFiltros"> Limpar Filtros </UiButton>
			</div>
		</div>

		<!-- Loading -->
		<div v-if="isLoading" class="flex items-center justify-center py-12">
			<Icon name="lucide:loader" class="h-8 w-8 animate-spin text-primary-600" />
		</div>

		<!-- Error -->
		<div
			v-else-if="error"
			class="rounded-lg border border-error-200 bg-error-50 p-4 dark:border-error-800 dark:bg-error-900/20"
		>
			<p class="text-sm text-error-700 dark:text-error-300">{{ error }}</p>
		</div>

		<!-- Vista Agrupada por Mês -->
		<div v-else-if="viewMode === 'grouped' && logsPorMes.length > 0" class="space-y-4">
			<div
				v-for="grupo in logsPorMes"
				:key="grupo.mes"
				class="rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800"
			>
				<!-- Cabeçalho do Grupo -->
				<div
					class="flex items-center justify-between border-b border-neutral-200 p-4 dark:border-neutral-700"
				>
					<div class="flex items-center gap-3">
						<Icon name="lucide:calendar" class="h-5 w-5 text-neutral-400" />
						<div>
							<h3 class="font-semibold text-neutral-900 dark:text-neutral-100">
								{{ grupo.mes_formatado }}
							</h3>
							<p class="text-sm text-neutral-600 dark:text-neutral-400">
								{{ grupo.total }} {{ grupo.total === 1 ? "registro" : "registros" }}
							</p>
						</div>
					</div>

					<div class="flex items-center gap-2">
						<UiBadge :variant="getBadgeStatus(grupo.dias_ate_exclusao).color" size="sm">
							{{ getBadgeStatus(grupo.dias_ate_exclusao).text }}
						</UiBadge>

						<UiButton variant="ghost" size="sm" @click="exportarLogs('excel')">
							<Icon name="lucide:download" class="h-4 w-4" />
						</UiButton>
					</div>
				</div>

				<!-- Lista de Logs -->
				<div class="divide-y divide-neutral-200 dark:divide-neutral-700">
					<div
						v-for="log in grupo.logs.slice(0, 10)"
						:key="log.id"
						class="flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
					>
						<div class="flex-1">
							<p class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
								{{ log.descricao_formatada }}
							</p>
							<div
								class="mt-1 flex items-center gap-3 text-xs text-neutral-600 dark:text-neutral-400"
							>
								<span>{{ log.usuario_nome || "Sistema" }}</span>
								<span>•</span>
								<span>{{ formatarData(log.created_at) }}</span>
							</div>
						</div>

						<UiButton
							variant="ghost"
							size="sm"
							@click="
								selectedLog = log as LogComputado;
								showLogModal = true;
							"
						>
							<Icon name="lucide:eye" class="h-4 w-4" />
						</UiButton>
					</div>

					<div v-if="grupo.logs.length > 10" class="p-4 text-center">
						<p class="text-sm text-neutral-600 dark:text-neutral-400">
							+ {{ grupo.logs.length - 10 }} logs não exibidos
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Vista em Lista -->
		<div
			v-else-if="viewMode === 'list' && logs.length > 0"
			class="rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800"
		>
			<div class="divide-y divide-neutral-200 dark:divide-neutral-700">
				<div
					v-for="log in logs"
					:key="log.id"
					class="flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
				>
					<div class="flex-1">
						<p class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
							{{ log.descricao_formatada }}
						</p>
						<div
							class="mt-1 flex items-center gap-3 text-xs text-neutral-600 dark:text-neutral-400"
						>
							<span>{{ log.usuario_nome || "Sistema" }}</span>
							<span>•</span>
							<span>{{ formatarData(log.created_at) }}</span>
							<span v-if="log.sera_excluido">•</span>
							<UiBadge v-if="log.sera_excluido" variant="warning" size="sm">
								{{ log.dias_ate_exclusao }} dias
							</UiBadge>
						</div>
					</div>

					<UiButton
						variant="ghost"
						size="sm"
						@click="
							selectedLog = log as LogComputado;
							showLogModal = true;
						"
					>
						<Icon name="lucide:eye" class="h-4 w-4" />
					</UiButton>
				</div>
			</div>
		</div>

		<!-- Empty State -->
		<div v-else class="flex flex-col items-center justify-center py-12">
			<Icon name="lucide:file-text" class="h-16 w-16 text-neutral-300 dark:text-neutral-600" />
			<p class="mt-4 text-sm text-neutral-600 dark:text-neutral-400">Nenhum log encontrado</p>
		</div>

		<!-- Modal de Detalhes -->
		<LogDetailModal :open="showLogModal" :log="selectedLog" @close="showLogModal = false" />
	</div>
</template>
