/**
 * 📌 useOnboardingValidation - Validações do Onboarding
 *
 * Responsável por:
 * - Integrar Zod + VeeValidate para validação
 * - Usar schemas existentes do shared/schemas/estabelecimento
 * - Verificar se slug está disponível (fn_rpc_verificar_slug_disponivel)
 * - Fornecer validação em tempo real com VeeValidate
 */

import { toTypedSchema } from "@vee-validate/zod";
import {
	onboardingInfoBasicaSchema,
	onboardingEnderecoSchema,
	onboardingContatoSchema,
	onboardingHorariosSchema,
	onboardingPagamentosSchema,
} from "#shared/schemas/estabelecimento";
import type { SlugValidation } from "../types/onboarding";

/**
 * Wrapper tipado para chamadas RPC do Supabase
 * Evita o uso de 'any' mantendo type safety
 * Type assertion necessária pois o Supabase client tem tipos genéricos complexos
 */
const callSupabaseRpc = async <T = void>(
	supabase: unknown,
	functionName: string,
	params?: Record<string, unknown>,
): Promise<{ data: T | null; error: unknown | null }> => {
	try {
		// Type assertion necessária para compatibilidade com tipos do Supabase
		const client = supabase as ReturnType<typeof useSupabaseClient>;
		const result = await client.rpc(functionName as never, params as never);
		return result as { data: T | null; error: unknown | null };
	} catch (error) {
		return { data: null, error };
	}
};

export interface UseOnboardingValidationReturn {
	// Schemas para VeeValidate
	step1Schema: ReturnType<typeof toTypedSchema>;
	step2Schema: ReturnType<typeof toTypedSchema>;
	step3Schema: ReturnType<typeof toTypedSchema>;
	step4Schema: ReturnType<typeof toTypedSchema>;
	step5Schema: ReturnType<typeof toTypedSchema>;

	// Estado do slug
	slugValidation: Ref<SlugValidation>;

	// Funções de validação
	validateStep1: (data: unknown) => { isValid: boolean; errors: Record<string, string> };
	validateStep2: (data: unknown) => { isValid: boolean; errors: Record<string, string> };
	validateStep3: (data: unknown) => { isValid: boolean; errors: Record<string, string> };
	validateStep4: (data: unknown) => { isValid: boolean; errors: Record<string, string> };
	validateStep5: (data: unknown) => { isValid: boolean; errors: Record<string, string> };

	// Funções
	checkSlugAvailability: (slug: string) => Promise<void>;
	resetSlugValidation: () => void;
	forceResetSlugValidation: () => void;
	getSchemaForStep: (step: number) => ReturnType<typeof toTypedSchema> | null;
}

