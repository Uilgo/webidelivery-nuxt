<script setup lang="ts">
/**
 * 📌 CheckoutResumo
 *
 * Resumo final do pedido antes de confirmar (Etapa 4).
 */

import type { CheckoutData } from "~/features/public/checkout/types/checkout";
import { useCarrinhoStore } from "~/stores/carrinho";
import { formatCEP } from "~/lib/formatters/address";

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
 * Observações do pedido
 */
const observacoes = ref<string>("");

/**
 * Calcula o total do pedido
 */
const calcularTotal = computed(() => {
	const subtotal = carrinho.subtotal;
	const taxaEntrega = 0; // TODO: Implementar cálculo de taxa de entrega
	const desconto = carrinho.desconto;

	return subtotal + taxaEntrega - desconto;
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
		<div>
			<h3 class="text-lg font-bold text-[var(--text-primary)] mb-2">📝 Resumo do Pedido</h3>
			<p class="text-sm text-[var(--text-muted)]">
				Revise as informações antes de confirmar seu pedido.
			</p>
		</div>

		<!-- Dados do Cliente -->
		<div class="p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)]">
			<div class="flex items-center justify-between mb-3">
				<h4 class="font-bold text-[var(--text-primary)] flex items-center gap-2">
					<Icon name="lucide:user" class="w-4 h-4" />
					Seus Dados
				</h4>
				<button
					type="button"
					@click="emit('editarEtapa', 1)"
					class="text-sm text-primary hover:underline"
				>
					Editar
				</button>
			</div>
			<div class="space-y-1 text-sm text-[var(--text-muted)]">
				<p><strong>Nome:</strong> {{ dados.cliente?.nome || "Não informado" }}</p>
				<p><strong>Telefone:</strong> {{ dados.cliente?.telefone || "Não informado" }}</p>
				<p v-if="dados.cliente?.email"><strong>E-mail:</strong> {{ dados.cliente.email }}</p>
				<p v-if="dados.cliente?.cpf"><strong>CPF:</strong> {{ dados.cliente.cpf }}</p>
			</div>
		</div>

		<!-- Tipo de Entrega -->
		<div class="p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)]">
			<div class="flex items-center justify-between mb-3">
				<h4 class="font-bold text-[var(--text-primary)] flex items-center gap-2">
					<Icon name="lucide:truck" class="w-4 h-4" />
					Entrega
				</h4>
				<button
					type="button"
					@click="emit('editarEtapa', 2)"
					class="text-sm text-primary hover:underline"
				>
					Editar
				</button>
			</div>
			<div class="space-y-1 text-sm text-[var(--text-muted)]">
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
		<div class="p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)]">
			<div class="flex items-center justify-between mb-3">
				<h4 class="font-bold text-[var(--text-primary)] flex items-center gap-2">
					<Icon name="lucide:credit-card" class="w-4 h-4" />
					Pagamento
				</h4>
				<button
					type="button"
					@click="emit('editarEtapa', 3)"
					class="text-sm text-primary hover:underline"
				>
					Editar
				</button>
			</div>
			<div class="space-y-1 text-sm text-[var(--text-muted)]">
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
			class="p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)]"
		>
			<h4 class="font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
				<Icon name="lucide:shopping-bag" class="w-4 h-4" />
				Itens do Pedido ({{ carrinho.quantidadeTotal }})
			</h4>
			<div class="space-y-3">
				<div v-for="item in carrinho.itens" :key="item.id" class="flex justify-between text-sm">
					<div class="flex-1">
						<p class="font-medium text-[var(--text-primary)]">
							{{ item.quantidade }}x {{ item.produto.nome }}
						</p>
						<p v-if="item.variacao" class="text-xs text-[var(--text-muted)]">
							{{ item.variacao.nome }}
						</p>
						<p v-if="item.adicionais.length" class="text-xs text-[var(--text-muted)]">
							+ {{ item.adicionais.map((a) => a.nome).join(", ") }}
						</p>
						<p v-if="item.observacoes" class="text-xs text-[var(--text-muted)] italic">
							Obs: {{ item.observacoes }}
						</p>
					</div>
					<p class="font-bold text-[var(--text-primary)]">R$ {{ item.preco_total.toFixed(2) }}</p>
				</div>
			</div>
		</div>

		<!-- Totais -->
		<div
			v-if="montado"
			class="p-4 rounded-lg bg-[var(--bg-muted)] border border-[var(--border-color)]"
		>
			<div class="space-y-2 text-sm">
				<div class="flex justify-between">
					<span class="text-[var(--text-muted)]">Subtotal</span>
					<span class="font-medium text-[var(--text-primary)]">
						R$ {{ carrinho.subtotal.toFixed(2) }}
					</span>
				</div>
				<div class="flex justify-between">
					<span class="text-[var(--text-muted)]">Taxa de entrega</span>
					<span class="font-medium text-[var(--text-primary)]">
						R$ 0,00
						<span class="text-xs text-yellow-600">(a implementar)</span>
					</span>
				</div>
				<div v-if="carrinho.desconto > 0" class="flex justify-between text-green-600">
					<span>Desconto</span>
					<span class="font-medium">- R$ {{ carrinho.desconto.toFixed(2) }}</span>
				</div>
				<div class="pt-2 border-t border-[var(--border-color)] flex justify-between">
					<span class="font-bold text-[var(--text-primary)]">Total</span>
					<span class="font-bold text-lg text-primary"> R$ {{ calcularTotal.toFixed(2) }} </span>
				</div>
			</div>
		</div>

		<!-- Observações -->
		<div>
			<label for="observacoes" class="block text-sm font-medium text-[var(--text-primary)] mb-2">
				Observações <span class="text-xs text-[var(--text-muted)]">(opcional)</span>
			</label>
			<textarea
				id="observacoes"
				v-model="observacoes"
				rows="3"
				placeholder="Alguma observação sobre seu pedido?"
				class="w-full px-4 py-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary resize-none"
			/>
		</div>

		<!-- TODO: Placeholder para tempo estimado -->
		<div
			class="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400"
		>
			<p class="text-sm font-medium">⏱️ Tempo estimado: A calcular (implementar no painel admin)</p>
		</div>

		<!-- Botões -->
		<div class="flex gap-4">
			<button
				type="button"
				@click="emit('voltar')"
				:disabled="loading"
				class="flex-1 py-3 px-6 rounded-lg font-bold text-[var(--text-primary)] bg-[var(--bg-muted)] hover:bg-[var(--bg-muted)]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				Voltar
			</button>
			<button
				type="button"
				@click="handleConfirmar"
				:disabled="loading"
				class="flex-1 py-3 px-6 rounded-lg font-bold text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
			>
				<Icon v-if="loading" name="lucide:loader-2" class="w-5 h-5 animate-spin" />
				<span>{{ loading ? "Confirmando..." : "Confirmar Pedido" }}</span>
			</button>
		</div>
	</div>
</template>
