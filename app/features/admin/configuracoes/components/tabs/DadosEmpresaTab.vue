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
import { formatWhatsApp, parsePhone } from "~/lib/formatters/phone";
import { isValidWhatsApp } from "~/lib/validators/phone";
import { formatSlug } from "~/lib/formatters/slug";
import { useToast } from "~/composables/ui/useToast";
import type { DadosEmpresa } from "../../types/configuracoes";
import LogoUploadTabs from "../shared/LogoUploadTabs.vue";

// Composable de dados da empresa
const { dados, loading, saving, salvarDados, slugValidation, validarSlug } = useDadosEmpresa();
const { success } = useToast();

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

/**
 * Handler para mudança do slug - COM FORMATAÇÃO AUTOMÁTICA
 */
const handleSlugChange = (value: string | number): void => {
	const rawValue = String(value);

	// Usar o formatter oficial do projeto
	const formattedSlug = formatSlug(rawValue);

	// Atualizar slugInput e campo do formulário
	slugInput.value = formattedSlug;
	setFieldValue("slug", formattedSlug);

	// Debounce para validação
	if (slugTimeout) clearTimeout(slugTimeout);
	slugTimeout = setTimeout(async () => {
		if (formattedSlug && formattedSlug.length >= 3) {
			await validarSlug(formattedSlug);
		}
	}, 500);
};

/**
 * Handler para mudança do WhatsApp - COM MÁSCARA E VALIDAÇÃO
 */
const handleWhatsAppChange = (value: string | number): void => {
	const rawValue = String(value);

	// Extrair apenas números
	const onlyNumbers = rawValue.replace(/\D/g, "");

	// Limitar a 13 dígitos (DDI 55 + DDD 2 + Número 9)
	const limitedDigits = onlyNumbers.slice(0, 13);

	// Se começar com 55, usar como está; senão, adicionar DDI
	const withDDI = limitedDigits.startsWith("55") ? limitedDigits : "55" + limitedDigits;

	// Formatar e atualizar
	const formatted = formatWhatsApp(withDDI);
	setFieldValue("whatsapp", formatted);
};

/**
 * Referência para o input do WhatsApp
 */
const whatsappInputRef = ref<HTMLInputElement>();

/**
 * Handler para interceptar input direto no DOM
 */
const handleWhatsAppInput = (event: Event): void => {
	const target = event.target as HTMLInputElement;
	const currentValue = target.value;

	// Verificar se está tentando exceder o limite
	const onlyNumbers = currentValue.replace(/\D/g, "");
	if (onlyNumbers.length > 13) {
		event.preventDefault();
		event.stopPropagation();
		target.value = values.whatsapp || "";
		return;
	}

	// Processar normalmente
	handleWhatsAppChange(currentValue);
};

/**
 * Maxlength dinâmico baseado no formato
 */
const whatsappMaxLength = computed((): number => {
	// +55 (XX) XXXXX-XXXX = 19 caracteres máximo
	return 19;
});

/**
 * Validar WhatsApp
 */
const isWhatsAppValid = computed((): boolean => {
	const whatsapp = values.whatsapp;
	if (!whatsapp) return true; // Opcional, então vazio é válido
	const phoneNumbers = parsePhone(whatsapp);
	return isValidWhatsApp(phoneNumbers);
});

// Armazenar valores iniciais para comparação
const valoresIniciais = ref<DadosEmpresa | null>(null);

// Watch para atualizar valores quando dados carregarem
watch(
	dados,
	(newDados) => {
		if (newDados) {
			// Formatar WhatsApp antes de setar
			const whatsappFormatado = newDados.whatsapp ? formatWhatsApp(newDados.whatsapp) : "";

			// Armazenar valores iniciais para comparação posterior
			valoresIniciais.value = {
				nome: newDados.nome,
				slug: newDados.slug,
				descricao: newDados.descricao || "",
				logo_url: newDados.logo_url || "",
				logo_url_dark: newDados.logo_url_dark || "",
				whatsapp: whatsappFormatado,
			};

			// Resetar formulário com valores formatados
			resetForm({
				values: {
					nome: newDados.nome,
					slug: newDados.slug,
					descricao: newDados.descricao || "",
					logo_url: newDados.logo_url || "",
					logo_url_dark: newDados.logo_url_dark || "",
					whatsapp: whatsappFormatado,
				},
			});

			// Atualizar slugInput também
			slugInput.value = newDados.slug;
		}
	},
	{ immediate: true },
);

// Submeter formulário - SALVAR APENAS CAMPOS MODIFICADOS
const onSubmit = handleSubmit(async (formValues) => {
	if (!valoresIniciais.value) return;

	// Comparar valores atuais com iniciais e enviar apenas os modificados
	const camposModificados: Partial<DadosEmpresa> = {};

	// Verificar cada campo individualmente
	if (formValues.nome !== valoresIniciais.value.nome) {
		camposModificados.nome = formValues.nome;
	}

	if (formValues.slug !== valoresIniciais.value.slug) {
		camposModificados.slug = formValues.slug;
	}

	if (formValues.descricao !== valoresIniciais.value.descricao) {
		camposModificados.descricao = formValues.descricao || undefined;
	}

	if (formValues.logo_url !== valoresIniciais.value.logo_url) {
		camposModificados.logo_url = formValues.logo_url || undefined;
	}

	if (formValues.logo_url_dark !== valoresIniciais.value.logo_url_dark) {
		camposModificados.logo_url_dark = formValues.logo_url_dark || undefined;
	}

	if (formValues.whatsapp !== valoresIniciais.value.whatsapp) {
		// Salvar apenas números (sem formatação)
		const whatsappNumeros = parsePhone(formValues.whatsapp || "");
		camposModificados.whatsapp = whatsappNumeros || undefined;
	}

	// Se nenhum campo foi modificado, não fazer nada
	if (Object.keys(camposModificados).length === 0) {
		success({
			title: "Nenhuma alteração",
			description: "Não há alterações para salvar",
		});
		return;
	}

	// Salvar apenas os campos modificados
	const sucesso = await salvarDados(camposModificados);

	// Se salvou com sucesso, atualizar valores iniciais
	if (sucesso && valoresIniciais.value) {
		Object.assign(valoresIniciais.value, formValues);
	}
});