export const useOnboardingValidation = (): UseOnboardingValidationReturn => {
	const supabase = useSupabaseClient();

	// Estado da validação de slug com persistência
	const SLUG_VALIDATION_KEY = "webidelivery_slug_validation";

	const slugValidationCookie = useCookie<SlugValidation>(SLUG_VALIDATION_KEY, {
		default: () => ({
			isValid: false,
			isChecking: false,
			message: "",
			available: false,
		}),
		maxAge: 60 * 60 * 24 * 7, // 7 dias
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
	});

	const slugValidation = slugValidationCookie;

	// Converter schemas Zod para VeeValidate
	const step1Schema = toTypedSchema(onboardingInfoBasicaSchema);
	const step2Schema = toTypedSchema(onboardingEnderecoSchema);
	const step3Schema = toTypedSchema(onboardingContatoSchema);
	const step4Schema = toTypedSchema(onboardingHorariosSchema);
	const step5Schema = toTypedSchema(onboardingPagamentosSchema);

	/**
	 * Helper para processar erros do Zod
	 */
	const processZodErrors = (error: unknown): Record<string, string> => {
		if (error && typeof error === "object" && "issues" in error) {
			const zodError = error as { issues: Array<{ path: string[]; message: string }> };
			const errors: Record<string, string> = {};

			for (const issue of zodError.issues) {
				const path = issue.path.join(".");
				errors[path] = issue.message;
			}

			return errors;
		}

		// Se não for um erro do Zod, retornar erro genérico
		const errorMessage = error instanceof Error ? error.message : "Erro de validação";
		return { general: errorMessage };
	};

	/**
	 * Validar Etapa 1: Informações Básicas - MANTÉM VALIDAÇÃO ANTERIOR
	 */
	const validateStep1 = (data: unknown): { isValid: boolean; errors: Record<string, string> } => {
		try {
			onboardingInfoBasicaSchema.parse(data);

			// Se slug já foi validado uma vez e está disponível, manter como válido
			// A revalidação será feita apenas no final do onboarding
			if (slugValidation.value.available) {
				return { isValid: true, errors: {} };
			}

			// Se nunca foi validado ou está indisponível, exigir validação
			if (!slugValidation.value.available && slugValidation.value.message) {
				return {
					isValid: false,
					errors: { slug: slugValidation.value.message },
				};
			}

			// Se não tem mensagem, significa que ainda não foi validado
			return {
				isValid: false,
				errors: { slug: "Clique fora do campo para verificar disponibilidade" },
			};
		} catch (error) {
			return { isValid: false, errors: processZodErrors(error) };
		}
	};

	/**
	 * Validar Etapa 2: Endereço
	 */
	const validateStep2 = (data: unknown): { isValid: boolean; errors: Record<string, string> } => {
		try {
			onboardingEnderecoSchema.parse(data);
			return { isValid: true, errors: {} };
		} catch (error) {
			return { isValid: false, errors: processZodErrors(error) };
		}
	};

	/**
	 * Validar Etapa 3: Contato
	 */
	const validateStep3 = (data: unknown): { isValid: boolean; errors: Record<string, string> } => {
		try {
			onboardingContatoSchema.parse(data);
			return { isValid: true, errors: {} };
		} catch (error) {
			return { isValid: false, errors: processZodErrors(error) };
		}
	};

	/**
	 * Validar Etapa 4: Horários
	 */
	const validateStep4 = (data: unknown): { isValid: boolean; errors: Record<string, string> } => {
		try {
			onboardingHorariosSchema.parse(data);
			return { isValid: true, errors: {} };
		} catch (error) {
			return { isValid: false, errors: processZodErrors(error) };
		}
	};

	/**
	 * Validar Etapa 5: Pagamentos
	 */
	const validateStep5 = (data: unknown): { isValid: boolean; errors: Record<string, string> } => {
		try {
			onboardingPagamentosSchema.parse(data);
			return { isValid: true, errors: {} };
		} catch (error) {
			return { isValid: false, errors: processZodErrors(error) };
		}
	};

	/**
	 * Verificar disponibilidade do slug via RPC
	 */
	const checkSlugAvailability = async (slug: string): Promise<void> => {
		if (!slug?.trim()) {
			slugValidation.value = {
				isValid: false,
				isChecking: false,
				message: "Slug é obrigatório",
				available: false,
			};
			return;
		}

		// Validação básica do formato (será validada pelo schema também)
		const slugRegex = /^[a-z0-9-]{3,50}$/;
		if (!slugRegex.test(slug)) {
			slugValidation.value = {
				isValid: false,
				isChecking: false,
				message: "Slug deve ter 3-50 caracteres, apenas letras minúsculas, números e hífens",
				available: false,
			};
			return;
		}

		slugValidation.value.isChecking = true;

		try {
			// Chamada RPC tipada para verificar disponibilidade do slug
			const { data, error } = await callSupabaseRpc<boolean>(
				supabase,
				"fn_rpc_verificar_slug_disponivel",
				{
					p_slug: slug,
				},
			);

			if (error) {
				throw error;
			}

			const available = data as boolean;

			slugValidation.value = {
				isValid: available,
				isChecking: false,
				message: available ? "Slug disponível ✅" : "Slug já está em uso ❌",
				available,
			};
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao verificar slug";
			console.error("[useOnboardingValidation] Erro ao verificar slug:", message);

			slugValidation.value = {
				isValid: false,
				isChecking: false,
				message: "Erro ao verificar disponibilidade",
				available: false,
			};
		}
	};

	/**
	 * Resetar validação do slug - APENAS se não estiver validado com sucesso
	 */
	const resetSlugValidation = (): void => {
		// Só resetar se não estiver validado com sucesso
		// Isso mantém o estado ✅ durante a navegação
		if (!slugValidation.value.available) {
			slugValidation.value = {
				isValid: false,
				isChecking: false,
				message: "",
				available: false,
			};
		}
	};

	/**
	 * Forçar reset da validação do slug - SEMPRE limpa (para erros finais)
	 */
	const forceResetSlugValidation = (): void => {
		slugValidation.value = {
			isValid: false,
			isChecking: false,
			message: "",
			available: false,
		};
	};

	/**
	 * Obter schema para uma etapa específica
	 */
	const getSchemaForStep = (step: number): ReturnType<typeof toTypedSchema> | null => {
		switch (step) {
			case 1:
				return step1Schema;
			case 2:
				return step2Schema;
			case 3:
				return step3Schema;
			case 4:
				return step4Schema;
			case 5:
				return step5Schema;
			default:
				return null;
		}
	};

	return {
		// Schemas para VeeValidate
		step1Schema,
		step2Schema,
		step3Schema,
		step4Schema,
		step5Schema,

		// Estado do slug
		slugValidation,

		// Funções de validação
		validateStep1,
		validateStep2,
		validateStep3,
		validateStep4,
		validateStep5,

		// Funções
		checkSlugAvailability,
		resetSlugValidation,
		forceResetSlugValidation,
		getSchemaForStep,
	};
};
