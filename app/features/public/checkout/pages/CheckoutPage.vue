<script setup lang="ts">
/**
 * 📌 CheckoutPage
 *
 * Página principal do checkout com wizard de 4 etapas.
 */

import { useCheckout } from "~/features/public/checkout/composables/useCheckout";
import { useCarrinhoStore } from "~/stores/carrinho";
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
 * Slug do estabelecimento
 */
const slug = computed(() => route.params.slug as string);

/**
 * Dados do estabelecimento
 */
const estabelecimento = ref<{
	id: string;
	endereco: string;
	whatsapp: string;
} | null>(null);

/**
 * Busca dados do estabelecimento
 */
const buscarEstabelecimento = async () => {
	const { data, error } = await supabase
		.from("estabelecimentos")
		.select(
			"id, endereco_rua, endereco_numero, endereco_bairro, endereco_cidade, endereco_estado, whatsapp",
		)
		.eq("slug", slug.value)
		.single();

	if (error || !data) {
		await navigateTo(`/${slug.value}`);
		return;
	}

	estabelecimento.value = {
		id: data.id,
		endereco: `${data.endereco_rua}, ${data.endereco_numero} - ${data.endereco_bairro} - ${data.endereco_cidade}/${data.endereco_estado}`,
		whatsapp: data.whatsapp || "",
	};
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

	// Buscar dados do estabelecimento
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
	if (!estabelecimento.value) {
		return;
	}

	// Salvar observações
	checkout.salvarObservacoes(observacoes);

	// Finalizar pedido
	const pedidoId = await checkout.finalizarPedido(estabelecimento.value.id, carrinho.itens);

	if (pedidoId) {
		// Limpar carrinho
		carrinho.limpar();

		// Redirecionar para página de confirmação
		await navigateTo(`/${slug.value}/pedido/${pedidoId}`);
	}
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
				<h1 class="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Finalizar Pedido</h1>
			</div>

			<!-- Conteúdo das Etapas -->
			<div v-if="estabelecimento" class="mt-8">
				<!-- Etapa 1: Dados do Cliente -->
				<CheckoutDadosCliente
					v-if="checkout.state.value.etapa_atual === 1"
					:dados-iniciais="checkout.state.value.dados.cliente"
					@submit="checkout.salvarCliente"
				/>

				<!-- Etapa 2: Tipo de Entrega -->
				<CheckoutTipoEntrega
					v-else-if="checkout.state.value.etapa_atual === 2"
					:tipo-inicial="checkout.state.value.dados.tipo_entrega"
					:endereco-inicial="checkout.state.value.dados.endereco"
					:endereco-estabelecimento="estabelecimento.endereco"
					@submit="checkout.salvarEntrega"
					@voltar="checkout.etapaAnterior"
				/>

				<!-- Etapa 3: Forma de Pagamento -->
				<CheckoutFormaPagamento
					v-else-if="checkout.state.value.etapa_atual === 3"
					:dados-iniciais="checkout.state.value.dados.pagamento"
					:whatsapp-estabelecimento="estabelecimento.whatsapp"
					@submit="checkout.salvarPagamento"
					@voltar="checkout.etapaAnterior"
				/>

				<!-- Etapa 4: Resumo -->
				<CheckoutResumo
					v-else-if="checkout.state.value.etapa_atual === 4"
					:dados="checkout.state.value.dados"
					:loading="checkout.state.value.loading"
					@confirmar="handleConfirmarPedido"
					@voltar="checkout.etapaAnterior"
					@editar-etapa="checkout.irParaEtapa"
				/>
			</div>

			<!-- Loading -->
			<div v-else class="mt-8 flex justify-center">
				<Icon name="lucide:loader-2" class="w-8 h-8 animate-spin text-primary" />
			</div>

			<!-- Erro -->
			<div
				v-if="checkout.state.value.erro"
				class="mt-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600"
			>
				<p class="text-sm font-medium">{{ checkout.state.value.erro }}</p>
			</div>
		</div>
	</div>
</template>
