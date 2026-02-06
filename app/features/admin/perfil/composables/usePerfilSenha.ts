/**
 * 📌 usePerfilSenha
 *
 * Composable responsável pela alteração de senha do usuário.
 * Gerencia validação, submissão via Supabase Auth e feedback para o usuário.
 */

import type { FormAlterarSenha, FormState } from "../types/forms";
import { useToast } from "~/composables/ui/useToast";

export const usePerfilSenha = () => {
	const { success, error: showToastError } = useToast();
	const supabase = useSupabaseClient();

	// Estado do formulário
	const formState = ref<FormState<FormAlterarSenha>>({
		data: {
			senhaAtual: "",
			novaSenha: "",
			confirmarSenha: "",
		},
		errors: {},
		loading: false,
		success: false,
	});

	/**
	 * Valida a força da senha
	 */
	const validarForcaSenha = (senha: string): boolean => {
		// Mínimo 8 caracteres, pelo menos 1 letra, 1 número e 1 símbolo
		const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
		return regex.test(senha);
	};

	/**
	 * Valida os dados do formulário
	 */
	const validarFormulario = (): boolean => {
		const errors: Record<string, string> = {};
		const { senhaAtual, novaSenha, confirmarSenha } = formState.value.data;

		// Validação da senha atual
		if (!senhaAtual.trim()) {
			errors.senhaAtual = "Senha atual é obrigatória";
		}

		// Validação da nova senha
		if (!novaSenha.trim()) {
			errors.novaSenha = "Nova senha é obrigatória";
		} else if (novaSenha.length < 8) {
			errors.novaSenha = "Nova senha deve ter pelo menos 8 caracteres";
		} else if (!validarForcaSenha(novaSenha)) {
			errors.novaSenha = "Nova senha deve conter letra, número e símbolo";
		} else if (novaSenha === senhaAtual) {
			errors.novaSenha = "A nova senha deve ser diferente da atual";
		}

		// Validação da confirmação
		if (!confirmarSenha.trim()) {
			errors.confirmarSenha = "Confirmação de senha é obrigatória";
		} else if (novaSenha !== confirmarSenha) {
			errors.confirmarSenha = "As senhas não coincidem";
		}

		formState.value.errors = errors;
		return Object.keys(errors).length === 0;
	};

	/**
	 * Altera a senha do usuário
	 */
	const alterarSenha = async (): Promise<boolean> => {
		if (!validarFormulario()) {
			showToastError({ title: "Corrija os erros no formulário" });
			return false;
		}

		formState.value.loading = true;
		formState.value.success = false;

		try {
			// Usa Supabase Auth para alterar senha
			const { error: updateError } = await supabase.auth.updateUser({
				password: formState.value.data.novaSenha,
			});

			if (updateError) {
				throw updateError;
			}

			formState.value.success = true;
			formState.value.data = { senhaAtual: "", novaSenha: "", confirmarSenha: "" };

			success({ title: "Senha alterada com sucesso!" });

			return true;
		} catch (error: unknown) {
			console.error("Erro ao alterar senha:", error);

			// Trata erros específicos do Supabase
			if (error instanceof Error) {
				if (error.message.includes("Invalid login credentials")) {
					formState.value.errors.senhaAtual = "Senha atual incorreta";
				} else if (error.message.includes("Password should be at least")) {
					formState.value.errors.novaSenha = "Senha não atende aos critérios mínimos";
				} else {
					showToastError({ title: "Erro ao alterar senha", description: error.message });
				}
			} else {
				showToastError({ title: "Erro ao alterar senha" });
			}

			return false;
		} finally {
			formState.value.loading = false;
		}
	};

	/**
	 * Limpa os erros de um campo específico
	 */
	const limparErro = (campo: keyof FormAlterarSenha) => {
		if (formState.value.errors[campo]) {
			formState.value.errors[campo] = undefined;
		}
	};

	/**
	 * Reseta o estado do formulário
	 */
	const resetarFormulario = () => {
		formState.value.data = { senhaAtual: "", novaSenha: "", confirmarSenha: "" };
		formState.value.errors = {};
		formState.value.success = false;
	};

	return {
		// Estado
		formState,

		// Computed
		loading: computed(() => formState.value.loading),
		errors: computed(() => formState.value.errors),
		hasErrors: computed(() => Object.keys(formState.value.errors).length > 0),

		// Métodos
		alterarSenha,
		limparErro,
		resetarFormulario,
	};
};
