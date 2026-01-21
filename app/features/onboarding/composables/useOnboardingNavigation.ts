/**
 * 📌 useOnboardingNavigation - Navegação entre Etapas
 *
 * Responsável por:
 * - Controlar etapa atual
 * - Navegar entre etapas
 * - Calcular progresso
 * - Validar se pode avançar
 */

export interface UseOnboardingNavigationReturn {
	currentStep: Ref<number>;
	totalSteps: ComputedRef<number>;
	progress: ComputedRef<number>;
	canGoNext: ComputedRef<boolean>;
	canGoPrev: ComputedRef<boolean>;
	isFirstStep: ComputedRef<boolean>;
	isLastStep: ComputedRef<boolean>;
	nextStep: () => void;
	prevStep: () => void;
	goToStep: (step: number) => void;
	reset: () => void;
}

export const useOnboardingNavigation = (): UseOnboardingNavigationReturn => {
	// Estado da etapa atual
	const currentStep = ref(1);
	const TOTAL_STEPS = 5;

	// Computadas
	const totalSteps = computed(() => TOTAL_STEPS);
	const progress = computed(() => (currentStep.value / TOTAL_STEPS) * 100);
	const canGoNext = computed(() => currentStep.value < TOTAL_STEPS);
	const canGoPrev = computed(() => currentStep.value > 1);
	const isFirstStep = computed(() => currentStep.value === 1);
	const isLastStep = computed(() => currentStep.value === TOTAL_STEPS);

	/**
	 * Avançar para próxima etapa
	 */
	const nextStep = (): void => {
		if (canGoNext.value) {
			currentStep.value++;
		}
	};

	/**
	 * Voltar para etapa anterior
	 */
	const prevStep = (): void => {
		if (canGoPrev.value) {
			currentStep.value--;
		}
	};

	/**
	 * Ir para etapa específica
	 */
	const goToStep = (step: number): void => {
		if (step >= 1 && step <= TOTAL_STEPS) {
			currentStep.value = step;
		}
	};

	/**
	 * Resetar para primeira etapa
	 */
	const reset = (): void => {
		currentStep.value = 1;
	};

	return {
		currentStep,
		totalSteps,
		progress,
		canGoNext,
		canGoPrev,
		isFirstStep,
		isLastStep,
		nextStep,
		prevStep,
		goToStep,
		reset,
	};
};
