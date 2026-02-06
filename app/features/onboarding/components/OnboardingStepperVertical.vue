<script setup lang="ts">
/**
 * 📌 OnboardingStepperVertical - Stepper Vertical do Onboarding
 *
 * Wrapper do componente UiStepper configurado para o onboarding.
 * Exibe o progresso do onboarding em formato vertical na lateral esquerda.
 */

import type { StepperItem } from "~/components/ui/Stepper.vue";

interface Props {
	currentStep: number;
	totalSteps: number;
	steps: Array<{ title: string }>;
}

const props = defineProps<Props>();

/**
 * Converter steps para formato do UiStepper
 */
const stepperItems = computed((): StepperItem[] => {
	return props.steps.map((step, index) => ({
		title: step.title,
		value: index,
	}));
});
</script>

<template>
	<div class="w-56 flex-shrink-0">
		<div class="sticky top-6">
			<UiStepper
				:items="stepperItems"
				:model-value="currentStep - 1"
				orientation="vertical"
				size="lg"
				color="primary"
			/>
		</div>
	</div>
</template>
