<script setup lang="ts">
/**
 * 📌 CheckoutFormaPagamento
 *
 * Formulário de forma de pagamento (Etapa 3).
 */

import type { FormaPagamento, DadosPagamento } from "~/features/public/checkout/types/checkout";

interface Props {
	dadosIniciais?: DadosPagamento;
	whatsappEstabelecimento?: string;
}

const props = defineProps<Props>();

interface Emits {
	submit: [dados: DadosPagamento];
	voltar: [];
}

const emit = defineEmits<Emits>();

/**
 * Forma de pagamento selecionada
 */
const formaSelecionada = ref<FormaPagamento | null>(props.dadosIniciais?.forma_pagamento || null);

/**
 * Troco para quanto (apenas para dinheiro)
 */
const trocoPara = ref<string>(props.dadosIniciais?.troco_para?.toString() || "");

/**
 * Opções de pagamento
 */
const opcoesPagamento = [
	{
		valor: "dinheiro" as FormaPagamento,
		titulo: "Dinheiro",
		icone: "lucide:banknote",
		descricao: "Pagar na entrega/retirada",
	},
	{
		valor: "pix" as FormaPagamento,
		titulo: "PIX",
		icone: "lucide:smartphone",
		descricao: "Enviar comprovante via WhatsApp",
	},
	{
		valor: "credito" as FormaPagamento,
		titulo: "Cartão de Crédito",
		icone: "lucide:credit-card",
		descricao: "Pagar na entrega/retirada",
	},
	{
		valor: "debito" as FormaPagamento,
		titulo: "Cartão de Débito",
		icone: "lucide:credit-card",
		descricao: "Pagar na entrega/retirada",
	},
] as const;

/**
 * Validação do formulário
 */
const formValido = computed(() => {
	if (!formaSelecionada.value) return false;

	// Se for dinheiro e informou troco, validar se é número válido
	if (formaSelecionada.value === "dinheiro" && trocoPara.value) {
		const valor = parseFloat(trocoPara.value.replace(",", "."));
		return !isNaN(valor) && valor > 0;
	}

	return true;
});

/**
 * Submete o formulário
 */
const handleSubmit = () => {
	if (!formValido.value || !formaSelecionada.value) return;

	const dados: DadosPagamento = {
		forma_pagamento: formaSelecionada.value,
	};

	// Adicionar troco se for dinheiro e tiver valor
	if (formaSelecionada.value === "dinheiro" && trocoPara.value) {
		const valor = parseFloat(trocoPara.value.replace(",", "."));
		if (!isNaN(valor) && valor > 0) {
			dados.troco_para = valor;
		}
	}

	emit("submit", dados);
};

/**
 * Formata valor monetário enquanto digita
 */
const formatarValor = (event: Event) => {
	const input = event.target as HTMLInputElement;
	let valor = input.value.replace(/\D/g, "");

	if (valor) {
		valor = (parseInt(valor) / 100).toFixed(2);
		valor = valor.replace(".", ",");
	}

	trocoPara.value = valor;
};
</script>

<template>
	<div class="space-y-6">
		<div>
			<h3 class="text-lg font-bold text-[var(--text-primary)] mb-2">💳 Como você vai pagar?</h3>
		</div>

		<form @submit.prevent="handleSubmit" class="space-y-6">
			<!-- Opções de pagamento -->
			<div class="space-y-3">
				<button
					v-for="opcao in opcoesPagamento"
					:key="opcao.valor"
					type="button"
					@click="formaSelecionada = opcao.valor"
					class="w-full p-4 rounded-lg border-2 transition-all text-left flex items-center gap-4"
					:class="{
						'border-primary bg-primary/5': formaSelecionada === opcao.valor,
						'border-[var(--border-color)] hover:border-primary/50':
							formaSelecionada !== opcao.valor,
					}"
				>
					<div
						class="size-12 rounded-full flex items-center justify-center"
						:class="{
							'bg-primary text-white': formaSelecionada === opcao.valor,
							'bg-[var(--bg-muted)] text-primary': formaSelecionada !== opcao.valor,
						}"
					>
						<Icon :name="opcao.icone" class="w-6 h-6" />
					</div>
					<div class="flex-1">
						<p class="font-bold text-[var(--text-primary)]">{{ opcao.titulo }}</p>
						<p class="text-sm text-[var(--text-muted)]">{{ opcao.descricao }}</p>
					</div>
					<Icon
						v-if="formaSelecionada === opcao.valor"
						name="lucide:check-circle"
						class="w-6 h-6 text-primary"
					/>
				</button>
			</div>

			<!-- Campo de troco (apenas para dinheiro) -->
			<div v-if="formaSelecionada === 'dinheiro'" class="space-y-2">
				<label for="troco" class="block text-sm font-medium text-[var(--text-primary)]">
					Troco para quanto? <span class="text-xs text-[var(--text-muted)]">(opcional)</span>
				</label>
				<div class="relative">
					<span class="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
						R$
					</span>
					<input
						id="troco"
						v-model="trocoPara"
						type="text"
						placeholder="0,00"
						@input="formatarValor"
						class="w-full pl-12 pr-4 py-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary"
					/>
				</div>
			</div>

			<!-- Aviso importante para PIX -->
			<div
				v-if="formaSelecionada === 'pix'"
				class="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20"
			>
				<div class="flex gap-3">
					<Icon name="lucide:alert-triangle" class="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
					<div class="space-y-2">
						<p class="text-sm font-bold text-yellow-700 dark:text-yellow-400">
							⚠️ Atenção: Pagamento via PIX
						</p>
						<p class="text-sm text-yellow-700 dark:text-yellow-400">
							Você precisará enviar o comprovante do PIX via WhatsApp para o número
							<strong>{{ whatsappEstabelecimento || "(não informado)" }}</strong>
							antes que seu pedido seja confirmado.
						</p>
					</div>
				</div>
			</div>

			<!-- Botões -->
			<div class="flex gap-4">
				<button
					type="button"
					@click="emit('voltar')"
					class="flex-1 py-3 px-6 rounded-lg font-bold text-[var(--text-primary)] bg-[var(--bg-muted)] hover:bg-[var(--bg-muted)]/80 transition-colors"
				>
					Voltar
				</button>
				<button
					type="submit"
					:disabled="!formValido"
					class="flex-1 py-3 px-6 rounded-lg font-bold text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					Continuar
				</button>
			</div>
		</form>
	</div>
</template>
