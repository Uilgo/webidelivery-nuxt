<script setup lang="ts">
/**
 * 📌 LogDetailModal
 *
 * Modal para exibir detalhes completos de um log.
 * Mostra dados anteriores, novos, metadata, IP, User Agent, etc.
 */

import type { LogComputado } from "#shared/types/logs";
import { LOG_ACOES_DESCRICAO, LOG_TABELAS_DESCRICAO } from "#shared/types/logs";

// Props
interface Props {
	open: boolean;
	log: LogComputado | null;
}

defineProps<Props>();

// Emits
interface Emits {
	close: [];
}

defineEmits<Emits>();

// Formatar data
const formatarData = (data: string): string => {
	return new Date(data).toLocaleString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});
};

// Badge de ação
const getAcaoBadgeVariant = (
	acao: string,
): "default" | "primary" | "success" | "warning" | "error" | "info" | "outline" => {
	switch (acao) {
		case "criar":
			return "success";
		case "editar":
			return "primary";
		case "deletar":
			return "error";
		case "visualizar":
			return "info";
		case "exportar":
			return "outline";
		default:
			return "default";
	}
};
</script>

<template>
	<UiModal :model-value="open" size="xl" @update:model-value="$emit('close')">
		<template #header>
			<div class="flex items-center gap-3">
				<Icon name="lucide:file-text" class="h-5 w-5 text-primary-600 dark:text-primary-400" />
				<h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
					Detalhes do Log
				</h2>
			</div>
		</template>

		<template #default>
			<div v-if="log" class="space-y-6">
				<!-- Informações Principais -->
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div>
						<label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">
							Data/Hora
						</label>
						<p class="mt-1 text-sm text-neutral-900 dark:text-neutral-100">
							{{ formatarData(log.created_at) }}
						</p>
					</div>

					<div>
						<label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">
							Usuário
						</label>
						<p class="mt-1 text-sm text-neutral-900 dark:text-neutral-100">
							{{ log.usuario_nome || "Sistema" }}
						</p>
					</div>

					<div>
						<label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">
							E-mail
						</label>
						<p class="mt-1 text-sm text-neutral-900 dark:text-neutral-100">
							{{ log.usuario_email || "-" }}
						</p>
					</div>

					<div>
						<label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">
							Cargo
						</label>
						<p class="mt-1 text-sm text-neutral-900 dark:text-neutral-100">
							{{ log.usuario_cargo || "-" }}
						</p>
					</div>

					<div>
						<label class="text-xs font-medium text-neutral-600 dark:text-neutral-400"> Ação </label>
						<p class="mt-1">
							<UiBadge :variant="getAcaoBadgeVariant(log.acao)">
								{{ LOG_ACOES_DESCRICAO[log.acao] || log.acao }}
							</UiBadge>
						</p>
					</div>

					<div>
						<label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">
							Tabela
						</label>
						<p class="mt-1 text-sm text-neutral-900 dark:text-neutral-100">
							{{ LOG_TABELAS_DESCRICAO[log.tabela] || log.tabela }}
						</p>
					</div>

					<div>
						<label class="text-xs font-medium text-neutral-600 dark:text-neutral-400"> IP </label>
						<p class="mt-1 text-sm text-neutral-900 dark:text-neutral-100">
							{{ log.ip_address || "-" }}
						</p>
					</div>

					<div>
						<label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">
							Retenção
						</label>
						<p class="mt-1">
							<UiBadge v-if="log.sera_excluido" variant="warning" size="sm">
								Será excluído em {{ log.dias_ate_exclusao }} dias
							</UiBadge>
							<UiBadge v-else variant="success" size="sm"> Recente </UiBadge>
						</p>
					</div>
				</div>

				<!-- User Agent -->
				<div v-if="log.user_agent">
					<label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">
						Navegador
					</label>
					<p class="mt-1 text-sm text-neutral-900 dark:text-neutral-100">
						{{ log.user_agent }}
					</p>
				</div>

				<!-- Descrição -->
				<div>
					<label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">
						Descrição
					</label>
					<p class="mt-1 text-sm text-neutral-900 dark:text-neutral-100">
						{{ log.descricao_formatada }}
					</p>
				</div>

				<!-- Dados Anteriores -->
				<div v-if="log.dados_anteriores && Object.keys(log.dados_anteriores).length > 0">
					<label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">
						Dados Anteriores
					</label>
					<div
						class="mt-2 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50"
					>
						<pre class="overflow-x-auto text-xs text-neutral-900 dark:text-neutral-100">{{
							JSON.stringify(log.dados_anteriores, null, 2)
						}}</pre>
					</div>
				</div>

				<!-- Dados Novos -->
				<div v-if="log.dados_novos && Object.keys(log.dados_novos).length > 0">
					<label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">
						Dados Novos
					</label>
					<div
						class="mt-2 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50"
					>
						<pre class="overflow-x-auto text-xs text-neutral-900 dark:text-neutral-100">{{
							JSON.stringify(log.dados_novos, null, 2)
						}}</pre>
					</div>
				</div>

				<!-- Metadata -->
				<div v-if="log.metadata && Object.keys(log.metadata).length > 0">
					<label class="text-xs font-medium text-neutral-600 dark:text-neutral-400">
						Metadados
					</label>
					<div
						class="mt-2 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50"
					>
						<pre class="overflow-x-auto text-xs text-neutral-900 dark:text-neutral-100">{{
							JSON.stringify(log.metadata, null, 2)
						}}</pre>
					</div>
				</div>
			</div>
		</template>

		<template #footer>
			<div class="flex justify-end gap-3">
				<UiButton variant="outline" @click="$emit('close')"> Fechar </UiButton>
			</div>
		</template>
	</UiModal>
</template>
