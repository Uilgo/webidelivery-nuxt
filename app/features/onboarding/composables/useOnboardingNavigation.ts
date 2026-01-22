/**
 * 📌 useOnboardingNavigation - Navegação entre Etapas com URL e Persistência
 *
 * Responsável por:
 * - Controlar etapa atual via URL (?step=N)
 * - Navegar entre etapas
 * - Calcular progresso
 * - Validar se pode avançar
 * - Sincronizar com query parameters
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
	const route = useRoute();
	const router = useRouter();

	const TOTAL_STEPS = 5;

	// Estado da etapa atual - inicializado pela URL de forma SSR-friendly
	const stepFromUrl = parseInt(String(route.query.step || "1"));
	const initialStep = stepFromUrl >= 1 && stepFromUrl <= TOTAL_STEPS ? stepFromUrl : 1;
	const currentStep = ref(initialStep);

	// Watcher para sincronizar mudanças de step com a URL
	watch(currentStep, (newStep) => {
		// Atualizar URL sem recarregar a página
		router.replace({
			query: { ...route.query, step: newStep.toString() },
		});
	});

	// Watcher para sincronizar mudanças na URL com o step
	watch(
		() => route.query.step,
		(newStepQuery) => {
			const newStep = parseInt(String(newStepQuery || "1"));
			if (newStep >= 1 && newStep <= TOTAL_STEPS && newStep !== currentStep.value) {
				currentStep.value = newStep;
			}
		},
	);

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
