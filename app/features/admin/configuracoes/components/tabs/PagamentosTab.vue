<script setup lang="ts">
/**
 * 📌 PagamentosTab
 *
 * Tab de configuração de métodos de pagamento (Admin only).
 * Reutiliza componentes do Step5 do onboarding com campos extras.
 */

import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { pagamentosSchema } from "#shared/schemas/configuracoes";
import { usePagamentos } from "../../composables/usePagamentos";
import ConfiguracaoCard from "../shared/ConfiguracaoCard.vue";

// Composable de pagamentos
const { pagamentos, loading, saving, salvarPagamentos } = usePagamentos();

// Schema de validação
const validationSchema = toTypedSchema(pagamentosSchema);

// Formulário com vee-validate (sem initialValues - será preenchido pelo watch)
const { handleSubmit, values, setFieldValue, errors, resetForm } = useForm({
	validationSchema,
	keepValuesOnUnmount: true,
});

// Watch para atualizar valores quando dados carregarem
watch(
	pagamentos,
	(newPagamentos) => {
		if (newPagamentos) {
			// Resetar formulário com novos valores
			resetForm({
				values: {
					aceita_dinheiro: newPagamentos.aceita_dinheiro,
					aceita_pix: newPagamentos.aceita_pix,
					tipo_chave_pix: newPagamentos.tipo_chave_pix || "cpf",
					chave_pix: newPagamentos.chave_pix || "",
					aceita_cartao_credito: newPagamentos.aceita_cartao_credito,
					aceita_cartao_debito: newPagamentos.aceita_cartao_debito,
				},
			});
		}
	},
	{ immediate: true },
);

// Submeter formulário
const onSubmit = handleSubmit(async (formValues) => {
	await salvarPagamentos(formValues);
});

/**
 * Tipos de chave PIX disponíveis
 */
const tiposChavePix = [
	{
		value: "cpf",
		label: "CPF",
		placeholder: "000.000.000-00",
		mask: "###.###.###-##",
		icon: "lucide:user",
	},
	{
		value: "cnpj",
		label: "CNPJ",
		placeholder: "00.000.000/0000-00",
		mask: "##.###.###/####-##",
		icon: "lucide:briefcase",
	},
	{
		value: "email",
		label: "E-mail",
		placeholder: "seu@email.com",
		icon: "lucide:mail",
	},
	{
		value: "telefone",
		label: "Telefone",
		placeholder: "(00) 00000-0000",
		mask: "(##) #####-####",
		icon: "lucide:phone",
	},
	{
		value: "aleatoria",
		label: "Chave Aleatória",
		placeholder: "Cole sua chave aleatória aqui",
		icon: "lucide:key",
	},
] as const;

/**
 * Obter placeholder e máscara baseado no tipo de chave
 */
const tipoChaveSelecionado = computed(() => {
	return tiposChavePix.find((tipo) => tipo.value === values.tipo_chave_pix) || tiposChavePix[0];
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
		description: "Com maquininha própria na entrega",
		icon: "lucide:credit-card",
		color: "text-purple-600 dark:text-purple-400",
	},
	{
		key: "aceita_cartao_debito" as const,
		label: "Cartão de Débito",
		description: "Com maquininha própria na entrega",
		icon: "lucide:credit-card",
		color: "text-orange-600 dark:text-orange-400",
	},
];

/**
 * Atualizar método de pagamento
 */
const updateMetodo = (key: keyof typeof values, value: boolean): void => {
	setFieldValue(key, value);
};

/**
 * Verificar se pelo menos um método está ativo
 */
const temMetodoAtivo = computed((): boolean => {
	return !!(
		values.aceita_dinheiro ||
		values.aceita_pix ||
		values.aceita_cartao_credito ||
		values.aceita_cartao_debito
	);
});

/**
 * Contar métodos ativos
 */
const metodosAtivos = computed((): number => {
	return [
		values.aceita_dinheiro,
		values.aceita_pix,
		values.aceita_cartao_credito,
		values.aceita_cartao_debito,
	].filter(Boolean).length;
});
</script>

