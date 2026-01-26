/**
 * 📌 usePerfilUpdate
 *
 * Composable responsável por atualizar os dados pessoais do perfil.
 * Gerencia validação, submissão via RPC e feedback para o usuário.
 * Usa a função RPC existente fn_rpc_equipe_atualizar_membro.
 */

import type { FormDadosPessoais, FormState } from "../types/forms";
import { useToast } from "~/composables/ui/useToast";

export const usePerfilUpdate = () => {
	const { success, error: showToastError } = useToast();

	// Estado do formulário
	const formState = ref<FormState<FormDadosPessoais>>({
		data: {
			nome: "",
			sobrenome: "",
		},
		errors: {},
		loading: false,
		success: false,
	});

	/**
	 * Inicializa o formulário com os dados atuais do perfil
	 */
	const inicializarFormulario = (perfil: { nome?: string; sobrenome?: string } | null) => {
		if (!perfil) return;
		formState.value.data = {
			nome: perfil.nome || "",
			sobrenome: perfil.sobrenome || "",
		};
		formState.value.errors = {};
		formState.value.success = false;
	};

	/**
	 * Valida os dados do formulário
	 */
	const validarFormulario = (): boolean => {
		const errors: Record<string, string> = {};

		// Validação do nome
		if (!formState.value.data.nome.trim()) {
			errors.nome = "Nome é obrigatório";
		} else if (formState.value.data.nome.trim().length < 2) {
			errors.nome = "Nome deve ter pelo menos 2 caracteres";
		}

		// Validação do sobrenome
		if (!formState.value.data.sobrenome.trim()) {
			errors.sobrenome = "Sobrenome é obrigatório";
		} else if (formState.value.data.sobrenome.trim().length < 2) {
			errors.sobrenome = "Sobrenome deve ter pelo menos 2 caracteres";
		}

		formState.value.errors = errors;
		return Object.keys(errors).length === 0;
	};

	/**
	 * Atualiza os dados pessoais do perfil via API do servidor
	 * Usa o endpoint /api/perfil/atualizar que utiliza Service Role do Supabase
	 */
	const atualizarDadosPessoais = async (): Promise<boolean> => {
		if (!validarFormulario()) {
			showToastError({ title: "Corrija os erros no formulário" });
			return false;
		}

		formState.value.loading = true;
		formState.value.success = false;

		try {
			// Chama a API do servidor para atualizar o perfil
			// Os cookies de autenticação são enviados automaticamente pelo browser
			const response = await $fetch("/api/perfil/atualizar", {
				method: "PUT",
				body: {
					nome: formState.value.data.nome.trim(),
					sobrenome: formState.value.data.sobrenome.trim(),
				},
			});

			if (response?.sucesso) {
				formState.value.success = true;
				success({ title: "Dados pessoais atualizados com sucesso!" });
				return true;
			} else {
				throw new Error("Falha na atualização dos dados");
			}
		} catch (error: unknown) {
			console.error("Erro ao atualizar dados pessoais:", error);
			const message = error instanceof Error ? error.message : "Erro desconhecido";
			showToastError({ title: "Erro ao atualizar dados pessoais", description: message });
			return false;
		} finally {
			formState.value.loading = false;
		}
	};

	/**
	 * Limpa os erros de um campo específico
	 */
	const limparErro = (campo: keyof FormDadosPessoais) => {
		if (formState.value.errors[campo]) {
			formState.value.errors[campo] = undefined;
		}
	};

	/**
	 * Reseta o estado do formulário
	 */
	const resetarFormulario = () => {
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
		inicializarFormulario,
		atualizarDadosPessoais,
		limparErro,
		resetarFormulario,
	};
};
