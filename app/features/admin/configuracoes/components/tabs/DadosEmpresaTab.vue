<script setup lang="ts">
/**
 * 📌 DadosEmpresaTab
 *
 * Tab de configuração dos dados da empresa (Admin only).
 * Permite editar nome, slug, descrição, logo e WhatsApp.
 */

import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { dadosEmpresaSchema } from "#shared/schemas/configuracoes";
import { useDadosEmpresa } from "../../composables/useDadosEmpresa";

// Composable de dados da empresa
const { dados, loading, saving, salvarDados, slugValidation, validarSlug } = useDadosEmpresa();

// Schema de validação
const validationSchema = toTypedSchema(dadosEmpresaSchema);

// Formulário com vee-validate (sem initialValues - será preenchido pelo watch)
const { handleSubmit, values, setFieldValue, errors, resetForm } = useForm({
	validationSchema,
	keepValuesOnUnmount: true,
});

// Validar slug em tempo real (debounced manual)
const slugInput = ref("");
let slugTimeout: NodeJS.Timeout | null = null;

// Watch para atualizar valores quando dados carregarem
watch(
	dados,
	(newDados) => {
		if (newDados) {
			// Resetar formulário com novos valores
			resetForm({
				values: {
					nome: newDados.nome,
					slug: newDados.slug,
					descricao: newDados.descricao || "",
					logo_url: newDados.logo_url || "",
					logo_url_dark: newDados.logo_url_dark || "",
					whatsapp: newDados.whatsapp || "",
				},
			});
			// Atualizar slugInput também
			slugInput.value = newDados.slug;
		}
	},
	{ immediate: true },
);

watch(slugInput, (newSlug) => {
	setFieldValue("slug", newSlug);

	// Debounce manual
	if (slugTimeout) clearTimeout(slugTimeout);
	slugTimeout = setTimeout(async () => {
		if (newSlug && newSlug.length >= 3) {
			await validarSlug(newSlug);
		}
	}, 500);
});

// Submeter formulário
const onSubmit = handleSubmit(async (formValues) => {
	await salvarDados(formValues);
});

// Mensagem de aviso ao alterar slug
const showSlugWarning = computed(() => {
	return values.slug !== dados.value?.slug && dados.value?.slug;
});
</script>

