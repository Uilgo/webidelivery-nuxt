/**
 * 📌 useOnboarding - Composable Orquestrador do Onboarding
 *
 * Unifica todos os composables de onboarding em uma API única:
 * - useOnboardingNavigation (navegação entre etapas)
 * - useOnboardingActions (ações RPC)
 * - useOnboardingValidation (validações)
 */

import type { OnboardingData } from "../types/onboarding";
import { useOnboardingNavigation } from "./useOnboardingNavigation";
import { useOnboardingActions } from "./useOnboardingActions";
import { useOnboardingValidation } from "./useOnboardingValidation";
import { useEstabelecimentoStore } from "~/stores/estabelecimento";
import { useToast } from "~/composables/ui/useToast";

export interface UseOnboardingReturn {
	// Dados do formulário
	formData: Ref<OnboardingData>;

	// Navegação
	currentStep: Ref<number>;
	totalSteps: ComputedRef<number>;
	progress: ComputedRef<number>;
	canGoNext: ComputedRef<boolean>;
	canGoPrev: ComputedRef<boolean>;
	isFirstStep: ComputedRef<boolean>;
	isLastStep: ComputedRef<boolean>;

	// Estados
	saving: Ref<boolean>;
	completing: Ref<boolean>;
	actionError: Ref<string | null>;

	// Validações
	slugValidation: Ref<{
		isValid: boolean;
		isChecking: boolean;
		message: string;
		available: boolean;
	}>;
	isCurrentStepValid: ComputedRef<boolean>;
	canProceed: ComputedRef<boolean>;
	isComplete: ComputedRef<boolean>;

	// Métodos de navegação
	nextStep: () => void;
	prevStep: () => void;
	goToStep: (step: number) => void;

	// Métodos de validação
	checkSlugAvailability: (slug: string) => Promise<void>;

	// Métodos de ação
	handleNext: () => Promise<void>;
	handleComplete: () => Promise<void>;
	reset: () => void;
}

