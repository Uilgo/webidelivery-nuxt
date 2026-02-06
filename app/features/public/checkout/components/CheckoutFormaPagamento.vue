<script setup lang="ts">
/**
 * 📌 CheckoutFormaPagamento
 *
 * Formulário de forma de pagamento (Etapa 3).
 */

import type { FormaPagamento, DadosPagamento } from "~/features/public/checkout/types/checkout";
import { parseCurrency, formatCurrency } from "~/lib/formatters/currency";

interface Props {
	dadosIniciais?: DadosPagamento;
	whatsappEstabelecimento?: string;
	valorTotal: number; // Valor total do pedido (produtos + taxa de entrega)
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
 * armazena o valor numérico diretamente
 */
const trocoPara = ref<number | undefined>(props.dadosIniciais?.troco_para || undefined);

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
 * Validação do troco
 */
const trocoValido = computed(() => {
	if (!trocoPara.value) return true; // Troco é opcional

	return trocoPara.value >= props.valorTotal;
});

/**
 * Mensagem de erro do troco
 */
const trocoErro = computed(() => {
	if (!trocoPara.value) return "";

	if (trocoPara.value <= 0) return "Valor inválido";
	if (trocoPara.value < props.valorTotal) {
		return `O valor deve ser maior ou igual a ${formatCurrency(props.valorTotal)}`;
	}
	return "";
});

/**
 * Valor do troco a ser devolvido
 */
const valorTroco = computed(() => {
	if (!trocoPara.value || trocoPara.value <= props.valorTotal) return 0;
	return trocoPara.value - props.valorTotal;
});

/**
 * Validação do formulário
 */
const formValido = computed(() => {
	if (!formaSelecionada.value) return false;

	// Se for dinheiro e informou troco, validar se é válido
	if (formaSelecionada.value === "dinheiro" && trocoPara.value) {
		return trocoValido.value;
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
		if (trocoPara.value > 0) {
			dados.troco_para = trocoPara.value;
		}
	}

	emit("submit", dados);
};

/**
 * Estado de feedback da cópia do PIX
 */
// Lógica de cópia movida para página de acompanhamento

/**
 * Formata valor monetário enquanto digita
 */
// Função removida - agora usando CurrencyInput
</script>

<template>
	<div class="space-y-6">
		<form @submit.prevent="handleSubmit" class="space-y-6">
			<!-- Texto informativo -->
			<p class="text-sm text-[var(--cardapio-text-muted)]">
				💳 Escolha como deseja pagar seu pedido
			</p>

			<!-- Opções de pagamento -->
			<div class="space-y-3">
				<div
					v-for="opcao in opcoesPagamento"
					:key="opcao.valor"
					class="rounded-xl border-2 transition-all duration-200 overflow-hidden"
					:class="{
						'border-[var(--cardapio-primary)] bg-[var(--cardapio-primary)]/5 shadow-md shadow-[var(--cardapio-primary)]/5':
							formaSelecionada === opcao.valor,
						'border-[var(--cardapio-border)]': formaSelecionada !== opcao.valor,
					}"
				>
					<!-- Botão principal -->
					<button
						type="button"
						@click="formaSelecionada = opcao.valor"
						class="group w-full p-4 transition-all duration-200 text-left flex items-center gap-4"
						:class="{
							'hover:bg-[var(--cardapio-muted)]': formaSelecionada !== opcao.valor,
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

					<!-- Conteúdo expansível (Dinheiro e PIX) -->
					<Transition
						enter-active-class="transition-all duration-300 ease-out"
						enter-from-class="max-h-0 opacity-0"
						enter-to-class="max-h-96 opacity-100"
						leave-active-class="transition-all duration-200 ease-in"
						leave-from-class="max-h-96 opacity-100"
						leave-to-class="max-h-0 opacity-0"
					>
						<!-- Dinheiro -->
						<div
							v-if="opcao.valor === 'dinheiro' && formaSelecionada === 'dinheiro'"
							class="px-4 pb-4 space-y-3 border-t border-[var(--cardapio-border)]"
						>
							<div class="pt-4 space-y-3">
								<!-- Valor total do pedido -->
								<div
									class="p-3 rounded-lg bg-[var(--cardapio-muted)] border border-[var(--cardapio-border)]"
								>
									<p class="text-xs text-[var(--cardapio-text-muted)] mb-1">
										💰 Valor total do pedido:
									</p>
									<p class="text-lg font-bold text-[var(--cardapio-primary)]">
										{{ formatCurrency(valorTotal) }}
									</p>
								</div>

								<!-- Campo de troco -->
								<div class="flex items-center gap-2">
									<Icon name="lucide:banknote" class="w-5 h-5 text-[var(--cardapio-primary)]" />
									<p class="text-sm font-medium text-[var(--cardapio-text)]">
										Precisa de troco?
										<span class="text-xs text-[var(--cardapio-text-muted)] font-normal"
											>(opcional)</span
										>
									</p>
								</div>
								<UiCurrencyInput
									id="troco"
									:model-value="trocoPara || 0"
									placeholder="R$ 0,00"
									:class="{ 'border-red-500': trocoErro }"
									@update:model-value="(v) => (trocoPara = v)"
								/>

								<!-- Mensagem de erro -->
								<p v-if="trocoErro" class="text-xs text-red-600 dark:text-red-400">
									⚠️ {{ trocoErro }}
								</p>

								<!-- Valor do troco calculado -->
								<div
									v-if="valorTroco > 0"
									class="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex justify-between items-center"
								>
									<span class="text-sm font-medium text-green-700 dark:text-green-300"
										>💰 Seu troco será:</span
									>
									<span class="text-lg font-bold text-green-700 dark:text-green-300">{{
										formatCurrency(valorTroco)
									}}</span>
								</div>
							</div>
						</div>

						<!-- PIX -->
						<div
							v-else-if="opcao.valor === 'pix' && formaSelecionada === 'pix'"
							class="px-4 pb-4 border-t border-[var(--cardapio-border)]"
						>
							<div class="pt-4 space-y-4">
								<div
									class="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 flex gap-3"
								>
									<div
										class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0"
									>
										<span class="text-xl">ℹ️</span>
									</div>
									<div class="flex-1">
										<p class="font-bold text-blue-800 dark:text-blue-300 text-sm mb-1">
											Pague na próxima etapa
										</p>
										<p class="text-xs text-blue-700 dark:text-blue-400">
											Ao finalizar seu pedido, você verá a chave PIX e as instruções para envio do
											comprovante.
										</p>
									</div>
								</div>
							</div>
						</div>
					</Transition>
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
