<script setup lang="ts">
/**
 * 📌 PedidoDetalhesDrawer
 *
 * Drawer com detalhes completos do pedido usando UiDrawer.
 */

import type { PedidoCompleto, StatusPedido } from "~/features/admin/pedidos/types/pedidos-admin";
import {
	formatarStatus,
	formatarTipoEntrega,
	formatarFormaPagamento,
	formatarTempoDecorrido,
	formatarDataHora,
} from "~/features/admin/pedidos/utils/pedido-formatters";
import { formatarCodigoRastreamento } from "~/lib/formatters/codigo-rastreamento";
import { usePedidoHistorico } from "~/features/admin/pedidos/composables/usePedidoHistorico";
import { requerObservacao } from "~/features/admin/pedidos/utils/status-transitions";
import { STATUS_PEDIDO } from "#shared/constants/pedidos";

interface Props {
	modelValue: boolean;
	pedido: PedidoCompleto | null;
}

interface Emits {
	"update:modelValue": [value: boolean];
	acao: [pedido: PedidoCompleto, acao: string, motivo?: string];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

/**
 * Buscar histórico do pedido
 */
const { historico, loading: loadingHistorico } = usePedidoHistorico(
	computed(() => props.pedido?.id),
);

/**
 * Verificar se pode reativar pedido cancelado
 */
const podeReativar = computed(() => {
	return props.pedido?.status === STATUS_PEDIDO.CANCELADO;
});

/**
 * Buscar status anterior ao cancelamento no histórico
 */
const statusAnteriorCancelamento = computed(() => {
	if (!props.pedido || props.pedido.status !== "cancelado") return null;

	// Buscar no histórico o status anterior ao cancelamento
	const historicoCancelamento = historico.value.find(
		(h) => h.status_novo === STATUS_PEDIDO.CANCELADO && h.pedido_id === props.pedido?.id,
	);

	// Se encontrou, retornar o status anterior
	// Se não encontrou ou era pendente, voltar para pendente
	return historicoCancelamento?.status_anterior || "pendente";
});

/**
 * Configuração visual do status
 */
const statusConfig = computed(() => {
	if (!props.pedido) return null;

	const configs = {
		pendente: {
			variant: "warning" as const,
			icon: "lucide:clock",
		},
		aceito: {
			variant: "info" as const,
			icon: "lucide:check-circle",
		},
		preparo: {
			variant: "warning" as const,
			icon: "lucide:chef-hat",
		},
		pronto: {
			variant: "primary" as const,
			icon: "lucide:package-check",
		},
		entrega: {
			variant: "info" as const,
			icon: "lucide:bike",
		},
		concluido: {
			variant: "success" as const,
			icon: "lucide:check-circle-2",
		},
		cancelado: {
			variant: "error" as const,
			icon: "lucide:x-circle",
		},
	};

	return configs[props.pedido.status];
});

/**
 * Ações disponíveis por status
 */
const acoesDisponiveis = computed(() => {
	if (!props.pedido) return [];

	const acoes = {
		pendente: [
			{ label: "Aceitar Pedido", acao: "aceitar", color: "success" as const },
			{ label: "Cancelar", acao: "cancelar", color: "error" as const },
		],
		aceito: [
			{ label: "Iniciar Preparo", acao: "preparo", color: "primary" as const },
			{ label: "Cancelar", acao: "cancelar", color: "error" as const },
		],
		preparo: [{ label: "Marcar como Pronto", acao: "pronto", color: "primary" as const }],
		pronto: [
			{
				label: props.pedido.tipo_entrega === "delivery" ? "Saiu para Entrega" : "Concluir Pedido",
				acao: props.pedido.tipo_entrega === "delivery" ? "entrega" : "concluir",
				color: "success" as const,
			},
		],
		entrega: [{ label: "Marcar como Entregue", acao: "concluir", color: "success" as const }],
		concluido: [],
		cancelado: [],
	};

	return acoes[props.pedido.status] || [];
});

/**
 * Tempo decorrido desde criação
 */
const tempoDecorrido = computed(() => {
	if (!props.pedido) return "";
	return formatarTempoDecorrido(props.pedido.created_at);
});

/**
 * Estado interno
 */
const mostrarModalCancelamento = ref(false);
const motivoCancelamento = ref("");
const mostrarModalMudarStatus = ref(false);
const statusParaMudar = ref<StatusPedido | null>(null);
const observacaoMudanca = ref("");

/**
 * Emitir ação
 */
const handleAcao = (acao: string) => {
	if (!props.pedido) return;

	// Se for cancelamento, abrir modal de confirmação
	if (acao === "cancelar") {
		mostrarModalCancelamento.value = true;
		return;
	}

	// Outras ações emitem diretamente
	emit("acao", props.pedido, acao);
};

/**
 * Confirmar cancelamento
 */
const confirmarCancelamento = () => {
	if (!props.pedido || !motivoCancelamento.value.trim()) return;

	emit("acao", props.pedido, "cancelar", motivoCancelamento.value.trim());
	mostrarModalCancelamento.value = false;
	motivoCancelamento.value = "";
};

/**
 * Cancelar modal
 */
const cancelarModal = () => {
	mostrarModalCancelamento.value = false;
	motivoCancelamento.value = "";
};

/**
 * Reativar pedido cancelado
 */
const reativarPedido = () => {
	if (!props.pedido || !statusAnteriorCancelamento.value) return;

	// Abrir modal de confirmação com o status anterior
	statusParaMudar.value = statusAnteriorCancelamento.value as StatusPedido;
	observacaoMudanca.value = "";
	mostrarModalMudarStatus.value = true;
};

/**
 * Confirmar mudança de status
 */
const confirmarMudancaStatus = () => {
	if (!props.pedido || !statusParaMudar.value) return;

	// Validar observação obrigatória
	if (requerObservacao(props.pedido.status, statusParaMudar.value)) {
		if (!observacaoMudanca.value.trim()) {
			return;
		}
	}

	// Emitir ação com o novo status como "acao" e observação como "motivo"
	emit("acao", props.pedido, statusParaMudar.value, observacaoMudanca.value || undefined);
	mostrarModalMudarStatus.value = false;
	statusParaMudar.value = null;
	observacaoMudanca.value = "";
};

/**
 * Cancelar modal de mudança
 */
const cancelarModalMudanca = () => {
	mostrarModalMudarStatus.value = false;
	statusParaMudar.value = null;
	observacaoMudanca.value = "";
};

/**
 * Ícone do status
 */
const getStatusIcon = (status: StatusPedido): string => {
	const icons = {
		pendente: "lucide:clock",
		aceito: "lucide:check-circle",
		preparo: "lucide:chef-hat",
		pronto: "lucide:package-check",
		entrega: "lucide:bike",
		concluido: "lucide:check-circle-2",
		cancelado: "lucide:x-circle",
	};
	return icons[status];
};
</script>

<template>
	<UiDrawer
		:model-value="modelValue"
		:title="`Pedido #${pedido?.numero || ''}`"
		size="md"
		@update:model-value="emit('update:modelValue', $event)"
	>
		<div v-if="pedido" class="space-y-4">
			<!-- Status, Código e Tempo -->
			<div class="flex items-start justify-between gap-3">
				<div class="flex flex-col gap-2">
					<UiBadge v-if="statusConfig" :variant="statusConfig.variant" size="md">
						<template #iconLeft>
							<Icon :name="statusConfig.icon" class="w-3.5 h-3.5" />
						</template>
						{{ formatarStatus(pedido.status) }}
					</UiBadge>
					<!-- Código de Rastreamento -->
					<div class="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
						<Icon name="lucide:hash" class="w-3.5 h-3.5" />
						<span class="font-mono font-medium">
							{{ formatarCodigoRastreamento(pedido.codigo_rastreamento) }}
						</span>
					</div>
				</div>
				<div class="text-right">
					<p class="text-xs text-[var(--text-muted)]">{{ tempoDecorrido }}</p>
					<p class="text-xs text-[var(--text-muted)]">
						{{ formatarDataHora(pedido.created_at) }}
					</p>
				</div>
			</div>

