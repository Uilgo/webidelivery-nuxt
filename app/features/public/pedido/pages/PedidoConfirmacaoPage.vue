<script setup lang="ts">
/**
 * 📌 PedidoConfirmacaoPage
 *
 * Página de confirmação e acompanhamento do pedido.
 */

import { usePedido } from "~/features/public/pedido/composables/usePedido";
import { useCancelarPedido } from "~/features/public/pedido/composables/useCancelarPedido";
import { useAvaliacaoPedido } from "~/composables/ui/useAvaliacaoPedido";
import {
	clientePodeCancelar,
	getAvisoCancelamento,
} from "~/features/admin/pedidos/utils/status-transitions";
import {
	MOTIVOS_CANCELAMENTO_LABELS,
	type MotivoCancelamentoCliente,
} from "~/features/admin/pedidos/types/pedidos-admin";
import PedidoStatus from "~/features/public/pedido/components/PedidoStatus.vue";
import PedidoDetalhes from "~/features/public/pedido/components/PedidoDetalhes.vue";
import AvaliacaoPedidoModal from "~/components/shared/AvaliacaoPedidoModal.vue";
import type { PedidoCompleto } from "~/features/public/pedido/types/pedido";

/**
 * Props da rota
 */
const route = useRoute();
const slug = computed(() => route.params.slug as string);
const pedidoId = computed(() => route.params.id as string);

/**
 * Composables
 */
const { buscarPedido } = usePedido();
const { cancelando, cancelar } = useCancelarPedido();
const { modalAberto, pedidoAtual, abrirModalAvaliacao, onAvaliacaoEnviada } = useAvaliacaoPedido();
const toast = useToast();

/**
 * Estado do pedido
 */
const pedido = ref<PedidoCompleto | null>(null);
const loading = ref(true);
const erro = ref(false);

/**
 * Busca dados do pedido
 */
const carregarPedido = async () => {
	loading.value = true;
	erro.value = false;

	const resultado = await buscarPedido(pedidoId.value);

	if (!resultado) {
		erro.value = true;
	} else {
		pedido.value = resultado;
	}

	loading.value = false;
};

/**
 * Carrega pedido ao montar
 */
onMounted(() => {
	carregarPedido();
});

/**
 * Atualiza pedido a cada 10 segundos (polling)
 */
const intervalId = ref<NodeJS.Timeout | null>(null);

onMounted(() => {
	intervalId.value = setInterval(() => {
		if (
			pedido.value &&
			pedido.value.status !== "concluido" &&
			pedido.value.status !== "cancelado"
		) {
			carregarPedido();
		}
	}, 10000);
});

onUnmounted(() => {
	if (intervalId.value) {
		clearInterval(intervalId.value);
	}
});

/**
 * Estado do modal de cancelamento
 */
const mostrarModalCancelar = ref(false);
const motivoCancelamento = ref<MotivoCancelamentoCliente | "">("");

/**
 * Verificar se pode cancelar
 */
const podeCancelar = computed(() => {
	if (!pedido.value) return false;
	return clientePodeCancelar(pedido.value.status);
});

/**
 * Aviso sobre cancelamento
 */
const avisoCancelamento = computed(() => {
	if (!pedido.value) return null;
	return getAvisoCancelamento(pedido.value.status);
});

/**
 * Confirmar cancelamento
 */
const confirmarCancelamento = async () => {
	if (!pedido.value) return;

	const resultado = await cancelar(pedido.value.id, motivoCancelamento.value || undefined);

	if (resultado.success) {
		toast.add({
			title: "Pedido cancelado",
			description: "Seu pedido foi cancelado com sucesso",
			color: "success",
		});

		// Atualizar pedido
		await carregarPedido();

		// Fechar modal
		mostrarModalCancelar.value = false;
		motivoCancelamento.value = "";
	} else {
		toast.add({
			title: "Não foi possível cancelar",
			description: resultado.error || "Seu pedido já está sendo preparado",
			color: "error",
		});
	}
};

/**
 * Abrir modal de avaliação
 */
const avaliarPedido = () => {
	if (!pedido.value) return;

	abrirModalAvaliacao({
		id: pedido.value.id,
		numero: pedido.value.numero,
	});
};

/**
 * Callback quando avaliação é enviada
 */
