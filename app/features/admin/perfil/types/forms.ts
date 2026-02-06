/**
 * 📌 Tipos para formulários do módulo de perfil
 *
 * Define as interfaces para os formulários: dados pessoais, email e senha.
 * Apenas o essencial - sem preferências ou outras configurações.
 */

// ========================================
// FORMULÁRIO DE DADOS PESSOAIS
// ========================================

export interface FormDadosPessoais {
	nome: string;
	sobrenome: string;
}

// ========================================
// FORMULÁRIO DE ALTERAÇÃO DE EMAIL
// ========================================

export interface FormAlterarEmail {
	novoEmail: string;
	confirmarEmail: string;
}

// ========================================
// FORMULÁRIO DE ALTERAÇÃO DE SENHA
// ========================================

export interface FormAlterarSenha {
	senhaAtual: string;
	novaSenha: string;
	confirmarSenha: string;
}

// ========================================
// TIPOS PARA VALIDAÇÃO DE FORMULÁRIOS
// ========================================

export type FormErrors<T> = {
	[K in keyof T]?: string;
};

export interface FormState<T> {
	data: T;
	errors: FormErrors<T>;
	loading: boolean;
	success: boolean;
}
