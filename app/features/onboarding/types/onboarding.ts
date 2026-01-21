/**
 * 📌 Tipos do Onboarding
 *
 * Tipos específicos para o fluxo de onboarding do estabelecimento.
 * Usa os tipos do banco de dados e schemas de validação existentes.
 */

import type {
	OnboardingInfoBasicaFormData,
	OnboardingEnderecoFormData,
	OnboardingContatoFormData,
	OnboardingHorariosFormData,
	OnboardingPagamentosFormData,
} from "#shared/schemas/estabelecimento";

import type { HorarioFuncionamento, DiaSemana } from "#shared/types/estabelecimentos";

// Re-exportar tipos do banco para uso externo
export type { HorarioFuncionamento, DiaSemana };

// Criar aliases para manter compatibilidade
export type Step1InfoBasica = OnboardingInfoBasicaFormData;
export type Step2Endereco = OnboardingEnderecoFormData;
export type Step3Contato = OnboardingContatoFormData;
export type Step4Horarios = OnboardingHorariosFormData;
export type Step5Pagamentos = OnboardingPagamentosFormData;

// ========================================
// TIPOS PARA VALIDAÇÃO DE SLUG
// ========================================

export interface SlugValidation {
	isValid: boolean;
	isChecking: boolean;
	message: string;
	available: boolean;
}

// ========================================
// TIPO PRINCIPAL DO ONBOARDING
// ========================================

/**
 * Dados completos do onboarding usando tipos dos schemas
 */
export interface OnboardingData {
	step1: Step1InfoBasica;
	step2: Step2Endereco;
	step3: Step3Contato;
	step4: Step4Horarios;
	step5: Step5Pagamentos;
}

// ========================================
// TIPOS PARA NAVEGAÇÃO
// ========================================

export interface OnboardingStep {
	number: number;
	title: string;
	description: string;
	completed: boolean;
	current: boolean;
}

export interface OnboardingProgress {
	currentStep: number;
	totalSteps: number;
	completedSteps: number;
	percentage: number;
}

// ========================================
// ESTADO DO ONBOARDING
// ========================================

export interface OnboardingState {
	currentStep: number;
	isLoading: boolean;
	isCompleting: boolean;
	formData: OnboardingData;
}

// ========================================
// DADOS PARA ATUALIZAÇÃO NO BANCO
// ========================================

export interface EstabelecimentoUpdate {
	// Campos diretos da tabela
	nome?: string;
	slug?: string;
	descricao?: string;
	whatsapp?: string;
	endereco_rua?: string;
	endereco_numero?: string;
	endereco_bairro?: string;
	endereco_cidade?: string;
	endereco_estado?: string;
	endereco_cep?: string;
	endereco_complemento?: string;
	endereco_referencia?: string;

	// Campos JSON
	config_geral?: Record<string, unknown>;
	config_pagamento?: Record<string, unknown>;
	config_tema?: Record<string, unknown>;
	setup_status?: Record<string, unknown>;

	// Flag de conclusão
	onboarding?: boolean;
}
