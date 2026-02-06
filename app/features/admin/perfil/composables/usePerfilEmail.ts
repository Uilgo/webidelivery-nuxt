/**
 * 📌 usePerfilEmail
 *
 * Composable responsável pela alteração de email do usuário.
 * Gerencia validação, confirmação e processo de alteração via Supabase Auth.
 */

import type { FormAlterarEmail, FormState } from "../types/forms";
import { useToast } from "~/composables/ui/useToast";

export const usePerfilEmail = () => {
	const { success, error: showToastError } = useToast();
	const supabase = useSupabaseClient();
	const user = useSupabaseUser();

	// Estado do formulário
	const formState = ref<FormState<FormAlterarEmail>>({
		data: {
			novoEmail: "",
			confirmarEmail: "",
		},
		errors: {},
		loading: false,
		success: false,
	});

	/**
	 * Valida o formato do email
	 */
	const validarEmail = (email: string): boolean => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	/**
	 * Verifica se o email já está em uso
	 */
	const verificarEmailExistente = async (email: string): Promise<boolean> => {
		try {
			const { data } = await supabase
				.from("perfis")
				.select("id")
				.eq("email", email.toLowerCase())
				.single();

			return !!data;
		} catch {
			return false;
		}
	};

	/**
	 * Valida os dados do formulário
	 */
	const validarFormulario = async (): Promise<boolean> => {
		const errors: Record<string, string> = {};
		const { novoEmail, confirmarEmail } = formState.value.data;

		// Validação do novo email
		if (!novoEmail.trim()) {
			errors.novoEmail = "Novo email é obrigatório";
		} else if (!validarEmail(novoEmail)) {
			errors.novoEmail = "Email inválido";
		} else if (novoEmail.toLowerCase() === user.value?.email?.toLowerCase()) {
			errors.novoEmail = "O novo email deve ser diferente do atual";
		} else {
			// Verifica se email já existe
			const emailExiste = await verificarEmailExistente(novoEmail);
			if (emailExiste) {
				errors.novoEmail = "Este email já está em uso";
			}
		}

		// Validação da confirmação
		if (!confirmarEmail.trim()) {
			errors.confirmarEmail = "Confirmação de email é obrigatória";
		} else if (novoEmail !== confirmarEmail) {
			errors.confirmarEmail = "Os emails não coincidem";
		}

		formState.value.errors = errors;
		return Object.keys(errors).length === 0;
	};

	/**
	 * Solicita alteração de email
	 */
	const alterarEmail = async (): Promise<boolean> => {
		if (!user.value?.id) {
			showToastError({ title: "Usuário não autenticado" });
			return false;
		}

		formState.value.loading = true;
		formState.value.success = false;

		try {
			// Valida formulário
			const isValid = await validarFormulario();
			if (!isValid) {
				showToastError({ title: "Corrija os erros no formulário" });
				return false;
			}

			// Solicita alteração via Supabase Auth
			const { error: updateError } = await supabase.auth.updateUser({
				email: formState.value.data.novoEmail.toLowerCase().trim(),
			});

			if (updateError) {
				throw updateError;
			}

			formState.value.success = true;
			formState.value.data = { novoEmail: "", confirmarEmail: "" };

			success({
				title: "Solicitação enviada!",
				description: "Verifique seu novo email para confirmar a alteração.",
			});

			return true;
		} catch (error: unknown) {
			console.error("Erro ao alterar email:", error);

			// Trata erros específicos do Supabase
			if (error instanceof Error) {
				if (error.message.includes("email_address_invalid")) {
					formState.value.errors.novoEmail = "Email inválido";
				} else if (error.message.includes("email_address_not_authorized")) {
					formState.value.errors.novoEmail = "Email não autorizado";
				} else {
					showToastError({
						title: "Erro ao solicitar alteração de email",
						description: error.message,
					});
				}
			} else {
				showToastError({ title: "Erro ao solicitar alteração de email" });
			}

			return false;
		} finally {
			formState.value.loading = false;
		}
	};

	/**
	 * Limpa os erros de um campo específico
	 */
	const limparErro = (campo: keyof FormAlterarEmail) => {
		if (formState.value.errors[campo]) {
			formState.value.errors[campo] = undefined;
		}
	};

	/**
	 * Reseta o estado do formulário
	 */
	const resetarFormulario = () => {
		formState.value.data = { novoEmail: "", confirmarEmail: "" };
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
		alterarEmail,
		limparErro,
		resetarFormulario,
	};
};
