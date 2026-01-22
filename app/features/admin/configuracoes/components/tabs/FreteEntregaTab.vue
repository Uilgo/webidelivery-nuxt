<script setup lang="ts">
/**
 * 📌 FreteEntregaTab
 *
 * Tab de configuração de frete e entrega (Admin + Gerente).
 * Define tipos de entrega, raio, taxas e tempo estimado.
 */

import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { freteEntregaSchema } from "#shared/schemas/configuracoes";
import { useFreteEntrega } from "../../composables/useFreteEntrega";
import ConfiguracaoCard from "../shared/ConfiguracaoCard.vue";

// Composable de frete e entrega
const { configuracoes, loading, saving, salvarConfiguracoes } = useFreteEntrega();

// Schema de validação
const validationSchema = toTypedSchema(freteEntregaSchema);

// Formulário com vee-validate (sem initialValues - será preenchido pelo watch)
const { handleSubmit, values, setFieldValue, errors, resetForm } = useForm({
	validationSchema,
	keepValuesOnUnmount: true,
});

// Watch para atualizar valores quando dados carregarem
watch(
	configuracoes,
	(newConfig) => {
		if (newConfig) {
			// Resetar formulário com novos valores
			resetForm({
				values: {
					taxa_entrega: newConfig.taxa_entrega,
					tempo_preparo_min: newConfig.tempo_preparo_min,
					tempo_preparo_max: newConfig.tempo_preparo_max,
					valor_minimo_pedido: newConfig.valor_minimo_pedido,
					raio_entrega_km: newConfig.raio_entrega_km,
					aceita_agendamento: newConfig.aceita_agendamento,
				},
			});
		}
	},
	{ immediate: true },
);

// Submeter formulário
const onSubmit = handleSubmit(async (formValues) => {
	await salvarConfiguracoes(formValues);
});

// Formatadores de moeda
const formatCurrency = (value: number): string => {
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(value);
};
</script>

