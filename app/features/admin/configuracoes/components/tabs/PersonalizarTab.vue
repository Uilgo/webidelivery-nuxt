<script setup lang="ts">
/**
 * 📌 PersonalizarTab
 *
 * Tab de personalização visual do cardápio (Admin + Gerente).
 * Cores, fontes e layout do cardápio público.
 */

import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { personalizacaoSchema } from "#shared/schemas/configuracoes";
import { usePersonalizacao } from "../../composables/usePersonalizacao";
import ConfiguracaoCard from "../shared/ConfiguracaoCard.vue";

// Composable de personalização
const { tema, loading, saving, salvarTema } = usePersonalizacao();

// Schema de validação
const validationSchema = toTypedSchema(personalizacaoSchema);

// Formulário com vee-validate (sem initialValues - será preenchido pelo watch)
const { handleSubmit, values, setFieldValue, errors, resetForm } = useForm({
	validationSchema,
	keepValuesOnUnmount: true,
});

// Watch para atualizar valores quando dados carregarem
watch(
	tema,
	(newTema) => {
		if (newTema) {
			// Resetar formulário com novos valores
			resetForm({
				values: {
					cor_primaria: newTema.cor_primaria,
					cor_secundaria: newTema.cor_secundaria,
					cor_fundo: newTema.cor_fundo,
					cor_texto: newTema.cor_texto,
					fonte_principal: newTema.fonte_principal,
					estilo_botoes: newTema.estilo_botoes,
					layout_cardapio: newTema.layout_cardapio,
				},
			});
		}
	},
	{ immediate: true },
);

// Submeter formulário
const onSubmit = handleSubmit(async (formValues) => {
	await salvarTema(formValues);
});

// Opções de fontes
const fontesDisponiveis = [
	{ value: "Inter", label: "Inter (Padrão)" },
	{ value: "Roboto", label: "Roboto" },
	{ value: "Open Sans", label: "Open Sans" },
	{ value: "Lato", label: "Lato" },
	{ value: "Montserrat", label: "Montserrat" },
	{ value: "Poppins", label: "Poppins" },
];

// Opções de estilo de botões
const estilosBotoes = [
	{ value: "rounded", label: "Arredondado", icon: "lucide:circle" },
	{ value: "square", label: "Quadrado", icon: "lucide:square" },
];

// Opções de layout
const layoutsCardapio = [
	{ value: "grid", label: "Grade", icon: "lucide:layout-grid", description: "Produtos em grade" },
	{ value: "list", label: "Lista", icon: "lucide:list", description: "Produtos em lista" },
];
</script>

