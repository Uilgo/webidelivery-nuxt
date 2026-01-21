<script setup lang="ts">
/**
 * 📌 OnboardingProgress - Barra de Progresso do Onboarding
 *
 * Mostra o progresso atual das 5 etapas do onboarding com indicadores visuais.
 */

/**
 * Props do componente
 */
interface Props {
	currentStep?: number;
	totalSteps?: number;
	progress?: number;
}

const props = withDefaults(defineProps<Props>(), {
	currentStep: 1,
	totalSteps: 5,
	progress: 20,
});

/**
 * Steps do onboarding
 */
const steps = [
	{ number: 1, label: "Informações" },
	{ number: 2, label: "Endereço" },
	{ number: 3, label: "Contato" },
	{ number: 4, label: "Horários" },
	{ number: 5, label: "Pagamentos" },
];

/**
 * Classes CSS para o círculo do step
 */
const getStepClasses = (stepNumber: number): string => {
	if (stepNumber < props.currentStep) {
		// Step concluído
		return "bg-primary-600 border-primary-600";
	} else if (stepNumber === props.currentStep) {
		// Step atual
		return "bg-white dark:bg-gray-800 border-primary-600 ring-2 ring-primary-600 ring-offset-2 dark:ring-offset-gray-900";
	} else {
		// Step futuro
		return "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600";
	}
};

/**
 * Classes CSS para o label do step
 */
const getStepLabelClasses = (stepNumber: number): string => {
	if (stepNumber <= props.currentStep) {
		return "text-primary-600 dark:text-primary-400";
	} else {
		return "text-gray-500 dark:text-gray-400";
	}
};

/**
 * Posicionamento dos steps na barra
 */
const getStepPosition = (stepNumber: number): string => {
	const positions = {
		1: "-left-2",
		2: "-left-2",
		3: "-left-2",
		4: "-left-2",
		5: "-right-2",
	};
	return positions[stepNumber as keyof typeof positions] || "-left-2";
};
</script>

<template>
	<div class="w-full max-w-2xl mx-auto mb-8">
		<!-- Título do progresso -->
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-lg font-semibold text-gray-900 dark:text-white">
				Configuração do Estabelecimento
			</h2>
			<span class="text-sm text-gray-500 dark:text-gray-400">
				{{ currentStep }} de {{ totalSteps }}
			</span>
		</div>

		<!-- Barra de progresso -->
		<div class="relative">
			<!-- Background da barra -->
			<div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6">
				<div
					class="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
					:style="{ width: `${progress}%` }"
				></div>
			</div>

			<!-- Steps indicators -->
			<div class="flex justify-between absolute -top-1 w-full">
				<div
					v-for="step in steps"
					:key="step.number"
					class="flex flex-col items-center"
					:class="getStepPosition(step.number)"
				>
					<!-- Círculo do step -->
					<div
						class="w-4 h-4 rounded-full border-2 transition-all duration-300 flex items-center justify-center"
						:class="getStepClasses(step.number)"
					>
						<!-- Ícone de check para steps concluídos -->
						<Icon
							v-if="step.number < currentStep"
							name="lucide:check"
							class="w-2.5 h-2.5 text-white"
						/>
					</div>

					<!-- Label do step -->
					<span
						class="mt-2 text-xs font-medium text-center max-w-20"
						:class="getStepLabelClasses(step.number)"
					>
						{{ step.label }}
					</span>
				</div>
			</div>
		</div>
	</div>
</template>