<template>
	<div class="space-y-6">
		<ConfiguracaoCard
			title="Métodos de Pagamento"
			description="Configure as formas de pagamento aceitas na entrega."
			icon="lucide:credit-card"
			:loading="saving"
			@save="onSubmit"
		>
			<!-- Skeleton de Loading -->
			<div v-if="loading" class="space-y-4">
				<UiSkeleton class="h-24 w-full" />
				<UiSkeleton class="h-24 w-full" />
			</div>

			<!-- Formulário -->
			<form v-else class="space-y-6">
				<!-- Contador de métodos ativos -->
				<div class="flex justify-center">
					<div
						class="inline-flex items-center space-x-2 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 px-4 py-2 rounded-full text-sm font-medium"
					>
						<Icon name="lucide:check-circle" class="w-4 h-4" />
						<span
							>{{ metodosAtivos }} método{{ metodosAtivos !== 1 ? "s" : "" }} selecionado{{
								metodosAtivos !== 1 ? "s" : ""
							}}</span
						>
					</div>
				</div>

				<!-- Grid 2 colunas: Métodos de pagamento (2x2) -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div
						v-for="metodo in metodosPagamento"
						:key="metodo.key"
						class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-all duration-200 hover:shadow-md"
						:class="{
							'border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 shadow-sm':
								values[metodo.key],
							'hover:border-gray-300 dark:hover:border-gray-600': !values[metodo.key],
						}"
					>
						<div class="flex items-center justify-between">
							<div class="flex items-center space-x-3">
								<!-- Ícone -->
								<div
									class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
									:class="{
										'bg-primary-100 dark:bg-primary-900/40': values[metodo.key],
										'bg-gray-100 dark:bg-gray-800': !values[metodo.key],
									}"
								>
									<Icon
										:name="metodo.icon"
										class="!w-8 !h-8"
										style="width: 32px !important; height: 32px !important"
										:class="
											values[metodo.key] ? 'text-primary-600 dark:text-primary-400' : metodo.color
										"
									/>
								</div>

								<!-- Informações -->
								<div class="min-w-0 flex-1">
									<h4 class="text-sm font-semibold text-gray-900 dark:text-white truncate">
										{{ metodo.label }}
									</h4>
									<p class="text-xs text-gray-600 dark:text-gray-400 truncate">
										{{ metodo.description }}
									</p>
								</div>
							</div>

							<!-- Switch -->
							<UiSwitch
								:model-value="values[metodo.key]"
								@update:model-value="(value: boolean) => updateMetodo(metodo.key, value)"
							/>
						</div>
					</div>
				</div>

				<!-- Campo Chave PIX (condicional) -->
				<div
					v-if="values.aceita_pix"
					class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-4"
				>
					<!-- Seletor de Tipo de Chave -->
					<UiFormField name="tipo_chave_pix" label="Tipo de Chave PIX" required>
						<div class="grid grid-cols-2 md:grid-cols-5 gap-2">
							<button
								v-for="tipo in tiposChavePix"
								:key="tipo.value"
								type="button"
								class="flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all"
								:class="{
									'border-primary-500 bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300':
										values.tipo_chave_pix === tipo.value,
									'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300':
										values.tipo_chave_pix !== tipo.value,
								}"
								@click="setFieldValue('tipo_chave_pix', tipo.value)"
							>
								<Icon :name="tipo.icon" class="w-5 h-5 mb-1" />
								<span class="text-xs font-medium">{{ tipo.label }}</span>
							</button>
						</div>
						<template v-if="errors.tipo_chave_pix" #error>{{ errors.tipo_chave_pix }}</template>
					</UiFormField>

					<!-- Campo Chave PIX -->
					<UiFormField name="chave_pix" label="Chave PIX" required>
						<UiInput
							v-model="values.chave_pix"
							:placeholder="tipoChaveSelecionado.placeholder"
							:error="!!errors.chave_pix"
							@blur="() => setFieldValue('chave_pix', values.chave_pix)"
						/>
						<template v-if="errors.chave_pix" #error>{{ errors.chave_pix }}</template>
					</UiFormField>

					<p class="text-xs text-blue-700 dark:text-blue-300">
						Esta chave será exibida para os clientes que escolherem pagar via PIX.
					</p>
				</div>

				<!-- Validação: pelo menos 1 método ativo -->
				<div
					v-if="!temMetodoAtivo"
					class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
				>
					<div class="flex items-center space-x-2">
						<Icon name="lucide:alert-triangle" class="w-5 h-5 text-red-600 dark:text-red-400" />
						<p class="text-sm font-medium text-red-700 dark:text-red-300">
							Selecione pelo menos um método de pagamento
						</p>
					</div>
				</div>

				<!-- Grid 2 colunas: Boxes informativos (PIX + Cartões) -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<!-- PIX -->
					<div
						v-if="values.aceita_pix"
						class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
					>
						<div class="flex items-start space-x-3">
							<Icon name="lucide:info" class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
							<div class="text-sm">
								<p class="font-semibold text-blue-900 dark:text-blue-100 mb-1">PIX ativo</p>
								<p class="text-blue-700 dark:text-blue-300">
									Transferência instantânea e sem taxas. Configure sua chave PIX acima.
								</p>
							</div>
						</div>
					</div>

					<!-- Cartões -->
					<div
						v-if="values.aceita_cartao_credito || values.aceita_cartao_debito"
						class="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4"
					>
						<div class="flex items-start space-x-3">
							<Icon
								name="lucide:credit-card"
								class="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5"
							/>
							<div class="text-sm">
								<p class="font-semibold text-purple-900 dark:text-purple-100 mb-1">
									Cartões ativos
								</p>
								<p class="text-purple-700 dark:text-purple-300">
									Você precisará ter sua própria maquininha de cartão para receber o pagamento no
									momento da entrega.
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
						<Icon
							name="lucide:lightbulb"
							class="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5"
						/>
						<div class="text-sm">
							<p class="font-semibold text-green-900 dark:text-green-100 mb-2">Dicas:</p>
							<ul class="text-green-700 dark:text-green-300 space-y-1">
								<li>• Mais opções = mais vendas</li>
								<li>• PIX é gratuito e instantâneo</li>
								<li>• Dinheiro ainda é muito usado</li>
								<li>• Pode alterar a qualquer momento</li>
							</ul>
						</div>
					</div>
				</div>
			</form>
		</ConfiguracaoCard>
	</div>
</template>