			<!-- Cliente -->
			<UiCard variant="outlined" size="sm">
				<div class="space-y-1.5">
					<div class="flex items-center gap-2 text-[var(--text-primary)]">
						<Icon name="lucide:user" class="w-4 h-4" />
						<span class="text-sm font-semibold">Cliente</span>
					</div>
					<div class="pl-6 space-y-0.5">
						<p class="text-sm font-medium">{{ pedido.cliente_nome }}</p>
						<p class="text-xs text-[var(--text-muted)]">
							<Icon name="lucide:phone" class="w-3.5 h-3.5 inline mr-1" />
							{{ pedido.cliente_telefone }}
						</p>
						<p v-if="pedido.cliente_email" class="text-xs text-[var(--text-muted)]">
							<Icon name="lucide:mail" class="w-3.5 h-3.5 inline mr-1" />
							{{ pedido.cliente_email }}
						</p>
					</div>
				</div>
			</UiCard>

			<!-- Entrega -->
			<UiCard variant="outlined" size="sm">
				<div class="space-y-1.5">
					<div class="flex items-center gap-2 text-[var(--text-primary)]">
						<Icon
							:name="pedido.tipo_entrega === 'delivery' ? 'lucide:bike' : 'lucide:store'"
							class="w-4 h-4"
						/>
						<span class="text-sm font-semibold">{{
							formatarTipoEntrega(pedido.tipo_entrega)
						}}</span>
					</div>
					<div
						v-if="pedido.tipo_entrega === 'delivery' && pedido.endereco_rua"
						class="pl-6 space-y-0.5"
					>
						<p class="text-xs">{{ pedido.endereco_rua }}, {{ pedido.endereco_numero }}</p>
						<p v-if="pedido.endereco_complemento" class="text-xs">
							{{ pedido.endereco_complemento }}
						</p>
						<p class="text-xs">
							{{ pedido.endereco_bairro }} - {{ pedido.endereco_cidade }}/{{
								pedido.endereco_estado
							}}
						</p>
						<p class="text-xs">CEP: {{ pedido.endereco_cep }}</p>
						<p v-if="pedido.endereco_referencia" class="text-xs text-[var(--text-muted)]">
							Ref: {{ pedido.endereco_referencia }}
						</p>
					</div>
					<div v-else class="pl-6">
						<p class="text-xs text-[var(--text-muted)]">Cliente retirará no local</p>
					</div>
				</div>
			</UiCard>

