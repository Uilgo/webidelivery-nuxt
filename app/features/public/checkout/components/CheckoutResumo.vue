<script setup lang="ts">
/**
 * 📌 CheckoutResumo
 *
 * Resumo final do pedido antes de confirmar (Etapa 4).
 */

import type { CheckoutData } from "~/features/public/checkout/types/checkout";
import { useCarrinhoStore } from "~/stores/carrinho";
import { formatCEP } from "~/lib/formatters/cep";

interface Props {
	dados: Partial<CheckoutData>;
	loading?: boolean;
}

const props = defineProps<Props>();

interface Emits {
	confirmar: [observacoes: string];
	voltar: [];
	editarEtapa: [etapa: 1 | 2 | 3];
}

const emit = defineEmits<Emits>();

/**
 * Store do carrinho
 */
const carrinho = useCarrinhoStore();

/**
 * Estado de hidratação - evita mismatch SSR
 */
const montado = ref(false);

onMounted(() => {
	montado.value = true;
});

/**
 * Store do estabelecimento para fallbacks
 */
const estabelecimentoStore = useEstabelecimentoStore();

/**
 * Observações do pedido
 */
const observacoes = ref<string>("");

/**
 * Taxa de entrega calculada
 */
const taxaEntrega = computed(() => {
	if (props.dados.tipo_entrega === "retirada") return 0;
	return props.dados.endereco?.taxa_entrega || 0;
});

/**
 * Tempo estimado dinâmico
 */
const tempoEstimado = computed(() => {
	const tipo = props.dados.tipo_entrega;
	const config = estabelecimentoStore.estabelecimento?.config_geral;

	// Se for delivery, tenta pegar do endereço (calculado no passo anterior)
	if (tipo === "delivery" && props.dados.endereco?.tempo_min) {
		return `${props.dados.endereco.tempo_min}-${props.dados.endereco.tempo_max} min`;
	}

	// Fallback para config global
	if (tipo === "retirada") {
		const min = config?.tempo_retirada_min || 15;
		const max = config?.tempo_retirada_max || 30;
		return `${min}-${max} min`;
	}

	const min = config?.tempo_entrega_min || 30;
	const max = config?.tempo_entrega_max || 60;
	return `${min}-${max} min`;
});

/**
 * Calcula o total do pedido
 */
const calcularTotal = computed(() => {
	const subtotal = carrinho.subtotal;
	const desconto = carrinho.desconto;

	return subtotal + taxaEntrega.value - desconto;
});

/**
 * Formata forma de pagamento para exibição
 */
const formatarFormaPagamento = (forma?: string): string => {
	const mapa: Record<string, string> = {
		dinheiro: "Dinheiro",
		pix: "PIX",
		credito: "Cartão de Crédito",
		debito: "Cartão de Débito",
	};

	return forma ? mapa[forma] || forma : "Não informado";
};

/**
 * Formata tipo de entrega para exibição
 */
const formatarTipoEntrega = (tipo?: string): string => {
	const mapa: Record<string, string> = {
		delivery: "Entrega",
		retirada: "Retirada no local",
	};

	return tipo ? mapa[tipo] || tipo : "Não informado";
};

/**
 * Confirma o pedido
 */
const handleConfirmar = () => {
	emit("confirmar", observacoes.value);
};
</script>

