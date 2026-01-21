<script setup lang="ts">
/**
 * 📌 Step3Contato - Etapa 3 do Onboarding
 *
 * Coleta informações de contato do estabelecimento:
 * - WhatsApp (obrigatório)
 */

import { formatWhatsApp, parsePhone, isValidPhone } from "../../../../../lib/formatters/phone";
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
 * Handler para mudança do WhatsApp
 */
const handleWhatsAppChange = (value: string): void => {
	// Usar formatter existente
	const formatted = formatWhatsApp(parsePhone(value));
	formData.value = { ...formData.value, whatsapp: formatted };
};

/**
 * Validar WhatsApp
 */
const isWhatsAppValid = computed((): boolean => {
	const whatsapp = formData.value.whatsapp;
	if (!whatsapp) return false;

	// Usar validator existente
	const phoneOnly = parsePhone(whatsapp);
	return isValidPhone(phoneOnly);
});

/**
 * Gerar link do WhatsApp para teste
 */
const whatsappLink = computed((): string => {
	if (!isWhatsAppValid.value) return "";

	const numbers = parsePhone(formData.value.whatsapp);
	return `https://wa.me/55${numbers}`;
});
</script>

<template>
	<div class="space-y-6">
		<!-- Cabeçalho da etapa -->
		<div class="text-center">
			<h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
				Informações de Contato
			</h3>
			<p class="text-gray-600 dark:text-gray-400">
				Configure o WhatsApp para que os clientes possam entrar em contato
			</p>
		</div>

		<!-- Formulário -->
		<div class="space-y-4">
			<!-- WhatsApp -->
			<FormField
				label="WhatsApp"
				description="Número do WhatsApp para contato com os clientes"
				required
			>
				<Input
					:model-value="formData.whatsapp"
					placeholder="(11) 99999-9999"
					maxlength="15"
					@update:model-value="handleWhatsAppChange"
				>
					<template #leading>
						<Icon name="logos:whatsapp-icon" class="w-4 h-4" />
					</template>
					<template #trailing>
						<Icon
							v-if="isWhatsAppValid"
							name="lucide:check-circle"
							class="w-4 h-4 text-green-500"
						/>
						<Icon
							v-else-if="formData.whatsapp"
							name="lucide:x-circle"
							class="w-4 h-4 text-red-500"
						/>
					</template>
				</Input>

				<!-- Feedback de validação -->
				<p
					v-if="formData.whatsapp && !isWhatsAppValid"
					class="text-sm text-red-600 dark:text-red-400 mt-1"
				>
					Formato inválido. Use: (11) 99999-9999
				</p>
			</FormField>

			<!-- Teste do WhatsApp -->
			<div
				v-if="isWhatsAppValid"
				class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
			>
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-3">
						<Icon name="lucide:check-circle" class="w-5 h-5 text-green-600 dark:text-green-400" />
						<div>
							<p class="font-medium text-green-900 dark:text-green-100">WhatsApp configurado!</p>
							<p class="text-sm text-green-700 dark:text-green-300">
								Teste se o número está funcionando
							</p>
						</div>
					</div>
					<UiButton
						:href="whatsappLink"
						target="_blank"
						variant="outline"
						size="sm"
						color="success"
					>
						<Icon name="logos:whatsapp-icon" class="w-4 h-4 mr-2" />
						Testar
					</UiButton>
				</div>
			</div>
		</div>

		<!-- Informações importantes -->
		<div class="space-y-4">
			<!-- Como funciona -->
			<div
				class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
			>
				<div class="flex items-start space-x-3">
					<Icon name="lucide:info" class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
					<div class="text-sm">
						<p class="font-medium text-blue-900 dark:text-blue-100 mb-2">
							Como o WhatsApp será usado:
						</p>
						<ul class="text-blue-700 dark:text-blue-300 space-y-1">
							<li>• Os clientes poderão entrar em contato diretamente</li>
							<li>• Você receberá notificações de novos pedidos</li>
							<li>• Poderá tirar dúvidas sobre produtos e entregas</li>
							<li>• Confirmações de pedidos serão enviadas automaticamente</li>
						</ul>
					</div>
				</div>
			</div>

			<!-- Dicas -->
			<div
				class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
			>
				<div class="flex items-start space-x-3">
					<Icon
						name="lucide:lightbulb"
						class="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5"
					/>
					<div class="text-sm">
						<p class="font-medium text-yellow-900 dark:text-yellow-100 mb-1">Dicas importantes:</p>
						<ul class="text-yellow-700 dark:text-yellow-300 space-y-1">
							<li>• Use um número que você sempre monitora</li>
							<li>• Mantenha o WhatsApp Business ativo</li>
							<li>• Configure mensagens automáticas de ausência</li>
							<li>• Responda rapidamente para melhor experiência</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