			<!-- Itens -->
			<UiCard variant="outlined" size="sm">
				<div class="space-y-2">
					<div class="flex items-center gap-2 text-[var(--text-primary)]">
						<Icon name="lucide:shopping-bag" class="w-4 h-4" />
						<span class="text-sm font-semibold">Itens ({{ pedido.itens.length }})</span>
					</div>
					<div class="pl-6 space-y-3">
						<div
							v-for="item in pedido.itens"
							:key="item.id"
							class="pb-2 border-b border-[var(--border-muted)] last:border-0 last:pb-0"
						>
							<div class="flex items-start justify-between gap-2">
								<div class="flex-1">
									<p class="text-xs font-medium">
										{{ item.quantidade }}x {{ item.produto_nome }}
										<span v-if="item.variacao_nome" class="text-[var(--text-muted)]">
											({{ item.variacao_nome }})
										</span>
									</p>
									<!-- Adicionais -->
									<div
										v-if="item.adicionais && item.adicionais.length > 0"
										class="mt-0.5 space-y-0.5"
									>
										<p
											v-for="adicional in item.adicionais"
											:key="adicional.id"
											class="text-xs text-[var(--text-muted)] pl-3"
										>
											+ {{ adicional.adicional_nome }}
										</p>
									</div>
									<!-- Observações -->
									<p v-if="item.observacoes" class="text-xs text-[var(--text-muted)] mt-0.5 italic">
										Obs: {{ item.observacoes }}
									</p>
								</div>
								<span class="text-xs font-medium text-[var(--text-primary)]">
									{{ $formatCurrency(item.subtotal) }}
								</span>
							</div>
						</div>
					</div>
				</div>
			</UiCard>

