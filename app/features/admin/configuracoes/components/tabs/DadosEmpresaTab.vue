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
import ConfiguracaoCard from "../shared/ConfiguracaoCard.vue";

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
		<ConfiguracaoCard
			title="Informações Básicas"
			description="Dados principais do seu estabelecimento que aparecem no cardápio público."
			icon="lucide:store"
			:loading="saving"
			@save="onSubmit"
		>
			<!-- Skeleton de Loading -->
			<div v-if="loading" class="space-y-4">
				<UiSkeleton class="h-12 w-full" />
				<UiSkeleton class="h-12 w-full" />
				<UiSkeleton class="h-24 w-full" />
			</div>

			<!-- Formulário -->
			<form v-else class="space-y-6">
				<!-- Nome do Estabelecimento -->
				<UiFormField name="nome" label="Nome do Estabelecimento" required>
					<UiInput
						v-model="values.nome"
						placeholder="Ex: Pizzaria Bella Napoli"
						:error="!!errors.nome"
						@blur="() => setFieldValue('nome', values.nome)"
					/>
					<template v-if="errors.nome" #error>{{ errors.nome }}</template>
				</UiFormField>

				<!-- Slug (URL) -->
				<UiFormField name="slug" label="URL do Cardápio" required>
					<div class="space-y-2">
						<div class="flex items-center gap-2">
							<span class="text-sm text-[var(--text-muted)]">webidelivery.com.br/</span>
							<UiInput
								v-model="slugInput"
								placeholder="bella-napoli"
								:error="!!errors.slug"
								class="flex-1"
							/>
						</div>

						<!-- Validação de Slug em Tempo Real -->
						<div v-if="slugValidation.isChecking" class="flex items-center gap-2 text-sm">
							<Icon name="lucide:loader-2" class="w-4 h-4 animate-spin text-[var(--primary)]" />
							<span class="text-[var(--text-muted)]">Verificando disponibilidade...</span>
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
								:name="slugValidation.available ? 'lucide:check-circle' : 'lucide:alert-circle'"
								class="w-4 h-4"
							/>
							<span>{{ slugValidation.message }}</span>
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
									class="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5"
								/>
								<div class="text-sm text-yellow-700 dark:text-yellow-300">
									<strong>Atenção:</strong> Alterar a URL do cardápio afetará todos os links
									compartilhados anteriormente.
								</div>
							</div>
						</div>
					</div>
				</UiFormField>

				<!-- Descrição -->
				<UiFormField name="descricao" label="Descrição">
					<UiTextarea
						:model-value="values.descricao || ''"
						placeholder="Descreva seu estabelecimento..."
						:rows="3"
						:error="errors.descricao"
						@update:model-value="(value: string) => setFieldValue('descricao', value)"
					/>
				</UiFormField>

				<!-- WhatsApp -->
				<UiFormField name="whatsapp" label="WhatsApp">
					<UiInput
						v-model="values.whatsapp"
						placeholder="(11) 99999-9999"
						:error="!!errors.whatsapp"
						@blur="() => setFieldValue('whatsapp', values.whatsapp)"
					/>
					<template v-if="errors.whatsapp" #error>{{ errors.whatsapp }}</template>
				</UiFormField>

				<!-- URLs de Logo (futuro - upload de imagem) -->
				<div class="text-sm text-[var(--text-muted)] italic">
					Upload de logo será implementado em breve
				</div>
			</form>
		</ConfiguracaoCard>
	</div>
</template>