const handleAvaliacaoEnviada = () => {
	toast.add({
		title: "Avaliação enviada!",
		description: "Obrigado pelo seu feedback",
		color: "success",
	});

	onAvaliacaoEnviada();
};
</script>

<template>
	<div class="min-h-screen bg-[var(--bg-base)] py-8">
		<div class="container mx-auto px-4 max-w-3xl">
			<!-- Header -->
			<div class="mb-8">
				<button
					type="button"
					@click="navigateTo(`/${slug}`)"
					class="flex items-center gap-2 text-[var(--text-muted)] hover:text-primary transition-colors mb-4"
				>
					<Icon name="lucide:arrow-left" class="w-5 h-5" />
					<span class="text-sm">Voltar ao cardápio</span>
				</button>
				<h1 class="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Acompanhar Pedido</h1>
			</div>

			<!-- Loading -->
			<div v-if="loading && !pedido" class="flex justify-center py-12">
				<Icon name="lucide:loader-2" class="w-8 h-8 animate-spin text-primary" />
			</div>

			<!-- Erro -->
			<div
				v-else-if="erro"
				class="p-6 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600"
			>
				<div class="flex items-start gap-3">
					<Icon name="lucide:alert-circle" class="w-6 h-6 flex-shrink-0" />
					<div>
						<h3 class="font-bold mb-1">Pedido não encontrado</h3>
						<p class="text-sm">
							Não foi possível encontrar este pedido. Verifique o link ou entre em contato com o
							estabelecimento.
						</p>
					</div>
				</div>
			</div>

			<!-- Conteúdo -->
			<div v-else-if="pedido" class="space-y-6">
				<!-- Mensagem de Sucesso -->
				<div
					class="p-6 rounded-lg bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400"
				>
					<div class="flex items-start gap-3">
						<Icon name="lucide:check-circle-2" class="w-6 h-6 flex-shrink-0" />
						<div>
							<h3 class="font-bold mb-1">Pedido realizado com sucesso!</h3>
							<p class="text-sm">
								Seu pedido <strong>#{{ pedido.numero }}</strong> foi recebido e está sendo
								processado.
							</p>
						</div>
					</div>
				</div>

				<!-- Status do Pedido -->
				<PedidoStatus :status="pedido.status" />

				<!-- Alerta PIX -->
				<div
					v-if="pedido.forma_pagamento === 'pix' && pedido.status === 'pendente'"
					class="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400"
				>
					<div class="flex items-start gap-3">
						<Icon name="lucide:info" class="w-5 h-5 flex-shrink-0" />
						<div class="text-sm">
							<p class="font-medium mb-1">Atenção: Pagamento via PIX</p>
							<p>
								Para confirmar seu pedido, envie o comprovante do PIX para o WhatsApp do
								estabelecimento. Seu pedido só será processado após a confirmação do pagamento.
							</p>
						</div>
					</div>
				</div>

				<!-- Detalhes do Pedido -->
				<PedidoDetalhes :pedido="pedido" />

				<!-- Aviso sobre Cancelamento -->
				<div
					v-if="avisoCancelamento"
					class="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20"
				>
					<div class="flex items-start gap-3">
						<Icon name="lucide:info" class="w-5 h-5 flex-shrink-0 text-blue-600" />
						<p class="text-sm text-blue-700 dark:text-blue-400">{{ avisoCancelamento }}</p>
					</div>
				</div>

				<!-- Aviso quando NÃO pode cancelar -->
				<div
					v-if="!podeCancelar && pedido.status !== 'concluido' && pedido.status !== 'cancelado'"
					class="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20"
				>
					<div class="flex items-start gap-3">
						<Icon name="lucide:alert-triangle" class="w-5 h-5 flex-shrink-0 text-orange-600" />
						<div class="text-sm text-orange-700 dark:text-orange-400">
							<p class="font-medium mb-1">Não é possível cancelar</p>
							<p>
								Seu pedido já está sendo preparado e não pode mais ser cancelado. Em caso de
								dúvidas, entre em contato pelo WhatsApp.
							</p>
						</div>
					</div>
				</div>

				<!-- Botão de Cancelar -->
				<div v-if="podeCancelar" class="flex justify-center">
					<UiButton
						color="error"
						variant="outline"
						size="md"
						:loading="cancelando"
						@click="mostrarModalCancelar = true"
					>
						<Icon name="lucide:x-circle" class="w-4 h-4" />
						Cancelar Pedido
					</UiButton>
				</div>

				<!-- Botão de Avaliar (quando concluído) -->
				<div
					v-if="pedido.status === 'concluido'"
					class="p-6 rounded-lg bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20"
				>
					<div class="text-center space-y-4">
						<div>
							<Icon name="lucide:star" class="w-12 h-12 mx-auto text-yellow-500 mb-2" />
							<h3 class="font-bold text-lg text-[var(--text-primary)] mb-1">Pedido Concluído!</h3>
							<p class="text-sm text-[var(--text-muted)]">
								Como foi sua experiência? Sua opinião é muito importante para nós!
							</p>
						</div>
						<UiButton color="warning" variant="solid" size="lg" @click="avaliarPedido">
							<Icon name="lucide:star" class="w-5 h-5" />
							Avaliar Pedido
						</UiButton>
					</div>
				</div>

				<!-- Botão WhatsApp -->
				<div class="flex gap-4">
					<button
						type="button"
						@click="navigateTo(`/${slug}`)"
						class="flex-1 py-3 px-6 rounded-lg font-bold text-[var(--text-primary)] bg-[var(--bg-muted)] hover:bg-[var(--bg-muted)]/80 transition-colors"
					>
						Voltar ao Cardápio
					</button>
					<button
						type="button"
						@click="
							navigateTo(`https://wa.me/${pedido.cliente_telefone.replace(/\D/g, '')}`, {
								external: true,
								open: { target: '_blank' },
							})
						"
						class="flex-1 py-3 px-6 rounded-lg font-bold text-white bg-green-600 hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
					>
						<Icon name="lucide:message-circle" class="w-5 h-5" />
						<span>Falar no WhatsApp</span>
					</button>
				</div>

				<!-- Atualização Automática -->
				<p class="text-xs text-center text-[var(--text-muted)]">
					Esta página atualiza automaticamente a cada 10 segundos
				</p>
			</div>
		</div>
	</div>

	<!-- Modal de Cancelamento -->
	<UiModal v-model="mostrarModalCancelar" title="Cancelar Pedido" size="sm">
		<div class="space-y-4">
			<!-- Aviso -->
			<div class="bg-[var(--warning-surface)] p-4 rounded-lg">
				<div class="flex gap-3">
					<Icon name="lucide:alert-triangle" class="w-5 h-5 text-[var(--warning)] flex-shrink-0" />
					<div class="text-sm">
						<p class="font-medium text-[var(--warning)] mb-1">Tem certeza que deseja cancelar?</p>
						<p class="text-[var(--text-muted)]">
							Esta ação não pode ser desfeita. Você precisará fazer um novo pedido.
						</p>
					</div>
				</div>
			</div>

			<!-- Motivo (opcional) -->
			<div>
				<label class="block text-sm font-medium mb-2"> Motivo do cancelamento (opcional) </label>
				<select
					v-model="motivoCancelamento"
					class="w-full px-3 py-2 text-sm bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg focus:outline-none focus:border-[var(--input-border-focus)] focus:ring-2 focus:ring-[var(--input-border-focus)] focus:ring-opacity-20"
				>
					<option value="">Selecione um motivo</option>
					<option v-for="(label, key) in MOTIVOS_CANCELAMENTO_LABELS" :key="key" :value="key">
						{{ label }}
					</option>
				</select>
			</div>
		</div>

		<template #footer>
			<div class="flex gap-2">
				<UiButton
					color="neutral"
					variant="ghost"
					size="md"
					class="flex-1"
					@click="mostrarModalCancelar = false"
				>
					Voltar
				</UiButton>
				<UiButton
					color="error"
					variant="solid"
					size="md"
					class="flex-[2]"
					:loading="cancelando"
					@click="confirmarCancelamento"
				>
					Sim, Cancelar Pedido
				</UiButton>
			</div>
		</template>
	</UiModal>

	<!-- Modal de Avaliação -->
	<AvaliacaoPedidoModal
		v-if="pedidoAtual"
		v-model="modalAberto"
		:pedido-id="pedidoAtual.id"
		:pedido-numero="pedidoAtual.numero"
		@avaliado="handleAvaliacaoEnviada"
	/>
</template>