			<!-- Pagamento -->
			<UiCard variant="outlined" size="sm">
				<div class="space-y-2">
					<div class="flex items-center gap-2 text-[var(--text-primary)]">
						<Icon name="lucide:credit-card" class="w-4 h-4" />
						<span class="text-sm font-semibold">Pagamento</span>
					</div>
					<div class="pl-6 space-y-1.5">
						<div class="flex items-center justify-between text-xs">
							<span class="text-[var(--text-muted)]">Forma:</span>
							<span class="font-medium">{{ formatarFormaPagamento(pedido.forma_pagamento) }}</span>
						</div>
						<div
							v-if="pedido.forma_pagamento === 'dinheiro' && pedido.troco_para"
							class="flex items-center justify-between text-xs"
						>
							<span class="text-[var(--text-muted)]">Troco para:</span>
							<span class="font-medium">{{ $formatCurrency(pedido.troco_para) }}</span>
						</div>
						<div class="pt-1.5 border-t border-[var(--border-muted)] space-y-1">
							<div class="flex items-center justify-between text-xs">
								<span class="text-[var(--text-muted)]">Subtotal:</span>
								<span>{{ $formatCurrency(pedido.subtotal) }}</span>
							</div>
							<div class="flex items-center justify-between text-xs">
								<span class="text-[var(--text-muted)]">Taxa de entrega:</span>
								<span>{{ $formatCurrency(pedido.taxa_entrega) }}</span>
							</div>
							<div v-if="pedido.desconto > 0" class="flex items-center justify-between text-xs">
								<span class="text-[var(--text-muted)]">Desconto:</span>
								<span class="text-[var(--success)]">-{{ $formatCurrency(pedido.desconto) }}</span>
							</div>
							<div class="flex items-center justify-between text-base font-bold pt-1.5">
								<span>Total:</span>
								<span class="text-[var(--primary)]">{{ $formatCurrency(pedido.total) }}</span>
							</div>
						</div>
					</div>
				</div>
			</UiCard>

			<!-- Observações Gerais -->
			<UiCard v-if="pedido.observacoes" variant="outlined" size="sm">
				<div class="space-y-1.5">
					<div class="flex items-center gap-2 text-[var(--text-primary)]">
						<Icon name="lucide:message-square" class="w-4 h-4" />
						<span class="text-sm font-semibold">Observações</span>
					</div>
					<p class="pl-6 text-xs text-[var(--text-muted)]">{{ pedido.observacoes }}</p>
				</div>
			</UiCard>

			<!-- Motivo Cancelamento -->
			<UiCard
				v-if="pedido.status === STATUS_PEDIDO.CANCELADO && pedido.motivo_cancelamento"
				variant="outlined"
				size="sm"
			>
				<div class="space-y-1.5">
					<div class="flex items-center gap-2 text-[var(--error)]">
						<Icon name="lucide:alert-circle" class="w-4 h-4" />
						<span class="text-sm font-semibold">Motivo do Cancelamento</span>
					</div>
					<p class="pl-6 text-xs text-[var(--text-muted)]">{{ pedido.motivo_cancelamento }}</p>
				</div>
			</UiCard>

			<!-- Histórico de Status -->
			<div v-if="historico.length > 0" class="border-t pt-4">
				<h4 class="font-medium mb-3 flex items-center gap-2 text-sm">
					<Icon name="lucide:history" class="w-4 h-4" />
					Histórico de Status
				</h4>

				<div v-if="loadingHistorico" class="text-center py-4">
					<Icon name="lucide:loader-2" class="w-5 h-5 animate-spin mx-auto text-[var(--primary)]" />
				</div>

				<div v-else class="space-y-2">
					<div
						v-for="item in historico"
						:key="item.id"
						class="flex items-start gap-3 text-sm p-3 rounded-lg bg-[var(--surface-secondary)]"
					>
						<Icon
							:name="getStatusIcon(item.status_novo)"
							class="w-4 h-4 mt-0.5 flex-shrink-0 text-[var(--primary)]"
						/>
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 flex-wrap">
								<span class="font-medium text-xs">{{ formatarStatus(item.status_novo) }}</span>
								<span class="text-[var(--text-muted)] text-xs">
									{{ formatarDataHora(item.created_at) }}
								</span>
							</div>
							<div class="text-[var(--text-muted)] text-xs mt-0.5">
								por {{ item.usuario_nome || "Sistema" }}
							</div>
							<div v-if="item.observacao" class="text-[var(--text-muted)] text-xs mt-1 italic">
								"{{ item.observacao }}"
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Footer com Ações (fixo) -->
		<template v-if="acoesDisponiveis.length > 0 || podeReativar" #footer>
			<div class="flex items-center gap-3">
				<!-- Botão Reativar para pedidos cancelados -->
				<UiButton
					v-if="podeReativar"
					color="success"
					variant="solid"
					size="md"
					class="flex-1"
					@click="reativarPedido"
				>
					<template #iconLeft>
						<Icon name="lucide:rotate-ccw" />
					</template>
					Reativar Pedido
				</UiButton>