<template>
	<div class="space-y-6">
		<!-- Dados do Cliente -->
		<div
			class="p-4 rounded-lg bg-[var(--cardapio-secondary)] border border-[var(--cardapio-border)]"
		>
			<div class="flex items-center justify-between mb-3">
				<h4 class="font-bold text-[var(--cardapio-text)] flex items-center gap-2">
					<Icon name="lucide:user" class="w-4 h-4" />
					Seus Dados
				</h4>
				<button
					type="button"
					@click="emit('editarEtapa', 1)"
					class="text-sm text-[var(--cardapio-primary)] hover:underline"
				>
					Editar
				</button>
			</div>
			<div class="space-y-1 text-sm text-[var(--cardapio-text-muted)]">
				<p><strong>Nome:</strong> {{ dados.cliente?.nome || "Não informado" }}</p>
				<p><strong>Telefone:</strong> {{ dados.cliente?.telefone || "Não informado" }}</p>
				<p v-if="dados.cliente?.email"><strong>E-mail:</strong> {{ dados.cliente.email }}</p>
				<p v-if="dados.cliente?.cpf"><strong>CPF:</strong> {{ dados.cliente.cpf }}</p>
			</div>
		</div>

		<!-- Tipo de Entrega -->
		<div
			class="p-4 rounded-lg bg-[var(--cardapio-secondary)] border border-[var(--cardapio-border)]"
		>
			<div class="flex items-center justify-between mb-3">
				<h4 class="font-bold text-[var(--cardapio-text)] flex items-center gap-2">
					<Icon name="lucide:truck" class="w-4 h-4" />
					Entrega
				</h4>
				<button
					type="button"
					@click="emit('editarEtapa', 2)"
					class="text-sm text-[var(--cardapio-primary)] hover:underline"
				>
					Editar
				</button>
			</div>
			<div class="space-y-1 text-sm text-[var(--cardapio-text-muted)]">
				<p><strong>Tipo:</strong> {{ formatarTipoEntrega(dados.tipo_entrega) }}</p>
				<div v-if="dados.tipo_entrega === 'delivery' && dados.endereco" class="mt-2">
					<p>
						{{ dados.endereco.rua }}, {{ dados.endereco.numero }}
						<span v-if="dados.endereco.complemento"> - {{ dados.endereco.complemento }} </span>
					</p>
					<p>
						{{ dados.endereco.bairro }} - {{ dados.endereco.cidade }}/{{ dados.endereco.estado }}
					</p>
					<p>CEP: {{ formatCEP(dados.endereco.cep) }}</p>
					<p v-if="dados.endereco.referencia" class="mt-1">
						<strong>Referência:</strong> {{ dados.endereco.referencia }}
					</p>
				</div>
			</div>
		</div>

		<!-- Forma de Pagamento -->
		<div
			class="p-4 rounded-lg bg-[var(--cardapio-secondary)] border border-[var(--cardapio-border)]"
		>
			<div class="flex items-center justify-between mb-3">
				<h4 class="font-bold text-[var(--cardapio-text)] flex items-center gap-2">
					<Icon name="lucide:credit-card" class="w-4 h-4" />
					Pagamento
				</h4>
				<button
					type="button"
					@click="emit('editarEtapa', 3)"
					class="text-sm text-[var(--cardapio-primary)] hover:underline"
				>
					Editar
				</button>
			</div>
			<div class="space-y-1 text-sm text-[var(--cardapio-text-muted)]">
				<p>
					<strong>Forma:</strong>
					{{ formatarFormaPagamento(dados.pagamento?.forma_pagamento) }}
				</p>
				<p v-if="dados.pagamento?.troco_para">
					<strong>Troco para:</strong> R$ {{ dados.pagamento.troco_para.toFixed(2) }}
				</p>
			</div>
		</div>

		<!-- Itens do Carrinho -->
		<div
			v-if="montado"
			class="p-4 rounded-lg bg-[var(--cardapio-secondary)] border border-[var(--cardapio-border)]"
		>
			<h4 class="font-bold text-[var(--cardapio-text)] mb-3 flex items-center gap-2">
				<Icon name="lucide:shopping-bag" class="w-4 h-4" />
				Itens do Pedido ({{ carrinho.quantidadeTotal }})
			</h4>
			<div class="space-y-3">
				<div v-for="item in carrinho.itens" :key="item.id" class="flex justify-between text-sm">
					<div class="flex-1">
						<p class="font-medium text-[var(--cardapio-text)]">
							{{ item.quantidade }}x {{ item.nome }}
						</p>
						<p v-if="item.variacao" class="text-xs text-[var(--cardapio-text-muted)]">
							{{ item.variacao.nome }}
						</p>
						<p v-if="item.adicionais.length" class="text-xs text-[var(--cardapio-text-muted)]">
							+ {{ item.adicionais.map((a) => a.nome).join(", ") }}
						</p>
						<p v-if="item.observacao" class="text-xs text-[var(--cardapio-text-muted)] italic">
							Obs: {{ item.observacao }}
						</p>
					</div>
					<p class="font-bold text-[var(--cardapio-text)]">R$ {{ item.preco_total.toFixed(2) }}</p>
				</div>
			</div>
		</div>

		<!-- Totais -->
		<div
			v-if="montado"
			class="p-4 rounded-lg bg-[var(--cardapio-muted)] border border-[var(--cardapio-border)]"
		>
			<div class="space-y-2 text-sm">
				<div class="flex justify-between">
					<span class="text-[var(--cardapio-text-muted)]">Subtotal</span>
					<span class="font-medium text-[var(--cardapio-text)]">
						R$ {{ carrinho.subtotal.toFixed(2) }}
					</span>
				</div>
				<div class="flex justify-between">
					<span class="text-[var(--cardapio-text-muted)]">Taxa de entrega</span>
					<span class="font-medium text-[var(--cardapio-text)]">
						<span v-if="taxaEntrega === 0" class="text-green-600">Grátis</span>
						<span v-else>R$ {{ taxaEntrega.toFixed(2) }}</span>
					</span>
				</div>
				<div v-if="carrinho.desconto > 0" class="flex justify-between text-green-600">
					<span>Desconto</span>
					<span class="font-medium">- R$ {{ carrinho.desconto.toFixed(2) }}</span>
				</div>
				<div class="pt-2 border-t border-[var(--cardapio-border)] flex justify-between">
					<span class="font-bold text-[var(--cardapio-text)]">Total</span>
					<span class="font-bold text-lg text-[var(--cardapio-primary)]">
						R$ {{ calcularTotal.toFixed(2) }}
					</span>
				</div>
			</div>
		</div>

		<!-- Observações -->
		<div>
			<label for="observacoes" class="block text-sm font-medium text-[var(--cardapio-text)] mb-2">
				Observações <span class="text-xs text-[var(--cardapio-text-muted)]">(opcional)</span>
			</label>
			<UiTextarea
				id="observacoes"
				v-model="observacoes"
				:rows="3"
				placeholder="Alguma observação sobre seu pedido?"
				class="resize-none"
			/>
		</div>

		<!-- Tempo estimado -->
		<div
			class="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 flex gap-3 items-center"
		>
			<div
				class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0"
			>
				<span class="text-xl">⏱️</span>
			</div>
			<div>
				<p class="text-sm font-bold text-blue-800 dark:text-blue-300">Tempo estimado</p>
				<p class="text-xs text-blue-700 dark:text-blue-400">
					{{ formatarTipoEntrega(dados.tipo_entrega) }}: {{ tempoEstimado }}
				</p>
			</div>
		</div>

		<!-- Botões -->
		<div class="flex gap-4">
			<UiButton
				type="button"
				variant="ghost"
				size="lg"
				:disabled="loading"
				class="flex-1 font-bold text-[var(--cardapio-text-muted)] border border-[var(--cardapio-border)] hover:border-[var(--cardapio-primary)] hover:text-[var(--cardapio-primary)] hover:bg-transparent"
				@click="emit('voltar')"
			>
				Voltar
			</UiButton>
			<UiButton
				type="button"
				variant="solid"
				size="lg"
				:disabled="loading"
				class="flex-1 font-bold bg-[var(--cardapio-primary)] text-white shadow-[var(--cardapio-button-shadow)] hover:shadow-[var(--cardapio-button-shadow-hover)] hover:bg-[var(--cardapio-primary)]"
				@click="handleConfirmar"
			>
				<Icon v-if="loading" name="lucide:loader-2" class="w-5 h-5 animate-spin mr-2" />
				<span>{{ loading ? "Confirmando..." : "Confirmar Pedido" }}</span>
			</UiButton>
		</div>
	</div>
</template>
