<script setup lang="ts">
/**
 * 📌 CheckoutPage
 *
 * Página principal do checkout com layout Accordion (One Page).
 */

import { useCheckout } from "~/features/public/checkout/composables/useCheckout";
import { useCarrinhoStore } from "~/stores/carrinho";
import { useEstabelecimentoStore } from "~/stores/estabelecimento";
import { useTemaPublico } from "~/features/public/cardapio/composables/useTemaPublico";
import CheckoutDadosCliente from "~/features/public/checkout/components/CheckoutDadosCliente.vue";
import CheckoutTipoEntrega from "~/features/public/checkout/components/CheckoutTipoEntrega.vue";
import CheckoutFormaPagamento from "~/features/public/checkout/components/CheckoutFormaPagamento.vue";
import CheckoutResumo from "~/features/public/checkout/components/CheckoutResumo.vue";

/**
 * Composables
 */
const checkout = useCheckout();
const carrinho = useCarrinhoStore();
const route = useRoute();
const supabase = useSupabaseClient();

/**
 * Helper para formatar pagamento
 */
const formatarPagamento = (forma?: string) => {
	const mapa: Record<string, string> = {
		dinheiro: "Dinheiro",
		pix: "PIX",
		credito: "Crédito",
		debito: "Débito",
	};
	return forma ? mapa[forma] || forma : "";
};

/**
 * Slug do estabelecimento
 */
const slug = computed(() => route.params.slug as string);

/**
 * Dados do estabelecimento (reativo para useTemaPublico)
 */
const estabelecimentoRef = ref<{
	id: string;
	endereco: string;
	whatsapp: string;
	config_tema?: unknown;
} | null>(null);

/**
 * Aplicar tema do estabelecimento usando o mesmo composable do cardápio
 */
useTemaPublico(estabelecimentoRef as Ref<any>);

/**
 * Busca dados do estabelecimento
 */
const buscarEstabelecimento = async () => {
	const { data, error } = await supabase
		.from("estabelecimentos")
		.select(
			"id, endereco_rua, endereco_numero, endereco_bairro, endereco_cidade, endereco_estado, whatsapp, config_geral, config_tema",
		)
		.eq("slug", slug.value)
		.single();

	if (error || !data) {
		await navigateTo(`/${slug.value}`);
		return;
	}

	estabelecimentoRef.value = {
		id: data.id,
		endereco: `${data.endereco_rua}, ${data.endereco_numero} - ${data.endereco_bairro} - ${data.endereco_cidade}/${data.endereco_estado}`,
		whatsapp: data.whatsapp || "",
		config_tema: data.config_tema,
	};

	// Carregar estabelecimento na store para que composables possam acessar config_geral
	const estabelecimentoStore = useEstabelecimentoStore();
	estabelecimentoStore.setEstabelecimento(data as any);
};

/**
 * Inicializa o checkout ao montar
 */
onMounted(async () => {
	// Validar se carrinho não está vazio
	if (carrinho.itens.length === 0) {
		navigateTo(`/${slug.value}`);
		return;
	}

	// Buscar dados do estabelecimento (isso vai trigger o useTemaPublico automaticamente)
	await buscarEstabelecimento();

	// Validar se estabelecimento está aberto
	// TODO: Implementar validação de horário de funcionamento

	// Carregar dados salvos
	checkout.inicializar();
});

/**
 * Handler para confirmar pedido
 */
const handleConfirmarPedido = async (observacoes: string) => {
	if (!estabelecimentoRef.value) {
		return;
	}

	// Salvar observações
	checkout.salvarObservacoes(observacoes);

	// Finalizar pedido
	const pedidoId = await checkout.finalizarPedido(estabelecimentoRef.value.id, carrinho.itens);

	if (pedidoId) {
		// Limpar carrinho
		carrinho.limpar();

		// Redirecionar para página de confirmação
		await navigateTo(`/${slug.value}/pedido/${pedidoId}`);
	}
};

/**
 * Controle de expansão do Accordion
 */
const etapasExpandidas = computed(() => {
	return {
		cliente: checkout.state.value.etapa_atual === 1,
		entrega: checkout.state.value.etapa_atual === 2,
		pagamento: checkout.state.value.etapa_atual === 3,
		resumo: checkout.state.value.etapa_atual === 4,
	};
});

/**
 * Navegação direta pelo accordion
 * (Só permite abrir etapas já alcançadas ou anteriores)
 */
const toggleEtapa = (etapa: 1 | 2 | 3 | 4) => {
	// Se a etapa desejada for menor que a atual, volta para ela
	// Se for maior, não permite (tem que passar pela validação)
	if (etapa < checkout.state.value.etapa_atual) {
		checkout.irParaEtapa(etapa);
	}
};
</script>

