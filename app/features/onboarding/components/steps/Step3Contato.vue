<script setup lang="ts">
/**
 * 📌 Step3Contato - Etapa 3 do Onboarding
 *
 * Coleta informações de contato do estabelecimento:
 * - WhatsApp (obrigatório)
 */

import { formatWhatsApp, parsePhone } from "../../../../../lib/formatters/phone";
import { isValidWhatsApp } from "../../../../../lib/validators/phone";
import type { Step3Contato } from "../../types/onboarding";

/**
 * Props do componente
 */
interface Props {
	modelValue: Step3Contato;
}

/**
 * Emits do componente
 */
interface Emits {
	"update:modelValue": [value: Step3Contato];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

/**
 * Computed para v-model
 */
const formData = computed({
	get: () => props.modelValue,
	set: (value: Step3Contato) => emit("update:modelValue", value),
});

/**
 * Handler para mudança do WhatsApp - COM BLOQUEIO ABSOLUTO
 */
const handleWhatsAppChange = (value: string | number): void => {
	const rawValue = String(value);

	// Extrair apenas dígitos do valor atual
	const cleaned = rawValue.replace(/\D/g, "");

	// Remover DDI +55 se presente para contar apenas os dígitos do número
	const withoutDDI = cleaned.startsWith("55") ? cleaned.slice(2) : cleaned;

	// BLOQUEIO ABSOLUTO: Se exceder 11 dígitos, truncar
	const limitedDigits = withoutDDI.slice(0, 11);

	// Reconstruir com DDI e formatar
	const reconstructed = "55" + limitedDigits;
	const formatted = formatWhatsApp(reconstructed);

	// Atualizar modelo com valor formatado e limitado
	formData.value = { ...formData.value, whatsapp: formatted };
};

/**
 * Referência para o input do WhatsApp
 */
const whatsappInputRef = ref<HTMLInputElement>();

/**
 * Handler para interceptar input direto no DOM - PROTEÇÃO TRIPLA
 */
const handleWhatsAppInput = (event: Event): void => {
	const target = event.target as HTMLInputElement;
	const currentValue = target.value;

	// Extrair dígitos
	const cleaned = currentValue.replace(/\D/g, "");
	const withoutDDI = cleaned.startsWith("55") ? cleaned.slice(2) : cleaned;

	// PROTEÇÃO 1: Se exceder 11 dígitos, reverter para valor anterior
	if (withoutDDI.length > 11) {
		event.preventDefault();
		event.stopPropagation();
		target.value = formData.value.whatsapp;
		return;
	}

	// Processar normalmente
	handleWhatsAppChange(currentValue);
};

/**
 * Maxlength dinâmico baseado no formato atual
 */
const whatsappMaxLength = computed((): number => {
	// +55 (XX) XXXXX-XXXX = 19 caracteres máximo
	return 19;
});

/**
 * Validar WhatsApp - USANDO VALIDATOR OFICIAL COM DDI
 */
const isWhatsAppValid = computed((): boolean => {
	const whatsapp = formData.value.whatsapp;
	if (!whatsapp) return false;

	// Extrair apenas números (incluindo DDI +55)
	const phoneNumbers = parsePhone(whatsapp);

	// Usar validator oficial que espera DDI +55
	return isValidWhatsApp(phoneNumbers);
});

/**
 * Gerar link do WhatsApp para teste
 */
const whatsappLink = computed((): string => {
	if (!isWhatsAppValid.value) return "";

	// Extrair apenas números
	const numbers = parsePhone(formData.value.whatsapp);

	// Remover DDI +55 se já estiver presente para evitar duplicação
	const withoutDDI = numbers.startsWith("55") ? numbers.slice(2) : numbers;

	// Sempre adicionar DDI +55 para o link do WhatsApp
	return `https://wa.me/55${withoutDDI}`;
});
</script>

<template>
	<div class="space-y-3">
		<!-- WhatsApp -->
		<UiFormField label="WhatsApp" required>
			<UiInput
				ref="whatsappInputRef"
				:model-value="formData.whatsapp"
				placeholder="+55 (11) 99999-9999"
				:maxlength="whatsappMaxLength"
				@input="handleWhatsAppInput"
				@update:model-value="handleWhatsAppChange"
			>
				<template #iconLeft>
					<Icon name="logos:whatsapp-icon" class="w-4 h-4" />
				</template>
				<template #iconRight>
					<Icon v-if="isWhatsAppValid" name="lucide:check-circle" class="w-4 h-4 text-green-500" />
					<Icon v-else-if="formData.whatsapp" name="lucide:x-circle" class="w-4 h-4 text-red-500" />
				</template>
			</UiInput>

			<!-- Feedback de validação -->
			<template v-if="formData.whatsapp && !isWhatsAppValid" #error>
				Formato inválido. Use: (11) 99999-9999
			</template>
		</UiFormField>

		<!-- Teste do WhatsApp -->
		<div
			v-if="isWhatsAppValid"
			class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3"
		>
			<div class="flex items-center justify-between">
				<div class="flex items-center space-x-2">
					<Icon name="lucide:check-circle" class="w-4 h-4 text-green-600 dark:text-green-400" />
					<div>
						<p class="text-sm font-semibold text-green-900 dark:text-green-100">
							WhatsApp configurado!
						</p>
						<p class="text-xs text-green-700 dark:text-green-300">
							Teste se o número está funcionando
						</p>
					</div>
				</div>
				<UiButton :href="whatsappLink" target="_blank" variant="outline" size="sm" color="success">
					<Icon name="logos:whatsapp-icon" class="w-4 h-4 mr-2" />
					Testar
				</UiButton>
			</div>
		</div>

		<!-- Boxes informativos lado a lado -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
			<!-- Como funciona -->
			<div
				class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3"
			>
				<div class="flex items-start space-x-2">
					<Icon name="lucide:info" class="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
					<div class="text-xs">
						<p class="font-semibold text-blue-900 dark:text-blue-100 mb-1">
							Como o WhatsApp será usado:
						</p>
						<ul class="text-blue-700 dark:text-blue-300 space-y-0.5">
							<li>• Contato direto com clientes</li>
							<li>• Notificações de pedidos</li>
							<li>• Tirar dúvidas sobre produtos</li>
						</ul>
					</div>
				</div>
			</div>

			<!-- Dicas -->
			<div
				class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3"
			>
				<div class="flex items-start space-x-2">
					<Icon
						name="lucide:lightbulb"
						class="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5"
					/>
					<div class="text-xs">
						<p class="font-semibold text-yellow-900 dark:text-yellow-100 mb-0.5">
							Dicas importantes:
						</p>
						<ul class="text-yellow-700 dark:text-yellow-300 space-y-0.5">
							<li>• Use um número monitorado</li>
							<li>• Mantenha WhatsApp Business ativo</li>
							<li>• Responda rapidamente</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