// Mensagem de aviso ao alterar slug
const showSlugWarning = computed(() => {
	return values.slug !== dados.value?.slug && dados.value?.slug;
});
</script>

<template>
	<!-- Container principal: altura total disponível, flex column -->
	<div class="h-full flex flex-col">
		<!-- Skeleton de Loading -->
		<div v-if="loading" class="space-y-4">
			<UiSkeleton class="h-12 w-full" />
			<UiSkeleton class="h-12 w-full" />
			<UiSkeleton class="h-24 w-full" />
		</div>

		<!-- Layout Principal: 2 Colunas com Cards -->
		<!-- Grid com flex-1 e min-h-0 para permitir que cards caibam na altura disponível -->
		<div v-else class="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-5 gap-4">
			<!-- CARD ESQUERDO: LOGOS (2/5) - COM TABS PARA ALTERNAR -->
			<div class="lg:col-span-2 min-h-0 h-full">
				<UiCard class="h-full flex flex-col" no-padding>
					<div class="p-6">
						<!-- Componente de Upload de Logos com Tabs -->
						<LogoUploadTabs
							:logo-claro="values.logo_url || ''"
							:logo-escuro="values.logo_url_dark || ''"
							@update:logo-claro="(value: string) => setFieldValue('logo_url', value)"
							@update:logo-escuro="(value: string) => setFieldValue('logo_url_dark', value)"
						/>
					</div>
				</UiCard>
			</div>

			<!-- CARD DIREITO: DADOS (3/5) - SEM SCROLL -->
			<div class="lg:col-span-3 min-h-0 h-full">
				<UiCard class="h-full flex flex-col" no-padding>
					<form class="space-y-6 p-6 flex-1 flex flex-col" @submit.prevent="onSubmit">
						<!-- SEÇÃO 1: IDENTIDADE -->
						<div class="space-y-4">
							<div
								class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700"
							>
								<Icon name="lucide:store" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
								<h3 class="text-sm font-semibold text-gray-900 dark:text-white">Identidade</h3>
							</div>

							<!-- Grid: Nome (flex-1) + WhatsApp (auto) -->
							<div class="flex flex-col lg:flex-row gap-4">
								<!-- Nome do Estabelecimento (ocupa espaço disponível) -->
								<div class="flex-1">
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

								<!-- WhatsApp (largura fixa/compacta) -->
								<div class="w-full lg:w-auto">
									<UiFormField name="whatsapp" label="WhatsApp">
										<UiInput
											ref="whatsappInputRef"
											:model-value="values.whatsapp"
											placeholder="(11) 99999-9999"
											:maxlength="whatsappMaxLength"
											:error="!!(errors.whatsapp || (values.whatsapp && !isWhatsAppValid))"
											class="[&_input]:!flex-none [&_input]:!w-[172px] lg:w-auto"
											@input="handleWhatsAppInput"
											@update:model-value="handleWhatsAppChange"
										>
											<template #iconLeft>
												<Icon name="logos:whatsapp-icon" class="w-4 h-4 shrink-0" />
											</template>
											<template #iconRight>
												<Icon
													v-if="values.whatsapp && isWhatsAppValid"
													name="lucide:check-circle"
													class="w-4 h-4 text-green-500 shrink-0"
												/>
												<Icon
													v-else-if="values.whatsapp && !isWhatsAppValid"
													name="lucide:x-circle"
													class="w-4 h-4 text-red-500 shrink-0"
												/>
											</template>
										</UiInput>
										<template v-if="errors.whatsapp" #error>{{ errors.whatsapp }}</template>
										<template v-else-if="values.whatsapp && !isWhatsAppValid" #error>
											Formato inválido. Use: (11) 99999-9999
										</template>
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
											:model-value="slugInput"
											placeholder="bella-napoli"
											:error="!!errors.slug"
											:disabled="slugValidation.isChecking"
											class="flex-1 max-w-md"
											@update:model-value="handleSlugChange"
										>
											<template #iconRight>
												<Icon
													v-if="slugValidation.isChecking"
													name="lucide:loader-2"
													class="w-4 h-4 animate-spin text-primary-600 dark:text-primary-400"
												/>
												<Icon
													v-else-if="slugValidation.available"
													name="lucide:check-circle-2"
													class="w-4 h-4 text-green-500"
												/>
												<Icon
													v-else-if="slugValidation.message && !slugValidation.available"
													name="lucide:alert-circle"
													class="w-4 h-4 text-red-500"
												/>
											</template>
										</UiInput>
									</div>

									<!-- Validação de Slug em Tempo Real -->
									<div
										v-if="slugValidation.message"
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
						<div class="space-y-4 flex-1">
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
						<div
							class="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700 mt-auto"
						>
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