<template>
	<div class="min-h-screen bg-[var(--cardapio-background)] py-8 pb-32">
		<div class="container mx-auto px-4 max-w-2xl">
			<!-- Header -->
			<div class="mb-8 text-center">
				<button
					type="button"
					@click="navigateTo(`/${slug}`)"
					class="inline-flex items-center gap-2 text-[var(--cardapio-text-muted)] hover:text-[var(--cardapio-primary)] transition-colors mb-6 text-sm font-medium"
				>
					<Icon name="lucide:arrow-left" class="w-4 h-4" />
					Voltar ao cardápio
				</button>
				<h1 class="text-3xl font-bold text-[var(--cardapio-text)] mb-2">Finalizar Pedido</h1>
				<p class="text-[var(--cardapio-text-muted)]">Complete seus dados para receber seu pedido</p>
			</div>

			<!-- Conteúdo das Etapas -->
			<div v-if="estabelecimentoRef" class="space-y-4">
				<!-- Etapa 1: Dados do Cliente -->
				<div
					class="bg-[var(--cardapio-secondary)] rounded-2xl border border-[var(--cardapio-border)] overflow-hidden transition-all duration-300"
					:class="{
						'ring-2 ring-[var(--cardapio-primary)] border-[var(--cardapio-primary)]':
							etapasExpandidas.cliente,
					}"
				>
					<button
						type="button"
						@click="toggleEtapa(1)"
						class="w-full flex items-center justify-between p-6 text-left"
						:class="{ 'cursor-default': etapasExpandidas.cliente }"
					>
						<div class="flex items-center gap-4">
							<div
								class="flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg transition-colors"
								:class="
									checkout.state.value.etapa_atual > 1 || etapasExpandidas.cliente
										? 'bg-[var(--cardapio-primary)] text-white'
										: 'bg-[var(--cardapio-muted)] text-[var(--cardapio-text-muted)]'
								"
							>
								1
							</div>
							<div>
								<h3 class="font-bold text-lg text-[var(--cardapio-text)]">Seus Dados</h3>
								<p
									v-if="!etapasExpandidas.cliente && checkout.state.value.dados.cliente?.nome"
									class="text-sm text-[var(--cardapio-text-muted)] text-ellipsis overflow-hidden whitespace-nowrap max-w-[200px] sm:max-w-xs"
								>
									{{ checkout.state.value.dados.cliente?.nome }} •
									{{ checkout.state.value.dados.cliente?.telefone }}
								</p>
							</div>
						</div>
						<div
							v-if="!etapasExpandidas.cliente && checkout.state.value.etapa_atual > 1"
							class="text-[var(--cardapio-primary)] font-medium text-sm"
						>
							Editar
						</div>
					</button>

					<div
						v-show="etapasExpandidas.cliente"
						class="px-6 pb-6 border-t border-[var(--cardapio-border)] pt-6"
					>
						<CheckoutDadosCliente
							:dados-iniciais="checkout.state.value.dados.cliente"
							@submit="checkout.salvarCliente"
						/>
					</div>
				</div>

				<!-- Etapa 2: Tipo de Entrega -->
				<div
					class="bg-[var(--cardapio-secondary)] rounded-2xl border border-[var(--cardapio-border)] overflow-hidden transition-all duration-300"
					:class="{
						'ring-2 ring-[var(--cardapio-primary)] border-[var(--cardapio-primary)]':
							etapasExpandidas.entrega,
					}"
				>
					<button
						type="button"
						@click="toggleEtapa(2)"
						class="w-full flex items-center justify-between p-6 text-left"
						:disabled="checkout.state.value.etapa_atual < 2"
						:class="{
							'cursor-default': etapasExpandidas.entrega,
							'opacity-50': checkout.state.value.etapa_atual < 2,
						}"
					>
						<div class="flex items-center gap-4">
							<div
								class="flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg transition-colors"
								:class="
									checkout.state.value.etapa_atual > 2 || etapasExpandidas.entrega
										? 'bg-[var(--cardapio-primary)] text-white'
										: 'bg-[var(--cardapio-muted)] text-[var(--cardapio-text-muted)]'
								"
							>
								2
							</div>
							<div>
								<h3 class="font-bold text-lg text-[var(--cardapio-text)]">Entrega</h3>
								<div
									v-if="!etapasExpandidas.entrega && checkout.state.value.etapa_atual > 2"
									class="text-sm text-[var(--cardapio-text-muted)] mt-1"
								>
									<p v-if="checkout.state.value.dados.tipo_entrega === 'delivery'" class="truncate">
										Delivery • {{ checkout.state.value.dados.endereco?.rua }},
										{{ checkout.state.value.dados.endereco?.numero }}
									</p>
									<p v-else>Retirada no Local</p>
								</div>
							</div>
						</div>
						<div
							v-if="!etapasExpandidas.entrega && checkout.state.value.etapa_atual > 2"
							class="text-[var(--cardapio-primary)] font-medium text-sm"
						>
							Editar
						</div>
					</button>

					<div
						v-show="etapasExpandidas.entrega"
						class="px-6 pb-6 border-t border-[var(--cardapio-border)] pt-6"
					>
						<CheckoutTipoEntrega
							:tipo-inicial="checkout.state.value.dados.tipo_entrega"
							:endereco-inicial="checkout.state.value.dados.endereco"
							:endereco-estabelecimento="estabelecimentoRef.endereco"
							:slug="slug"
							@submit="checkout.salvarEntrega"
							@voltar="checkout.etapaAnterior"
						/>
					</div>
				</div>

				<!-- Etapa 3: Forma de Pagamento -->
				<div
					class="bg-[var(--cardapio-secondary)] rounded-2xl border border-[var(--cardapio-border)] overflow-hidden transition-all duration-300"
					:class="{
						'ring-2 ring-[var(--cardapio-primary)] border-[var(--cardapio-primary)]':
							etapasExpandidas.pagamento,
					}"
				>
					<button
						type="button"
						@click="toggleEtapa(3)"
						class="w-full flex items-center justify-between p-6 text-left"
						:disabled="checkout.state.value.etapa_atual < 3"
						:class="{
							'cursor-default': etapasExpandidas.pagamento,
							'opacity-50': checkout.state.value.etapa_atual < 3,
						}"
					>
						<div class="flex items-center gap-4">
							<div
								class="flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg transition-colors"
								:class="
									checkout.state.value.etapa_atual > 3 || etapasExpandidas.pagamento
										? 'bg-[var(--cardapio-primary)] text-white'
										: 'bg-[var(--cardapio-muted)] text-[var(--cardapio-text-muted)]'
								"
							>
								3
							</div>
							<div>
								<h3 class="font-bold text-lg text-[var(--cardapio-text)]">Pagamento</h3>
								<p
									v-if="!etapasExpandidas.pagamento && checkout.state.value.etapa_atual > 3"
									class="text-sm text-[var(--cardapio-text-muted)]"
								>
									{{ formatarPagamento(checkout.state.value.dados.pagamento?.forma_pagamento) }}
								</p>
							</div>
						</div>
						<div
							v-if="!etapasExpandidas.pagamento && checkout.state.value.etapa_atual > 3"
							class="text-[var(--cardapio-primary)] font-medium text-sm"
						>
							Editar
						</div>
					</button>

					<div
						v-show="etapasExpandidas.pagamento"
						class="px-6 pb-6 border-t border-[var(--cardapio-border)] pt-6"
					>
						<CheckoutFormaPagamento
							:dados-iniciais="checkout.state.value.dados.pagamento"
							:whatsapp-estabelecimento="estabelecimentoRef.whatsapp"
							:valor-total="
								carrinho.total + (checkout.state.value.dados.endereco?.taxa_entrega || 0)
							"
							@submit="checkout.salvarPagamento"
							@voltar="checkout.etapaAnterior"
						/>
					</div>
				</div>

				<!-- Etapa 4: Resumo e Confirmação (Card Final) -->
				<transition
					enter-active-class="transition duration-500 ease-out"
					enter-from-class="transform translate-y-10 opacity-0"
					enter-to-class="transform translate-y-0 opacity-100"
				>
					<div
						v-if="etapasExpandidas.resumo"
						class="bg-[var(--cardapio-secondary)] rounded-2xl border border-[var(--cardapio-border)] overflow-hidden shadow-lg mt-8"
					>
						<div class="p-6 border-b border-[var(--cardapio-border)] bg-[var(--cardapio-muted)]/30">
							<h3 class="font-bold text-xl text-[var(--cardapio-text)] flex items-center gap-2">
								<Icon name="lucide:receipt" class="w-6 h-6 text-[var(--cardapio-primary)]" />
								Confirmação do Pedido
							</h3>
						</div>
						<div class="p-6">
							<CheckoutResumo
								:dados="checkout.state.value.dados"
								:loading="checkout.state.value.loading"
								@confirmar="handleConfirmarPedido"
								@voltar="checkout.etapaAnterior"
								@editar-etapa="checkout.irParaEtapa"
							/>
						</div>
					</div>
				</transition>
			</div>

			<!-- Loading -->
			<div v-else class="mt-8 flex justify-center">
				<Icon name="lucide:loader-2" class="w-8 h-8 animate-spin text-[var(--cardapio-primary)]" />
			</div>

			<!-- Erro -->
			<div
				v-if="checkout.state.value.erro"
				class="mt-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 animate-pulse"
			>
				<p class="text-sm font-medium">{{ checkout.state.value.erro }}</p>
			</div>
		</div>
	</div>
</template>