export const useOnboarding = (): UseOnboardingReturn => {
	// Composables internos
	const navigationComposable = useOnboardingNavigation();
	const actionsComposable = useOnboardingActions();
	const validationComposable = useOnboardingValidation();

	// Stores e utilitários
	const estabelecimentoStore = useEstabelecimentoStore();
	const { success } = useToast();

	// ========================================
	// DADOS DO FORMULÁRIO
	// ========================================

	const initialFormData: OnboardingData = {
		step1: {
			nome: "",
			slug: "",
			descricao: "",
		},
		step2: {
			endereco_rua: "",
			endereco_numero: "",
			endereco_bairro: "",
			endereco_cidade: "",
			endereco_estado: "", // Vazio inicialmente, será preenchido pelo usuário ou API do CEP
			endereco_cep: "",
			endereco_complemento: "",
			endereco_referencia: "",
		},
		step3: {
			whatsapp: "",
		},
		step4: {
			horarios: [
				{
					dia_semana: "domingo" as const,
					aberto: false,
					horario_abertura: "08:00",
					horario_fechamento: "18:00",
				},
				{
					dia_semana: "segunda" as const,
					aberto: true,
					horario_abertura: "08:00",
					horario_fechamento: "18:00",
				},
				{
					dia_semana: "terca" as const,
					aberto: true,
					horario_abertura: "08:00",
					horario_fechamento: "18:00",
				},
				{
					dia_semana: "quarta" as const,
					aberto: true,
					horario_abertura: "08:00",
					horario_fechamento: "18:00",
				},
				{
					dia_semana: "quinta" as const,
					aberto: true,
					horario_abertura: "08:00",
					horario_fechamento: "18:00",
				},
				{
					dia_semana: "sexta" as const,
					aberto: true,
					horario_abertura: "08:00",
					horario_fechamento: "18:00",
				},
				{
					dia_semana: "sabado" as const,
					aberto: false,
					horario_abertura: "08:00",
					horario_fechamento: "18:00",
				},
			],
		},
		step5: {
			aceita_dinheiro: true,
			aceita_pix: false,
			aceita_cartao_credito: false,
			aceita_cartao_debito: false,
		},
	};

	const formData = ref<OnboardingData>({ ...initialFormData });

	// ========================================
	// COMPUTADAS
	// ========================================

	/**
	 * Verificar se etapa atual é válida
	 */
	const isCurrentStepValid = computed((): boolean => {
		const currentStepNum = navigationComposable.currentStep.value;

		switch (currentStepNum) {
			case 1:
				return validationComposable.validateStep1(formData.value.step1).isValid;
			case 2:
				return validationComposable.validateStep2(formData.value.step2).isValid;
			case 3:
				return validationComposable.validateStep3(formData.value.step3).isValid;
			case 4:
				return validationComposable.validateStep4(formData.value.step4).isValid;
			case 5:
				return validationComposable.validateStep5(formData.value.step5).isValid;
			default:
				return false;
		}
	});

	/**
	 * Verificar se pode avançar
	 */
	const canProceed = computed((): boolean => {
		return isCurrentStepValid.value && !actionsComposable.saving.value;
	});

	/**
	 * Verificar se onboarding está completo
	 */
	const isComplete = computed((): boolean => {
		const step1Valid = validationComposable.validateStep1(formData.value.step1).isValid;
		const step2Valid = validationComposable.validateStep2(formData.value.step2).isValid;
		const step3Valid = validationComposable.validateStep3(formData.value.step3).isValid;
		const step4Valid = validationComposable.validateStep4(formData.value.step4).isValid;
		const step5Valid = validationComposable.validateStep5(formData.value.step5).isValid;

		return (
			navigationComposable.isLastStep.value &&
			step1Valid &&
			step2Valid &&
			step3Valid &&
			step4Valid &&
			step5Valid
		);
	});

	// ========================================
	// HANDLERS
	// ========================================

	/**
	 * Avançar para próxima etapa (com validação e salvamento)
	 */
	const handleNext = async (): Promise<void> => {
		if (!canProceed.value) return;

		const currentStepNum = navigationComposable.currentStep.value;
		let success = false;

		// Salvar dados da etapa atual
		switch (currentStepNum) {
			case 1:
				success = await actionsComposable.saveInfoBasica(formData.value.step1);
				break;
			case 2:
				success = await actionsComposable.saveEndereco(formData.value.step2);
				break;
			case 3:
				success = await actionsComposable.saveContato(formData.value.step3);
				break;
			case 4:
				success = await actionsComposable.saveHorarios(formData.value.step4);
				break;
			case 5:
				// Última etapa - não avança, usa handleComplete
				return;
		}

		if (success) {
			navigationComposable.nextStep();
		}
	};

	/**
	 * Completar onboarding
	 */
	const handleComplete = async (): Promise<void> => {
		if (!isComplete.value) return;

		// Salvar última etapa
		const step5Success = await actionsComposable.savePagamentos(formData.value.step5);
		if (!step5Success) return;

		// Finalizar onboarding
		const finalizeSuccess = await actionsComposable.finalizar();
		if (!finalizeSuccess) return;

		// Atualizar store local
		if (estabelecimentoStore.estabelecimento) {
			estabelecimentoStore.$patch({
				estabelecimento: {
					...estabelecimentoStore.estabelecimento,
					nome: formData.value.step1.nome,
					slug: formData.value.step1.slug,
				},
			});
		}

		// Toast de sucesso
		success({
			title: "Onboarding concluído!",
			description: "Bem-vindo ao WebiDelivery!",
		});

		// Redirecionar para dashboard
		await navigateTo("/admin/dashboard");
	};

	/**
	 * Resetar onboarding
	 */
	const reset = (): void => {
		formData.value = { ...initialFormData };
		navigationComposable.reset();
	};

	// ========================================
	// RETORNO
	// ========================================

	return {
		// Dados do formulário
		formData,

		// Navegação
		currentStep: navigationComposable.currentStep,
		totalSteps: navigationComposable.totalSteps,
		progress: navigationComposable.progress,
		canGoNext: navigationComposable.canGoNext,
		canGoPrev: navigationComposable.canGoPrev,
		isFirstStep: navigationComposable.isFirstStep,
		isLastStep: navigationComposable.isLastStep,

		// Estados
		saving: actionsComposable.saving,
		completing: actionsComposable.completing,
		actionError: actionsComposable.actionError,

		// Validações
		slugValidation: validationComposable.slugValidation,
		isCurrentStepValid,
		canProceed,
		isComplete,

		// Métodos de navegação
		nextStep: navigationComposable.nextStep,
		prevStep: navigationComposable.prevStep,
		goToStep: navigationComposable.goToStep,

		// Métodos de validação
		checkSlugAvailability: validationComposable.checkSlugAvailability,

		// Métodos de ação
		handleNext,
		handleComplete,
		reset,
	};
};
