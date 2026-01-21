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
 */
const callSupabaseRpc = async <T = void>(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	supabase: any,
	functionName: string,
	params?: Record<string, unknown>,
): Promise<{ data: T | null; error: unknown | null }> => {
	try {
		const result = await supabase.rpc(functionName, params);
		return result;
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
	getSchemaForStep: (step: number) => ReturnType<typeof toTypedSchema> | null;
}

export const useOnboardingValidation = (): UseOnboardingValidationReturn => {
	const supabase = useSupabaseClient();

	// Estado da validação de slug
	const slugValidation = ref<SlugValidation>({
		isValid: false,
		isChecking: false,
		message: "",
		available: false,
	});

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

		return { general: "Erro de validação" };
	};

	/**
	 * Validar Etapa 1: Informações Básicas
	 */
	const validateStep1 = (data: unknown): { isValid: boolean; errors: Record<string, string> } => {
		try {
			onboardingInfoBasicaSchema.parse(data);

			// Verificar se slug está disponível
			if (!slugValidation.value.available) {
				return {
					isValid: false,
					errors: { slug: slugValidation.value.message || "Slug não verificado" },
				};
			}

			return { isValid: true, errors: {} };
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
		getSchemaForStep,
	};
};