<template>
	<div class="space-y-6">
		<ConfiguracaoCard
			title="Cores do Cardápio"
			description="Personalize as cores do seu cardápio público."
			icon="lucide:palette"
			:loading="saving"
			@save="onSubmit"
		>
			<!-- Skeleton de Loading -->
			<div v-if="loading" class="space-y-4">
				<UiSkeleton class="h-16 w-full" />
				<UiSkeleton class="h-16 w-full" />
			</div>

			<!-- Formulário -->
			<form v-else class="space-y-6">
				<!-- Grid 2 colunas: Cores -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<!-- Cor Primária -->
					<UiFormField name="cor_primaria" label="Cor Primária" required>
						<template #default="{ componentField }">
							<div class="flex items-center gap-3">
								<input
									v-bind="componentField"
									type="color"
									class="w-16 h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
									:value="values.cor_primaria"
									@input="
										(e) => setFieldValue('cor_primaria', (e.target as HTMLInputElement).value)
									"
								/>
								<UiInput
									:model-value="values.cor_primaria"
									placeholder="#3B82F6"
									:error="errors.cor_primaria"
									class="flex-1"
									@update:model-value="(value: string) => setFieldValue('cor_primaria', value)"
								/>
							</div>
							<p class="text-xs text-[var(--text-muted)] mt-1">
								Cor principal dos botões e destaques
							</p>
						</template>
					</UiFormField>

					<!-- Cor Secundária -->
					<UiFormField name="cor_secundaria" label="Cor Secundária" required>
						<template #default="{ componentField }">
							<div class="flex items-center gap-3">
								<input
									v-bind="componentField"
									type="color"
									class="w-16 h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
									:value="values.cor_secundaria"
									@input="
										(e) => setFieldValue('cor_secundaria', (e.target as HTMLInputElement).value)
									"
								/>
								<UiInput
									:model-value="values.cor_secundaria"
									placeholder="#10B981"
									:error="errors.cor_secundaria"
									class="flex-1"
									@update:model-value="(value: string) => setFieldValue('cor_secundaria', value)"
								/>
							</div>
							<p class="text-xs text-[var(--text-muted)] mt-1">Cor de elementos secundários</p>
						</template>
					</UiFormField>

					<!-- Cor de Fundo -->
					<UiFormField name="cor_fundo" label="Cor de Fundo" required>
						<template #default="{ componentField }">
							<div class="flex items-center gap-3">
								<input
									v-bind="componentField"
									type="color"
									class="w-16 h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
									:value="values.cor_fundo"
									@input="(e) => setFieldValue('cor_fundo', (e.target as HTMLInputElement).value)"
								/>
								<UiInput
									:model-value="values.cor_fundo"
									placeholder="#FFFFFF"
									:error="errors.cor_fundo"
									class="flex-1"
									@update:model-value="(value: string) => setFieldValue('cor_fundo', value)"
								/>
							</div>
							<p class="text-xs text-[var(--text-muted)] mt-1">Cor de fundo do cardápio</p>
						</template>
					</UiFormField>

					<!-- Cor de Texto -->
					<UiFormField name="cor_texto" label="Cor de Texto" required>
						<template #default="{ componentField }">
							<div class="flex items-center gap-3">
								<input
									v-bind="componentField"
									type="color"
									class="w-16 h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
									:value="values.cor_texto"
									@input="(e) => setFieldValue('cor_texto', (e.target as HTMLInputElement).value)"
								/>
								<UiInput
									:model-value="values.cor_texto"
									placeholder="#1F2937"
									:error="errors.cor_texto"
									class="flex-1"
									@update:model-value="(value: string) => setFieldValue('cor_texto', value)"
								/>
							</div>
							<p class="text-xs text-[var(--text-muted)] mt-1">Cor principal do texto</p>
						</template>
					</UiFormField>
				</div>

				<!-- Preview das Cores -->
				<div
					class="border-2 rounded-lg p-6"
					:style="{
						backgroundColor: values.cor_fundo,
						borderColor: values.cor_primaria,
					}"
				>
					<div class="space-y-4">
						<h3 class="text-lg font-bold" :style="{ color: values.cor_texto }">
							Preview do Cardápio
						</h3>
						<p class="text-sm" :style="{ color: values.cor_texto }">
							Este é um exemplo de como seu cardápio ficará com as cores selecionadas.
						</p>
						<div class="flex gap-3">
							<button
								type="button"
								class="px-4 py-2 rounded-lg font-medium text-white"
								:style="{ backgroundColor: values.cor_primaria }"
							>
								Botão Primário
							</button>
							<button
								type="button"
								class="px-4 py-2 rounded-lg font-medium text-white"
								:style="{ backgroundColor: values.cor_secundaria }"
							>
								Botão Secundário
							</button>
						</div>
					</div>
				</div>

				<!-- Fonte Principal -->
				<UiFormField name="fonte_principal" label="Fonte Principal" required>
					<template #default="{ componentField }">
						<UiSelectMenu
							v-bind="componentField"
							:options="fontesDisponiveis"
							:model-value="values.fonte_principal"
							@update:model-value="(value: string) => setFieldValue('fonte_principal', value)"
						/>
						<p class="text-xs text-[var(--text-muted)] mt-1">Fonte usada em todo o cardápio</p>
					</template>
				</UiFormField>

				<!-- Estilo dos Botões -->
				<div class="space-y-2">
					<label class="text-sm font-medium text-gray-900 dark:text-white">
						Estilo dos Botões
					</label>
					<div class="grid grid-cols-2 gap-4">
						<div
							v-for="estilo in estilosBotoes"
							:key="estilo.value"
							class="border-2 rounded-lg p-4 cursor-pointer transition-all"
							:class="{
								'border-primary-500 bg-primary-50 dark:bg-primary-900/20':
									values.estilo_botoes === estilo.value,
								'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600':
									values.estilo_botoes !== estilo.value,
							}"
							@click="setFieldValue('estilo_botoes', estilo.value)"
						>
							<div class="flex items-center gap-3">
								<Icon :name="estilo.icon" class="w-6 h-6" />
								<span class="font-medium">{{ estilo.label }}</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Layout do Cardápio -->
				<div class="space-y-2">
					<label class="text-sm font-medium text-gray-900 dark:text-white">
						Layout do Cardápio
					</label>
					<div class="grid grid-cols-2 gap-4">
						<div
							v-for="layout in layoutsCardapio"
							:key="layout.value"
							class="border-2 rounded-lg p-4 cursor-pointer transition-all"
							:class="{
								'border-primary-500 bg-primary-50 dark:bg-primary-900/20':
									values.layout_cardapio === layout.value,
								'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600':
									values.layout_cardapio !== layout.value,
							}"
							@click="setFieldValue('layout_cardapio', layout.value)"
						>
							<div class="space-y-2">
								<div class="flex items-center gap-3">
									<Icon :name="layout.icon" class="w-6 h-6" />
									<span class="font-medium">{{ layout.label }}</span>
								</div>
								<p class="text-xs text-[var(--text-muted)]">{{ layout.description }}</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Dicas -->
				<div
					class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
				>
					<div class="flex items-start space-x-3">
						<Icon name="lucide:info" class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
						<div class="text-sm">
							<p class="font-semibold text-blue-900 dark:text-blue-100 mb-2">Dicas:</p>
							<ul class="text-blue-700 dark:text-blue-300 space-y-1">
								<li>• Use cores que representem sua marca</li>
								<li>• Garanta bom contraste entre texto e fundo</li>
								<li>• Teste em diferentes dispositivos</li>
								<li>• Mantenha consistência visual</li>
							</ul>
						</div>
					</div>
				</div>
			</form>
		</ConfiguracaoCard>
	</div>
</template>
