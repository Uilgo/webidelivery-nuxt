<script setup lang="ts">
/**
 * 📌 OnboardingManager - Orquestrador do Onboarding
 *
 * Componente principal que gerencia todo o fluxo de onboarding:
 * - Tela de boas-vindas
 * - 5 etapas de configuração
 * - Navegação entre etapas
 * - Validação e submissão
 */

import { useOnboarding } from "~/features/onboarding/composables/useOnboarding";
import type {
	Step1InfoBasica as Step1Type,
	Step2Endereco as Step2Type,
	Step3Contato as Step3Type,
	Step4Horarios as Step4Type,
	Step5Pagamentos as Step5Type,
} from "~/features/onboarding/types/onboarding";
import OnboardingWelcome from "~/features/onboarding/components/OnboardingWelcome.vue";
import OnboardingStepperVertical from "~/features/onboarding/components/OnboardingStepperVertical.vue";
import Step1InfoBasica from "~/features/onboarding/components/steps/Step1InfoBasica.vue";
import Step2Endereco from "~/features/onboarding/components/steps/Step2Endereco.vue";
import Step3Contato from "~/features/onboarding/components/steps/Step3Contato.vue";
import Step4Horarios from "~/features/onboarding/components/steps/Step4Horarios.vue";
import Step5Pagamentos from "~/features/onboarding/components/steps/Step5Pagamentos.vue";

/**
 * Composable principal do onboarding
 */
const {
	// Dados
	formData,

	// Navegação
	currentStep,
	totalSteps,
	isFirstStep,
	isLastStep,

	// Estados
	saving,
	completing,
	actionError,

	// Validações
	slugValidation,
	isCurrentStepValid,
	canProceed,
	isComplete,

	// Métodos
	prevStep,
	checkSlugAvailability,
	resetSlugValidation,
	handleNext,
	handleComplete,
	reset,
} = useOnboarding();

/**
 * Estado da tela de boas-vindas - controlado pela URL
 */
const route = useRoute();
const router = useRouter();

// Se não há query parameter 'step', mostrar welcome
const showWelcome = computed(() => !route.query.step);

/**
 * Iniciar onboarding (sair da tela de boas-vindas)
 */
const startOnboarding = (): void => {
	router.push({ query: { step: "1" } });
};

/**
 * Voltar para tela de boas-vindas
 */
const backToWelcome = (): void => {
	router.push({ query: {} }); // Remove query parameters
	reset();
};

/**
 * Títulos das etapas
 */
const stepTitles = {
	1: "Informações Básicas",
	2: "Endereço",
	3: "Contato",
	4: "Horários",
	5: "Pagamentos",
};

/**
 * Lista de steps para o stepper vertical
 */
const stepsList = [
	{ title: "Informações" },
	{ title: "Endereço" },
	{ title: "Contato" },
	{ title: "Horários" },
	{ title: "Pagamentos" },
];

/**
 * Handler para voltar etapa
 */
const handlePrev = (): void => {
	if (isFirstStep.value) {
		backToWelcome();
	} else {
		prevStep();
	}
};

/**
 * Handler para avançar/completar
 */
const handleNextOrComplete = async (): Promise<void> => {
	if (isLastStep.value && isComplete.value) {
		await handleComplete();
	} else {
		await handleNext();
	}
};

/**
 * Texto do botão principal
 */
const primaryButtonText = computed((): string => {
	if (completing.value) return "Finalizando...";
	if (saving.value) return "Salvando...";
	if (isLastStep.value) return "Finalizar Configuração";
	return "Continuar";
});

/**
 * Desabilitar botão principal
 */
const isPrimaryButtonDisabled = computed((): boolean => {
	return !canProceed.value || saving.value || completing.value;
});
</script>

