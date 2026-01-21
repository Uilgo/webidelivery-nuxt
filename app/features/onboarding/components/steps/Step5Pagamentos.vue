<script setup lang="ts">
/**
 * 📌 Step5Pagamentos - Etapa 5 do Onboarding
 *
 * Configuração dos métodos de pagamento aceitos:
 * - Dinheiro, PIX, Cartão de Crédito, Cartão de Débito
 * - Pelo menos um método deve estar ativo
 */

import type { Step5Pagamentos } from "../../types/onboarding";

/**
 * Props do componente
 */
interface Props {
	modelValue: Step5Pagamentos;
}

/**
 * Emits do componente
 */
interface Emits {
	"update:modelValue": [value: Step5Pagamentos];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

/**
 * Computed para v-model
 */
const formData = computed({
	get: () => props.modelValue,
	set: (value: Step5Pagamentos) => emit("update:modelValue", value),
});

/**
 * Métodos de pagamento disponíveis
 */
const metodosPagamento = [
	{
		key: "aceita_dinheiro" as const,
		label: "Dinheiro",
		description: "Pagamento em espécie na entrega",
		icon: "lucide:banknote",
		color: "text-green-600 dark:text-green-400",
	},
	{
		key: "aceita_pix" as const,
		label: "PIX",
		description: "Transferência instantânea via PIX",
		icon: "lucide:zap",
		color: "text-blue-600 dark:text-blue-400",
	},
	{
		key: "aceita_cartao_credito" as const,
		label: "Cartão de Crédito",
		description: "Pagamento com cartão de crédito",
		icon: "lucide:credit-card",
		color: "text-purple-600 dark:text-purple-400",
	},
	{
		key: "aceita_cartao_debito" as const,
		label: "Cartão de Débito",
		description: "Pagamento com cartão de débito",
		icon: "lucide:credit-card",
		color: "text-orange-600 dark:text-orange-400",
	},
];

/**
 * Atualizar método de pagamento
 */
const updateMetodo = (key: keyof Step5Pagamentos, value: boolean): void => {
	formData.value = {
		...formData.value,
		[key]: value,
	};
};

/**
 * Verificar se pelo menos um método está ativo
 */
const temMetodoAtivo = computed((): boolean => {
	return !!(
		formData.value.aceita_dinheiro ||
		formData.value.aceita_pix ||
		formData.value.aceita_cartao_credito ||
		formData.value.aceita_cartao_debito
	);
});

/**
 * Contar métodos ativos
 */
const metodosAtivos = computed((): number => {
	return [
		formData.value.aceita_dinheiro,
		formData.value.aceita_pix,
		formData.value.aceita_cartao_credito,
		formData.value.aceita_cartao_debito,
	].filter(Boolean).length;
});
</script>

<template>
	<div class="space-y-6">
		<!-- Cabeçalho da etapa -->
		<div class="text-center">
			<h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Métodos de Pagamento</h3>
			<p class="text-gray-600 dark:text-gray-400">
				Selecione quais formas de pagamento você aceita
			</p>
		</div>

		<!-- Contador de métodos ativos -->
		<div class="text-center">
			<div
				class="inline-flex items-center space-x-2 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full text-sm"
			>
				<Icon name="lucide:check-circle" class="w-4 h-4" />
				<span
					>{{ metodosAtivos }} método{{ metodosAtivos !== 1 ? "s" : "" }} selecionado{{
						metodosAtivos !== 1 ? "s" : ""
					}}</span
				>
			</div>
		</div>

		<!-- Lista de métodos de pagamento -->
		<div class="space-y-3">
			<div
				v-for="metodo in metodosPagamento"
				:key="metodo.key"
				class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-all duration-200"
				:class="{
					'border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20':
						formData[metodo.key],
					'hover:border-gray-300 dark:hover:border-gray-600': !formData[metodo.key],
				}"
			>
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-4">
						<!-- Ícone -->
						<div
							class="w-10 h-10 rounded-lg flex items-center justify-center"
							:class="{
								'bg-primary-100 dark:bg-primary-900/40': formData[metodo.key],
								'bg-gray-100 dark:bg-gray-800': !formData[metodo.key],
							}"
						>
							<Icon
								:name="metodo.icon"
								class="w-5 h-5"
								:class="
									formData[metodo.key] ? 'text-primary-600 dark:text-primary-400' : metodo.color
								"
							/>
						</div>

						<!-- Informações -->
						<div>
							<h4 class="font-medium text-gray-900 dark:text-white">
								{{ metodo.label }}
							</h4>
							<p class="text-sm text-gray-600 dark:text-gray-400">
								{{ metodo.description }}
							</p>
						</div>
					</div>

					<!-- Switch -->
					<Switch
						:model-value="formData[metodo.key]"
						@update:model-value="(value: boolean) => updateMetodo(metodo.key, value)"
					/>
				</div>
			</div>
		</div>

		<!-- Validação -->
		<div
			v-if="!temMetodoAtivo"
			class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
		>
			<div class="flex items-center space-x-3">
				<Icon name="lucide:alert-triangle" class="w-5 h-5 text-red-600 dark:text-red-400" />
				<p class="text-sm text-red-700 dark:text-red-300">
					Você precisa selecionar pelo menos um método de pagamento.
				</p>
			</div>
		</div>

		<!-- Informações sobre métodos -->
		<div class="space-y-4">
			<!-- PIX -->
			<div
				v-if="formData.aceita_pix"
				class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
			>
				<div class="flex items-start space-x-3">
					<Icon name="lucide:info" class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
					<div class="text-sm">
						<p class="font-medium text-blue-900 dark:text-blue-100 mb-1">PIX selecionado</p>
						<p class="text-blue-700 dark:text-blue-300">
							Você poderá configurar sua chave PIX nas configurações após o onboarding. O PIX é
							instantâneo e não tem taxas.
						</p>
					</div>
				</div>
			</div>

			<!-- Cartões -->
			<div
				v-if="formData.aceita_cartao_credito || formData.aceita_cartao_debito"
				class="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4"
			>
				<div class="flex items-start space-x-3">
					<Icon
						name="lucide:credit-card"
						class="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5"
					/>
					<div class="text-sm">
						<p class="font-medium text-purple-900 dark:text-purple-100 mb-1">
							Cartões selecionados
						</p>
						<p class="text-purple-700 dark:text-purple-300">
							Para aceitar cartões, você precisará de uma maquininha ou integração com gateway de
							pagamento. Configure isso nas configurações após o onboarding.
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Dicas gerais -->
		<div
			class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
		>
			<div class="flex items-start space-x-3">
				<Icon name="lucide:lightbulb" class="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
				<div class="text-sm">
					<p class="font-medium text-green-900 dark:text-green-100 mb-1">Dicas importantes:</p>
					<ul class="text-green-700 dark:text-green-300 space-y-1">
						<li>• Mais opções de pagamento = mais vendas</li>
						<li>• PIX é gratuito e instantâneo</li>
						<li>• Dinheiro ainda é muito usado para delivery</li>
						<li>• Você pode alterar essas configurações depois</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</template>
