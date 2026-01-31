<script setup lang="ts">
/**
 * 📌 CheckoutFormaPagamento
 *
 * Formulário de forma de pagamento (Etapa 3).
 */

import type { FormaPagamento, DadosPagamento } from "~/features/public/checkout/types/checkout";
import { parseCurrency } from "~/lib/formatters/currency";

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
		const valor = parseCurrency(trocoPara.value);
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
		const valor = parseCurrency(trocoPara.value);
		if (!isNaN(valor) && valor > 0) {
			dados.troco_para = valor;
		}
	}

	emit("submit", dados);
};

/**
 * Formata valor monetário enquanto digita
 */
// Função removida - agora usando CurrencyInput
</script>

<template>
	<div class="space-y-6">
		<form @submit.prevent="handleSubmit" class="space-y-6">
			<!-- Opções de pagamento -->
			<div class="space-y-3">
				<button
					v-for="opcao in opcoesPagamento"
					:key="opcao.valor"
					type="button"
					@click="formaSelecionada = opcao.valor"
					class="group w-full p-4 rounded-xl border-2 transition-all duration-200 text-left flex items-center gap-4"
					:class="{
						'border-[var(--cardapio-primary)] bg-[var(--cardapio-primary)]/5 shadow-md shadow-[var(--cardapio-primary)]/5':
							formaSelecionada === opcao.valor,
						'border-[var(--cardapio-border)] hover:border-[var(--cardapio-primary)]/50 hover:bg-[var(--cardapio-muted)]':
							formaSelecionada !== opcao.valor,
					}"
				>
					<div
						class="size-12 rounded-full flex items-center justify-center transition-colors"
						:class="{
							'bg-[var(--cardapio-primary)] text-white': formaSelecionada === opcao.valor,
							'bg-[var(--cardapio-muted)] text-[var(--cardapio-text-muted)] group-hover:text-[var(--cardapio-primary)]':
								formaSelecionada !== opcao.valor,
						}"
					>
						<Icon :name="opcao.icone" class="w-6 h-6" />
					</div>
					<div class="flex-1">
						<p class="font-bold text-[var(--cardapio-text)] mb-0.5">{{ opcao.titulo }}</p>
						<p class="text-sm text-[var(--cardapio-text-muted)]">{{ opcao.descricao }}</p>
					</div>
					<div
						class="relative flex items-center justify-center w-6 h-6 rounded-full border-2 transition-colors"
						:class="
							formaSelecionada === opcao.valor
								? 'border-[var(--cardapio-primary)] bg-[var(--cardapio-primary)]'
								: 'border-[var(--cardapio-border)]'
						"
					>
						<Icon
							v-if="formaSelecionada === opcao.valor"
							name="lucide:check"
							class="w-4 h-4 text-white"
						/>
					</div>
				</button>
			</div>

			<!-- Campo de troco (apenas para dinheiro) -->
			<div v-if="formaSelecionada === 'dinheiro'" class="space-y-2">
				<label for="troco" class="block text-sm font-medium text-[var(--cardapio-text)]">
					Troco para quanto?
					<span class="text-xs text-[var(--cardapio-text-muted)]">(opcional)</span>
				</label>
				<UiCurrencyInput
					id="troco"
					:model-value="trocoPara ? parseCurrency(trocoPara) : 0"
					placeholder="0,00"
					@update:model-value="(v) => (trocoPara = v > 0 ? v.toString() : '')"
				/>
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
				<UiButton
					type="button"
					variant="ghost"
					size="lg"
					class="flex-1 font-bold text-[var(--cardapio-text-muted)] border border-[var(--cardapio-border)] hover:border-[var(--cardapio-primary)] hover:text-[var(--cardapio-primary)] hover:bg-transparent"
					@click="emit('voltar')"
				>
					Voltar
				</UiButton>
				<UiButton
					type="submit"
					:disabled="!formValido"
					variant="solid"
					size="lg"
					class="flex-1 font-bold bg-[var(--cardapio-primary)] text-white shadow-[var(--cardapio-button-shadow)] hover:shadow-[var(--cardapio-button-shadow-hover)] hover:bg-[var(--cardapio-primary)]"
				>
					Continuar
					<Icon name="lucide:arrow-right" class="w-5 h-5 ml-2" />
				</UiButton>
			</div>
		</form>
	</div>
</template>