<template>
	<div class="min-h-full">
		<!-- Tela de Boas-vindas -->
		<div v-if="showWelcome" class="h-full flex items-center">
			<OnboardingWelcome @start-onboarding="startOnboarding" />
		</div>

		<!-- Fluxo de Onboarding -->
		<div v-else class="min-h-full flex gap-4 max-w-6xl mx-auto py-4">
			<!-- STEPPER VERTICAL (esquerda) -->
			<OnboardingStepperVertical
				:current-step="currentStep"
				:total-steps="totalSteps"
				:steps="stepsList"
				class="hidden lg:block flex-shrink-0"
			/>

			<!-- CONTEÚDO (direita) -->
			<div class="flex-1 min-w-0 flex flex-col">
				<!-- Card -->
				<div
					class="flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
				>
					<!-- Cabeçalho da Etapa -->
					<div class="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
						<div class="flex items-center justify-between">
							<div>
								<h2 class="text-lg font-semibold text-gray-900 dark:text-white">
									Etapa {{ currentStep }}: {{ stepTitles[currentStep as keyof typeof stepTitles] }}
								</h2>
								<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
									Preencha as informações abaixo para continuar
								</p>
							</div>

							<!-- Indicador de salvamento -->
							<div
								v-if="saving"
								class="flex items-center space-x-2 text-blue-600 dark:text-blue-400"
							>
								<Icon name="lucide:loader-2" class="w-4 h-4 animate-spin" />
								<span class="text-sm">Salvando...</span>
							</div>
						</div>
					</div>

					<!-- Conteúdo da Etapa -->
					<div class="px-6 py-6">
						<Step1InfoBasica
							v-if="currentStep === 1"
							:model-value="formData.step1"
							:slug-validation="slugValidation"
							@update:model-value="(value: Step1Type) => (formData.step1 = value)"
							@check-slug="checkSlugAvailability"
							@reset-slug-validation="resetSlugValidation"
						/>
						<Step2Endereco
							v-else-if="currentStep === 2"
							:model-value="formData.step2"
							@update:model-value="(value: Step2Type) => (formData.step2 = value)"
						/>
						<Step3Contato
							v-else-if="currentStep === 3"
							:model-value="formData.step3"
							@update:model-value="(value: Step3Type) => (formData.step3 = value)"
						/>
						<Step4Horarios
							v-else-if="currentStep === 4"
							:model-value="formData.step4"
							@update:model-value="(value: Step4Type) => (formData.step4 = value)"
						/>
						<Step5Pagamentos
							v-else-if="currentStep === 5"
							:model-value="formData.step5"
							@update:model-value="(value: Step5Type) => (formData.step5 = value)"
						/>
					</div>

					<!-- Rodapé com Botões -->
					<div class="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
						<div class="flex items-center justify-between">
							<!-- Botão Voltar -->
							<UiButton variant="outline" :disabled="saving || completing" @click="handlePrev">
								<Icon name="lucide:arrow-left" class="w-4 h-4 mr-2" />
								{{ isFirstStep ? "Início" : "Voltar" }}
							</UiButton>

							<!-- Informações da Etapa -->
							<div class="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
								<span>{{ currentStep }} de {{ totalSteps }}</span>
								<div class="flex items-center space-x-1">
									<Icon
										:name="isCurrentStepValid ? 'lucide:check-circle' : 'lucide:circle'"
										class="w-4 h-4"
										:class="isCurrentStepValid ? 'text-green-500' : 'text-gray-400'"
									/>
									<span>{{ isCurrentStepValid ? "Válido" : "Incompleto" }}</span>
								</div>
							</div>

							<!-- Botão Continuar/Finalizar -->
							<UiButton
								:disabled="isPrimaryButtonDisabled"
								:loading="saving || completing"
								@click="handleNextOrComplete"
							>
								{{ primaryButtonText }}
								<Icon
									v-if="!saving && !completing"
									:name="isLastStep ? 'lucide:check' : 'lucide:arrow-right'"
									class="w-4 h-4 ml-2"
								/>
							</UiButton>
						</div>
					</div>
				</div>

				<!-- Erro de Ação -->
				<div
					v-if="actionError"
					class="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
				>
					<div class="flex items-center space-x-3">
						<Icon name="lucide:alert-circle" class="w-5 h-5 text-red-600 dark:text-red-400" />
						<p class="text-sm text-red-700 dark:text-red-300">
							{{ actionError }}
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
