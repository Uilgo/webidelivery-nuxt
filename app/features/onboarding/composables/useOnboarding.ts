/**
 * 📌 useOnboarding - Composable Orquestrador do Onboarding
 *
 * Unifica todos os composables de onboarding em uma API única:
 * - useOnboardingNavigation (navegação entre etapas)
 * - useOnboardingActions (ações RPC)
 * - useOnboardingValidation (validações)
 */

import type { OnboardingData } from "../types/onboarding";
import type { HorarioFuncionamento } from "#shared/types/estabelecimentos";
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
	resetSlugValidation: () => void;

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
	// DADOS DO FORMULÁRIO COM PERSISTÊNCIA
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
			cidades_atendidas: [],
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
					periodos: [],
				},
				{
					dia_semana: "segunda" as const,
					aberto: true,
					periodos: [
						{
							id: "periodo_inicial_segunda",
							horario_abertura: "08:00",
							horario_fechamento: "18:00",
						},
					],
				},
				{
					dia_semana: "terca" as const,
					aberto: true,
					periodos: [
						{
							id: "periodo_inicial_terca",
							horario_abertura: "08:00",
							horario_fechamento: "18:00",
						},
					],
				},
				{
					dia_semana: "quarta" as const,
					aberto: true,
					periodos: [
						{
							id: "periodo_inicial_quarta",
							horario_abertura: "08:00",
							horario_fechamento: "18:00",
						},
					],
				},
				{
					dia_semana: "quinta" as const,
					aberto: true,
					periodos: [
						{
							id: "periodo_inicial_quinta",
							horario_abertura: "08:00",
							horario_fechamento: "18:00",
						},
					],
				},
				{
					dia_semana: "sexta" as const,
					aberto: true,
					periodos: [
						{
							id: "periodo_inicial_sexta",
							horario_abertura: "08:00",
							horario_fechamento: "18:00",
						},
					],
				},
				{
					dia_semana: "sabado" as const,
					aberto: false,
					periodos: [],
				},
			] satisfies HorarioFuncionamento[],
		},
		step5: {
			aceita_dinheiro: true,
			aceita_pix: false,
			aceita_cartao_credito: false,
			aceita_cartao_debito: false,
		},
	};

	// Usar cookies para persistência SSR (sem piscada)
	const COOKIE_KEY = "webidelivery_onboarding_data";

	// Carregar dados do cookie (funciona no servidor)
	const cookieData = useCookie<OnboardingData>(COOKIE_KEY, {
		default: () => ({ ...initialFormData }),
		maxAge: 60 * 60 * 24 * 7, // 7 dias
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
	});

	// Usar dados do cookie como formData, mas garantir que step4 tenha a estrutura correta
	const formData = computed({
		get: () => {
			const data = cookieData.value;

			// Garantir que step4.horarios tenha a estrutura correta com periodos (SEM MUTAR O ORIGINAL)
			if (data.step4?.horarios) {
				const horariosCorrigidos = data.step4.horarios.map((horario) => {
					// Se não tem periodos mas tem horario_abertura/fechamento, converter
					if (!horario.periodos && horario.horario_abertura && horario.horario_fechamento) {
						return {
							...horario,
							periodos: [
								{
									id: `periodo_${horario.dia_semana}_${Date.now()}`,
									horario_abertura: horario.horario_abertura,
									horario_fechamento: horario.horario_fechamento,
								},
							],
						};
					}
					// Se não tem periodos e está aberto, usar dados iniciais
					if (!horario.periodos && horario.aberto) {
						const horarioInicial = initialFormData.step4.horarios.find(
							(h) => h.dia_semana === horario.dia_semana,
						);
						if (horarioInicial?.periodos) {
							return {
								...horario,
								periodos: horarioInicial.periodos,
							};
						}
					}
					// Garantir que periodos seja sempre um array
					return {
						...horario,
						periodos: horario.periodos || [],
					};
				});

				// Retornar nova estrutura SEM mutar o original
				return {
					...data,
					step4: {
						...data.step4,
						horarios: horariosCorrigidos,
					},
				};
			}

			return data;
		},
		set: (value) => {
			cookieData.value = value;
		},
	});

	// Função para limpar dados do cookie
	const clearFormData = (): void => {
		formData.value = { ...initialFormData };
	};

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
	 * Avançar para próxima etapa (APENAS localStorage - SEM salvar no banco)
	 */
	const handleNext = async (): Promise<void> => {
		if (!canProceed.value) return;

		// Apenas navegar para próxima etapa
		// Os dados já estão sendo salvos automaticamente no localStorage
		navigationComposable.nextStep();
	};

	/**
	 * Completar onboarding - SALVAR TUDO NO BANCO COM REVALIDAÇÃO FINAL
	 */
	const handleComplete = async (): Promise<void> => {
		if (!isComplete.value) return;

		// REVALIDAÇÃO FINAL DO SLUG antes de salvar tudo
		try {
			await validationComposable.checkSlugAvailability(formData.value.step1.slug);

			// Se chegou aqui, slug está disponível - verificar se validação passou
			if (!validationComposable.slugValidation.value.available) {
				// Slug não está disponível - forçar reset e voltar para Step 1 com erro
				validationComposable.forceResetSlugValidation();
				navigationComposable.goToStep(1);
				actionsComposable.setError(
					`O slug "${formData.value.step1.slug}" já está em uso. Escolha outro.`,
				);
				return;
			}
		} catch (err) {
			// Erro na verificação - forçar reset e voltar para Step 1
			validationComposable.forceResetSlugValidation();
			navigationComposable.goToStep(1);
			const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
			actionsComposable.setError(`Erro ao verificar slug: ${errorMessage}`);
			return;
		}

		// Slug OK - prosseguir com salvamento completo
		const step1Success = await actionsComposable.saveInfoBasica(formData.value.step1);
		if (!step1Success) {
			// Se falhou no Step 1, voltar para lá
			navigationComposable.goToStep(1);
			return;
		}

		const step2Success = await actionsComposable.saveEndereco(formData.value.step2);
		if (!step2Success) {
			navigationComposable.goToStep(2);
			return;
		}

		const step3Success = await actionsComposable.saveContato(formData.value.step3);
		if (!step3Success) {
			navigationComposable.goToStep(3);
			return;
		}

		const step4Success = await actionsComposable.saveHorarios(formData.value.step4);
		if (!step4Success) {
			navigationComposable.goToStep(4);
			return;
		}

		const step5Success = await actionsComposable.savePagamentos(formData.value.step5);
		if (!step5Success) {
			navigationComposable.goToStep(5);
			return;
		}

		// Finalizar onboarding
		const finalizeSuccess = await actionsComposable.finalizar();
		if (!finalizeSuccess) return;

		// Atualizar store local com dados completos + status do onboarding
		estabelecimentoStore.$patch((state) => {
			if (state.estabelecimento) {
				state.estabelecimento.nome = formData.value.step1.nome;
				state.estabelecimento.slug = formData.value.step1.slug;
				state.estabelecimento.onboarding = true; // ✅ MARCAR ONBOARDING COMO CONCLUÍDO
			}
		});

		// Limpar dados do localStorage após conclusão bem-sucedida
		clearFormData();

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
		clearFormData(); // Limpar localStorage
		validationComposable.resetSlugValidation(); // Limpar validação do slug
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
		resetSlugValidation: validationComposable.resetSlugValidation,

		// Métodos de ação
		handleNext,
		handleComplete,
		reset,
	};
};