<template>
	<div class="space-y-6">
		<ConfiguracaoCard
			title="Configurações de Entrega"
			description="Defina taxas, raio de entrega, tempo de preparo e valor mínimo do pedido."
			icon="lucide:truck"
			:loading="saving"
			@save="onSubmit"
		>
			<!-- Skeleton de Loading -->
			<div v-if="loading" class="space-y-4">
				<UiSkeleton class="h-12 w-full" />
				<UiSkeleton class="h-12 w-full" />
				<UiSkeleton class="h-12 w-full" />
			</div>

			<!-- Formulário -->
			<form v-else class="space-y-6">
				<!-- Grid 2 colunas: Taxa de Entrega + Valor Mínimo -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<!-- Taxa de Entrega -->
					<UiFormField name="taxa_entrega" label="Taxa de Entrega" required>
						<UiInput
							:model-value="values.taxa_entrega"
							type="number"
							step="0.01"
							min="0"
							placeholder="0.00"
							:error="!!errors.taxa_entrega"
							@update:model-value="
								(value: string | number) => setFieldValue('taxa_entrega', Number(value))
							"
						/>
						<p class="text-xs text-[var(--text-muted)] mt-1">Valor fixo cobrado por entrega (R$)</p>
						<template v-if="errors.taxa_entrega" #error>{{ errors.taxa_entrega }}</template>
					</UiFormField>

					<!-- Valor Mínimo do Pedido -->
					<UiFormField name="valor_minimo_pedido" label="Valor Mínimo do Pedido" required>
						<UiInput
							:model-value="values.valor_minimo_pedido"
							type="number"
							step="0.01"
							min="0"
							placeholder="0.00"
							:error="!!errors.valor_minimo_pedido"
							@update:model-value="
								(value: string | number) => setFieldValue('valor_minimo_pedido', Number(value))
							"
						/>
						<p class="text-xs text-[var(--text-muted)] mt-1">
							Valor mínimo para aceitar pedidos (R$)
						</p>
						<template v-if="errors.valor_minimo_pedido" #error>{{
							errors.valor_minimo_pedido
						}}</template>
					</UiFormField>
				</div>

				<!-- Grid 2 colunas: Tempo de Preparo -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<!-- Tempo Mínimo -->
					<UiFormField name="tempo_preparo_min" label="Tempo Mínimo de Preparo" required>
						<UiInput
							:model-value="values.tempo_preparo_min"
							type="number"
							min="10"
							max="180"
							placeholder="30"
							:error="!!errors.tempo_preparo_min"
							@update:model-value="
								(value: string | number) => setFieldValue('tempo_preparo_min', Number(value))
							"
						/>
						<p class="text-xs text-[var(--text-muted)] mt-1">Tempo mínimo em minutos (10-180)</p>
						<template v-if="errors.tempo_preparo_min" #error>{{
							errors.tempo_preparo_min
						}}</template>
					</UiFormField>

					<!-- Tempo Máximo -->
					<UiFormField name="tempo_preparo_max" label="Tempo Máximo de Preparo" required>
						<UiInput
							:model-value="values.tempo_preparo_max"
							type="number"
							min="10"
							max="180"
							placeholder="45"
							:error="!!errors.tempo_preparo_max"
							@update:model-value="
								(value: string | number) => setFieldValue('tempo_preparo_max', Number(value))
							"
						/>
						<p class="text-xs text-[var(--text-muted)] mt-1">Tempo máximo em minutos (10-180)</p>
						<template v-if="errors.tempo_preparo_max" #error>{{
							errors.tempo_preparo_max
						}}</template>
					</UiFormField>
				</div>

				<!-- Raio de Entrega -->
				<UiFormField name="raio_entrega_km" label="Raio de Entrega (km)" required>
					<UiInput
						:model-value="values.raio_entrega_km"
						type="number"
						step="0.5"
						min="0"
						max="50"
						placeholder="5"
						:error="!!errors.raio_entrega_km"
						@update:model-value="
							(value: string | number) => setFieldValue('raio_entrega_km', Number(value))
						"
					/>
					<p class="text-xs text-[var(--text-muted)] mt-1">
						Distância máxima para entrega em quilômetros (0-50km)
					</p>
					<template v-if="errors.raio_entrega_km" #error>{{ errors.raio_entrega_km }}</template>
				</UiFormField>

				<!-- Aceita Agendamento -->
				<div
					class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-all duration-200"
					:class="{
						'border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20':
							values.aceita_agendamento,
					}"
				>
					<div class="flex items-center justify-between">
						<div class="flex items-center space-x-3">
							<div
								class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
								:class="{
									'bg-primary-100 dark:bg-primary-900/40': values.aceita_agendamento,
									'bg-gray-100 dark:bg-gray-800': !values.aceita_agendamento,
								}"
							>
								<Icon
									name="lucide:calendar"
									class="w-5 h-5"
									:class="
										values.aceita_agendamento
											? 'text-primary-600 dark:text-primary-400'
											: 'text-gray-600 dark:text-gray-400'
									"
								/>
							</div>
							<div>
								<h4 class="text-sm font-semibold text-gray-900 dark:text-white">
									Aceitar Agendamento
								</h4>
								<p class="text-xs text-gray-600 dark:text-gray-400">
									Permitir que clientes agendem pedidos para horários futuros
								</p>
							</div>
						</div>
						<UiSwitch
							:model-value="values.aceita_agendamento || false"
							@update:model-value="(value: boolean) => setFieldValue('aceita_agendamento', value)"
						/>
					</div>
				</div>

				<!-- Preview das Configurações -->
				<div
					class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
				>
					<div class="flex items-start space-x-3">
						<Icon name="lucide:info" class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
						<div class="text-sm">
							<p class="font-semibold text-blue-900 dark:text-blue-100 mb-2">
								Resumo das Configurações:
							</p>
							<ul class="text-blue-700 dark:text-blue-300 space-y-1">
								<li>• Taxa de entrega: {{ formatCurrency(values.taxa_entrega || 0) }}</li>
								<li>• Valor mínimo: {{ formatCurrency(values.valor_minimo_pedido || 0) }}</li>
								<li>
									• Tempo de preparo: {{ values.tempo_preparo_min }}-{{ values.tempo_preparo_max }}
									minutos
								</li>
								<li>• Raio de entrega: {{ values.raio_entrega_km }}km</li>
								<li>
									• Agendamento: {{ values.aceita_agendamento ? "Habilitado" : "Desabilitado" }}
								</li>
							</ul>
						</div>
					</div>
				</div>

				<!-- Dicas -->
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
								<li>• Seja realista com o tempo de preparo</li>
								<li>• Taxa de entrega muito alta pode afastar clientes</li>
								<li>• Valor mínimo ajuda a cobrir custos operacionais</li>
								<li>• Agendamento aumenta a organização da cozinha</li>
							</ul>
						</div>
					</div>
				</div>
			</form>
		</ConfiguracaoCard>
	</div>
</template>
