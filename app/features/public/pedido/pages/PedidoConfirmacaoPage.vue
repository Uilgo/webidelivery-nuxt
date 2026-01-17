<script setup lang="ts">
/**
 * 📌 PedidoConfirmacaoPage
 *
 * Página de confirmação e acompanhamento do pedido.
 */

import { usePedido } from "~/features/public/pedido/composables/usePedido";
import PedidoStatus from "~/features/public/pedido/components/PedidoStatus.vue";
import PedidoDetalhes from "~/features/public/pedido/components/PedidoDetalhes.vue";
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
</template>