				<!-- Botões de ação normais -->
				<UiButton
					v-for="acao in acoesDisponiveis"
					:key="acao.acao"
					:color="acao.color"
					variant="solid"
					size="md"
					class="flex-1"
					@click="handleAcao(acao.acao)"
				>
					{{ acao.label }}
				</UiButton>
			</div>
		</template>
	</UiDrawer>

	<!-- Modal de Confirmação de Cancelamento -->
	<UiModal
		v-model="mostrarModalCancelamento"
		title="Cancelar Pedido"
		size="md"
		@update:model-value="(val) => !val && cancelarModal()"
	>
		<div class="space-y-4">
			<p class="text-sm text-[var(--text-secondary)]">
				Tem certeza que deseja cancelar o pedido #{{ pedido?.numero }}?
			</p>

			<div>
				<label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
					Motivo do cancelamento <span class="text-[var(--error)]">*</span>
				</label>
				<textarea
					v-model="motivoCancelamento"
					placeholder="Informe o motivo do cancelamento..."
					rows="4"
					class="w-full px-3 py-2 text-sm bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg focus:outline-none focus:border-[var(--input-border-focus)] focus:ring-2 focus:ring-[var(--input-border-focus)] focus:ring-opacity-20 resize-none"
				></textarea>
			</div>
		</div>

		<template #footer>
			<div class="flex items-center gap-3">
				<UiButton variant="ghost" color="neutral" size="md" class="flex-1" @click="cancelarModal">
					Voltar
				</UiButton>
				<UiButton
					variant="solid"
					color="error"
					size="md"
					class="flex-[2]"
					:disabled="!motivoCancelamento.trim()"
					@click="confirmarCancelamento"
				>
					Confirmar Cancelamento
				</UiButton>
			</div>
		</template>
	</UiModal>

	<!-- Modal de Mudança de Status -->
	<UiModal
		v-model="mostrarModalMudarStatus"
		:title="
			pedido?.status === STATUS_PEDIDO.CANCELADO ? 'Reativar Pedido' : 'Confirmar Mudança de Status'
		"
		size="sm"
		@update:model-value="(val) => !val && cancelarModalMudanca()"
	>
		<div class="space-y-4">
			<!-- Mensagem para reativação -->
			<p v-if="pedido?.status === STATUS_PEDIDO.CANCELADO" class="text-sm text-[var(--text-muted)]">
				Você está prestes a <strong class="text-[var(--success)]">reativar</strong> o pedido
				cancelado.
				<br />
				O pedido voltará para o status:
				<strong v-if="statusParaMudar">{{ formatarStatus(statusParaMudar) }}</strong>
			</p>

			<!-- Mensagem para mudança normal -->
			<p v-else class="text-sm text-[var(--text-muted)]">
				Você está prestes a mudar o status do pedido de
				<strong v-if="pedido">{{ formatarStatus(pedido.status) }}</strong> para
				<strong v-if="statusParaMudar">{{ formatarStatus(statusParaMudar) }}</strong
				>.
			</p>

			<div>
				<label class="block text-sm font-medium mb-2">
					Observação
					<span
						v-if="
							pedido && statusParaMudar !== null && requerObservacao(pedido.status, statusParaMudar)
						"
						class="text-[var(--error)]"
					>
						*
					</span>
				</label>
				<textarea
					v-model="observacaoMudanca"
					placeholder="Descreva o motivo da mudança..."
					rows="3"
					class="w-full px-3 py-2 text-sm bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg focus:outline-none focus:border-[var(--input-border-focus)] focus:ring-2 focus:ring-[var(--input-border-focus)] focus:ring-opacity-20 resize-none"
				></textarea>
			</div>
		</div>

		<template #footer>
			<div class="flex items-center gap-3">
				<UiButton
					variant="ghost"
					color="neutral"
					size="md"
					class="flex-1"
					@click="cancelarModalMudanca"
				>
					Cancelar
				</UiButton>
				<UiButton
					variant="solid"
					color="primary"
					size="md"
					class="flex-[2]"
					:disabled="
						!!(
							pedido &&
							statusParaMudar !== null &&
							requerObservacao(pedido.status, statusParaMudar) &&
							!observacaoMudanca.trim()
						)
					"
					@click="confirmarMudancaStatus"
				>
					Confirmar Mudança
				</UiButton>
			</div>
		</template>
	</UiModal>
</template>

<style>
/* Aumentar z-index de modais dentro de drawers */
.fixed.z-50 {
	z-index: 9999 !important;
}
</style>