<template>
	<div class="space-y-6">
		<!-- Skeleton de Loading -->
		<div v-if="loading" class="space-y-4">
			<UiSkeleton class="h-12 w-full" />
			<UiSkeleton class="h-12 w-full" />
			<UiSkeleton class="h-24 w-full" />
		</div>

		<!-- Layout Principal: 2 Colunas com Cards -->
		<div v-else class="grid grid-cols-1 lg:grid-cols-5 gap-6">
			<!-- CARD ESQUERDO: LOGOS (2/5) -->
			<div class="lg:col-span-2">
				<UiCard class="h-fit">
					<div class="space-y-4">
						<div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
							<Icon name="lucide:palette" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
							<h3 class="text-sm font-semibold text-gray-900 dark:text-white">Identidade Visual</h3>
						</div>

						<!-- Logo Claro -->
						<UiPictureUpload
							:model-value="values.logo_url || ''"
							label="Logo Claro"
							hint="Para tema claro"
							preview-bg="light"
							:max-size="200"
							:max-size-k-b="100"
							@update:model-value="(value: string) => setFieldValue('logo_url', value)"
						/>

						<!-- Logo Escuro -->
						<UiPictureUpload
							:model-value="values.logo_url_dark || ''"
							label="Logo Escuro"
							hint="Para tema escuro"
							preview-bg="dark"
							:max-size="200"
							:max-size-k-b="100"
							@update:model-value="(value: string) => setFieldValue('logo_url_dark', value)"
						/>

						<!-- Dica sobre logos -->
						<div
							class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3"
						>
							<p class="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
								<Icon name="lucide:lightbulb" class="w-4 h-4 flex-shrink-0" />
								<span>PNG ou JPG • Recomendado: 200x200px • Fundo transparente</span>
							</p>
						</div>
					</div>
				</UiCard>
			</div>

			<!-- CARD DIREITO: DADOS (3/5) -->
			<div class="lg:col-span-3">
				<UiCard class="h-fit">
					<form class="space-y-8" @submit.prevent="onSubmit">
						<!-- SEÇÃO 1: IDENTIDADE -->
						<div class="space-y-4">
							<div
								class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700"
							>
								<Icon name="lucide:store" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
								<h3 class="text-sm font-semibold text-gray-900 dark:text-white">Identidade</h3>
							</div>

							<!-- Grid 3 colunas: Nome (2 cols) + WhatsApp (1 col) -->
							<div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
								<!-- Nome do Estabelecimento (70% - 2 colunas) -->
								<div class="lg:col-span-2">
									<UiFormField name="nome" label="Nome do Estabelecimento" required>
										<UiInput
											v-model="values.nome"
											placeholder="Ex: Pizzaria Bella Napoli"
											:error="!!errors.nome"
											@blur="() => setFieldValue('nome', values.nome)"
										/>
										<template v-if="errors.nome" #error>{{ errors.nome }}</template>
									</UiFormField>
								</div>

								<!-- WhatsApp (30% - 1 coluna) -->
								<div class="lg:col-span-1">
									<UiFormField name="whatsapp" label="WhatsApp">
										<UiInput
											v-model="values.whatsapp"
											placeholder="(11) 99999-9999"
											:error="!!errors.whatsapp"
											@blur="() => setFieldValue('whatsapp', values.whatsapp)"
										/>
										<template v-if="errors.whatsapp" #error>{{ errors.whatsapp }}</template>
									</UiFormField>
								</div>
							</div>

							<!-- Slug (URL) - Full Width com Prefix Estilizado -->
							<UiFormField name="slug" label="URL do Cardápio" required>
								<div class="space-y-2">
									<div class="flex items-center gap-2">
										<span
											class="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 whitespace-nowrap border border-gray-200 dark:border-gray-700"
										>
											webidelivery.com.br/
										</span>
										<UiInput
											v-model="slugInput"
											placeholder="bella-napoli"
											:error="!!errors.slug"
											class="flex-1 max-w-md"
										/>
									</div>

									<!-- Validação de Slug em Tempo Real -->
									<div v-if="slugValidation.isChecking" class="flex items-center gap-2 text-sm">
										<Icon
											name="lucide:loader-2"
											class="w-4 h-4 animate-spin text-primary-600 dark:text-primary-400"
										/>
										<span class="text-gray-600 dark:text-gray-400"
											>Verificando disponibilidade...</span
										>
									</div>

									<div
										v-else-if="slugValidation.message"
										class="flex items-center gap-2 text-sm"
										:class="
											slugValidation.available
												? 'text-green-600 dark:text-green-400'
												: 'text-red-600 dark:text-red-400'
										"
									>
										<Icon
											:name="
												slugValidation.available ? 'lucide:check-circle-2' : 'lucide:alert-circle'
											"
											class="w-4 h-4"
										/>
										<span class="font-medium">{{ slugValidation.message }}</span>
									</div>

									<!-- Erro de validação do slug -->
									<div v-if="errors.slug" class="text-sm text-red-600 dark:text-red-400">
										{{ errors.slug }}
									</div>

									<!-- Aviso ao alterar slug -->
									<div
										v-if="showSlugWarning"
										class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3"
									>
										<div class="flex items-start gap-2">
											<Icon
												name="lucide:alert-triangle"
												class="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0"
											/>
											<div class="text-sm text-yellow-700 dark:text-yellow-300">
												<strong>Atenção:</strong> Alterar a URL do cardápio afetará todos os links
												compartilhados anteriormente.
											</div>
										</div>
									</div>
								</div>
							</UiFormField>
						</div>

						<!-- SEÇÃO 2: DESCRIÇÃO -->
						<div class="space-y-4">
							<div
								class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700"
							>
								<Icon
									name="lucide:file-text"
									class="w-5 h-5 text-primary-600 dark:text-primary-400"
								/>
								<h3 class="text-sm font-semibold text-gray-900 dark:text-white">Descrição</h3>
							</div>

							<UiFormField name="descricao" label="Descrição do Estabelecimento">
								<UiTextarea
									:model-value="values.descricao || ''"
									placeholder="Descreva seu estabelecimento, especialidades, diferenciais..."
									:rows="3"
									:error="errors.descricao"
									@update:model-value="(value: string) => setFieldValue('descricao', value)"
								/>
								<p class="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1">
									<Icon name="lucide:info" class="w-3 h-3" />
									Esta descrição aparecerá no topo do seu cardápio público
								</p>
							</UiFormField>
						</div>

						<!-- Botão de Salvar -->
						<div class="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
							<UiButton type="submit" :loading="saving" :disabled="saving" class="px-6">
								<template #iconLeft>
									<Icon name="lucide:save" class="w-4 h-4" />
								</template>
								{{ saving ? "Salvando..." : "Salvar Alterações" }}
							</UiButton>
						</div>
					</form>
				</UiCard>
			</div>
		</div>
	</div>
</template>
