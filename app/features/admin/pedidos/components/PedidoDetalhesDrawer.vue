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
import { useToast } from "~/composables/ui/useToast";
import { useEstabelecimentoStore } from "~/stores/estabelecimento";

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
 * Composables
 */
const toast = useToast();
const estabelecimentoStore = useEstabelecimentoStore();

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
 * Copiar link da página de rastreamento do pedido
 */
const copiarLinkRastreamento = async () => {
	if (!props.pedido) return;

	const estabelecimento = estabelecimentoStore.estabelecimento;
	if (!estabelecimento?.slug) {
		toast.add({
			title: "Erro",
			description: "Não foi possível obter o slug do estabelecimento",
			color: "error",
		});
		return;
	}

	// Gerar URL completa da página de rastreamento
	const baseUrl = window.location.origin;
	const linkRastreamento = `${baseUrl}/${estabelecimento.slug}/pedido/${props.pedido.codigo_rastreamento}`;

	try {
		await navigator.clipboard.writeText(linkRastreamento);
		toast.add({
			title: "Link copiado!",
			description: "O link de rastreamento foi copiado para a área de transferência",
			color: "success",
			duration: 3000,
		});
	} catch {
		toast.add({
			title: "Erro ao copiar",
			description: "Não foi possível copiar o link",
			color: "error",
		});
	}
};

/**
 * Abrir página de rastreamento em nova aba
 */
const abrirPaginaRastreamento = () => {
	if (!props.pedido) return;

	const estabelecimento = estabelecimentoStore.estabelecimento;
	if (!estabelecimento?.slug) return;

	const baseUrl = window.location.origin;
	const linkRastreamento = `${baseUrl}/${estabelecimento.slug}/pedido/${props.pedido.codigo_rastreamento}`;

	window.open(linkRastreamento, "_blank");
};

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
const mostrarModalComprovante = ref(false);
const mostrarModalRejeitarComprovante = ref(false);
const motivoRejeicao = ref("");
const validandoComprovante = ref(false);

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
 * Abrir modal de comprovante
 */
const abrirComprovante = () => {
	mostrarModalComprovante.value = true;
};

/**
 * Baixar comprovante
 */
const baixarComprovante = (event?: Event) => {
	event?.preventDefault();
	event?.stopPropagation();

	if (!props.pedido?.comprovante_pix) {
		console.error("Comprovante não encontrado");
		toast.add({
			title: "Erro",
			description: "Comprovante não encontrado",
			color: "error",
		});
		return;
	}

	try {
		// Converter Base64 para Blob
		const base64 = props.pedido.comprovante_pix;
		const parts = base64.split(",");

		if (parts.length !== 2) {
			throw new Error("Formato de Base64 inválido");
		}

		const [metadata, data] = parts;

		if (!data) {
			throw new Error("Dados do Base64 não encontrados");
		}

		const mimeTypeMatch = metadata?.match(/:(.*?);/);
		const mimeType = mimeTypeMatch?.[1] || "application/octet-stream";
		const extension = mimeType.split("/")[1] || "bin";

		const byteCharacters = atob(data);
		const byteNumbers = new Array(byteCharacters.length);
		for (let i = 0; i < byteCharacters.length; i++) {
			byteNumbers[i] = byteCharacters.charCodeAt(i);
		}
		const byteArray = new Uint8Array(byteNumbers);
		const blob = new Blob([byteArray], { type: mimeType });

		// Criar link de download
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `comprovante-pedido-${props.pedido.numero}.${extension}`;
		link.style.display = "none";
		document.body.appendChild(link);

		link.click();

		// Aguardar um pouco antes de limpar
		setTimeout(() => {
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		}, 100);

		toast.add({
			title: "Download iniciado",
			description: "O comprovante está sendo baixado",
			color: "success",
		});
	} catch (error) {
		console.error("Erro ao baixar comprovante:", error);
		toast.add({
			title: "Erro ao baixar",
			description: error instanceof Error ? error.message : "Não foi possível baixar o comprovante",
			color: "error",
		});
	}
};

/**
 * Validar comprovante PIX
 */
const validarComprovante = async () => {
	if (!props.pedido) return;

	validandoComprovante.value = true;

	try {
		const supabase = useSupabaseClient();
		const { data, error } = await supabase.rpc("validar_comprovante_pix", {
			pedido_id: props.pedido.id,
			validado: true,
		});

		if (error) throw error;

		const resultado = data as { success: boolean; error?: string; message?: string };

		if (!resultado.success) {
			toast.add({
				title: "Erro ao validar",
				description: resultado.error || "Não foi possível validar o comprovante",
				color: "error",
			});
			return;
		}

		toast.add({
			title: "Comprovante validado!",
			description: "O pedido foi aceito e está pronto para preparo",
			color: "success",
		});

		// Emitir evento para atualizar lista
		emit("acao", props.pedido, "atualizar");
	} catch (error) {
		console.error("Erro ao validar comprovante:", error);
		toast.add({
			title: "Erro ao validar",
			description: "Ocorreu um erro ao validar o comprovante",
			color: "error",
		});
	} finally {
		validandoComprovante.value = false;
	}
};

/**
 * Rejeitar comprovante PIX
 */
const rejeitarComprovante = async () => {
	if (!props.pedido) return;

	try {
		const supabase = useSupabaseClient();
		const { data, error } = await supabase.rpc("rejeitar_comprovante_pix", {
			pedido_id: props.pedido.id,
			motivo: motivoRejeicao.value || null,
		});

		if (error) throw error;

		const resultado = data as { success: boolean; error?: string; message?: string };

		if (!resultado.success) {
			toast.add({
				title: "Erro ao rejeitar",
				description: resultado.error || "Não foi possível rejeitar o comprovante",
				color: "error",
			});
			return;
		}

		toast.add({
			title: "Comprovante rejeitado",
			description: "O cliente pode enviar um novo comprovante",
			color: "success",
		});

		// Fechar modal e limpar
		mostrarModalRejeitarComprovante.value = false;
		motivoRejeicao.value = "";

		// Emitir evento para atualizar lista
		emit("acao", props.pedido, "atualizar");
	} catch (error) {
		console.error("Erro ao rejeitar comprovante:", error);
		toast.add({
			title: "Erro ao rejeitar",
			description: "Ocorreu um erro ao rejeitar o comprovante",
			color: "error",
		});
	}
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
					<div class="flex items-center gap-2">
						<div class="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
							<Icon name="lucide:hash" class="w-3.5 h-3.5" />
							<span class="font-mono font-medium">
								{{ formatarCodigoRastreamento(pedido.codigo_rastreamento) }}
							</span>
						</div>
						<!-- Botões de Ação -->
						<div class="flex items-center gap-1">
							<button
								type="button"
								class="p-1 rounded-md hover:bg-[var(--bg-muted)] transition-colors"
								title="Copiar link de rastreamento"
								@click="copiarLinkRastreamento"
							>
								<Icon
									name="lucide:copy"
									class="w-3.5 h-3.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
								/>
							</button>
							<button
								type="button"
								class="p-1 rounded-md hover:bg-[var(--bg-muted)] transition-colors"
								title="Abrir página de rastreamento"
								@click="abrirPaginaRastreamento"
							>
								<Icon
									name="lucide:external-link"
									class="w-3.5 h-3.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
								/>
							</button>
						</div>
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

			<!-- Comprovante PIX -->
			<UiCard v-if="pedido.forma_pagamento === 'pix'" variant="outlined" size="sm">
				<div class="space-y-2">
					<div class="flex items-center gap-2 text-[var(--text-primary)]">
						<Icon name="lucide:receipt" class="w-4 h-4" />
						<span class="text-sm font-semibold">Comprovante PIX</span>
					</div>

					<!-- Aguardando comprovante -->
					<div v-if="!pedido.comprovante_pix" class="pl-6">
						<div class="flex items-center gap-2 text-xs text-[var(--text-muted)]">
							<Icon name="lucide:clock" class="w-4 h-4" />
							<span>Aguardando cliente enviar comprovante</span>
						</div>
					</div>

					<!-- Comprovante enviado, aguardando validação -->
					<div v-else-if="!pedido.comprovante_validado" class="pl-6 space-y-3">
						<div class="flex items-center gap-2 text-xs">
							<Icon name="lucide:alert-circle" class="w-4 h-4 text-[var(--warning)]" />
							<span class="font-medium text-[var(--warning)]"
								>Comprovante recebido - Validação pendente</span
							>
						</div>

						<!-- Botões de ação -->
						<div class="flex items-center gap-2">
							<UiButton color="primary" variant="outline" size="sm" @click="abrirComprovante">
								<template #iconLeft>
									<Icon name="lucide:eye" />
								</template>
								Ver Comprovante
							</UiButton>
						</div>

						<div class="flex items-center gap-2">
							<UiButton
								color="success"
								variant="solid"
								size="sm"
								class="flex-1"
								@click="validarComprovante"
							>
								<template #iconLeft>
									<Icon name="lucide:check" />
								</template>
								Confirmar
							</UiButton>
							<UiButton
								color="error"
								variant="outline"
								size="sm"
								class="flex-1"
								@click="mostrarModalRejeitarComprovante = true"
							>
								<template #iconLeft>
									<Icon name="lucide:x" />
								</template>
								Rejeitar
							</UiButton>
						</div>
					</div>

					<!-- Comprovante validado -->
					<div v-else class="pl-6 space-y-2">
						<div class="flex items-center gap-2 text-xs">
							<Icon name="lucide:check-circle" class="w-4 h-4 text-[var(--success)]" />
							<span class="font-medium text-[var(--success)]">Pagamento PIX confirmado</span>
						</div>
						<p v-if="pedido.comprovante_validado_em" class="text-xs text-[var(--text-muted)]">
							Validado em {{ formatarDataHora(pedido.comprovante_validado_em) }}
						</p>
						<UiButton color="neutral" variant="ghost" size="sm" @click="abrirComprovante">
							<template #iconLeft>
								<Icon name="lucide:eye" />
							</template>
							Ver comprovante
						</UiButton>
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

	<!-- Modal de Visualização de Comprovante -->
	<UiModal v-model="mostrarModalComprovante" title="Comprovante PIX" size="md">
		<div v-if="pedido" class="space-y-4">
			<!-- Imagem -->
			<img
				v-if="pedido.comprovante_pix_tipo?.startsWith('image')"
				:src="pedido.comprovante_pix || ''"
				alt="Comprovante PIX"
				class="w-full h-auto max-h-96 object-contain rounded-lg border border-[var(--border-muted)]"
			/>

			<!-- PDF -->
			<embed
				v-else
				:src="pedido.comprovante_pix || ''"
				type="application/pdf"
				class="w-full h-96 rounded-lg border border-[var(--border-muted)]"
			/>
		</div>

		<template #footer>
			<div class="flex items-center gap-3">
				<UiButton variant="outline" color="neutral" size="md" @click="baixarComprovante">
					<template #iconLeft>
						<Icon name="lucide:download" />
					</template>
					Baixar
				</UiButton>
				<UiButton
					variant="ghost"
					color="neutral"
					size="md"
					@click="mostrarModalComprovante = false"
				>
					Fechar
				</UiButton>
			</div>
		</template>
	</UiModal>

	<!-- Modal de Rejeição de Comprovante -->
	<UiModal v-model="mostrarModalRejeitarComprovante" title="Rejeitar Comprovante" size="sm">
		<div class="space-y-4">
			<p class="text-sm text-[var(--text-muted)]">
				O comprovante será rejeitado e o cliente poderá enviar um novo.
			</p>

			<div>
				<label class="block text-sm font-medium mb-2"> Motivo da rejeição (opcional) </label>
				<textarea
					v-model="motivoRejeicao"
					placeholder="Ex: Comprovante ilegível, valor incorreto..."
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
					@click="mostrarModalRejeitarComprovante = false"
				>
					Cancelar
				</UiButton>
				<UiButton
					variant="solid"
					color="error"
					size="md"
					class="flex-[2]"
					@click="rejeitarComprovante"
				>
					Confirmar Rejeição
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
