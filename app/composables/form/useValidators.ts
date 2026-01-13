/**
 * 📌 useValidators
 *
 * Composable unificado para todas as validações assíncronas do sistema.
 * Integra com Supabase RPC para validação de email único, códigos e slugs.
 */

// ========================================
// TYPE GUARDS
// ========================================

// Type guard para verificar resposta da RPC de email
const isEmailRpcResponse = (data: unknown): data is { disponivel: boolean; erro?: string } => {
	return (
		data !== null &&
		typeof data === "object" &&
		"disponivel" in data &&
		typeof (data as Record<string, unknown>).disponivel === "boolean"
	);
};

// Type guard para verificar resposta da RPC de código
const isCodigoRpcResponse = (
	data: unknown,
): data is { valido: boolean; tipo?: string; erro?: string } => {
	return (
		data !== null &&
		typeof data === "object" &&
		"valido" in data &&
		typeof (data as Record<string, unknown>).valido === "boolean"
	);
};

// Type guard para verificar resposta da RPC de slug
const isSlugRpcResponse = (data: unknown): data is { disponivel: boolean; erro?: string } => {
	return (
		data !== null &&
		typeof data === "object" &&
		"disponivel" in data &&
		typeof (data as Record<string, unknown>).disponivel === "boolean"
	);
};

// ========================================
// COMPOSABLE PRINCIPAL
// ========================================

export const useValidators = () => {
	const supabase = useSupabaseClient();

	// ========================================
	// VALIDADORES DE EMAIL
	// ========================================

	/**
	 * Verifica se um email está disponível para cadastro
	 */
	const validateEmailAvailable = async (email: string): Promise<boolean> => {
		if (!email || email.trim().length === 0) {
			return true; // Deixa validação de required para o schema principal
		}

		try {
			const { data, error } = await supabase.rpc("fn_rpc_verificar_email_disponivel", {
				p_email: email.trim().toLowerCase(),
			});

			if (error) {
				console.error("Erro ao validar email:", error);
				return true; // Em caso de erro, permitir (não bloquear o usuário)
			}

			if (isEmailRpcResponse(data)) {
				return data.disponivel;
			}

			return false;
		} catch (error) {
			console.error("Erro ao validar email:", error);
			return true;
		}
	};

	/**
	 * Obtém mensagem de erro detalhada para email
	 */
	const getEmailValidationMessage = async (email: string): Promise<string | null> => {
		try {
			const { data } = await supabase.rpc("fn_rpc_verificar_email_disponivel", {
				p_email: email.trim().toLowerCase(),
			});

			if (isEmailRpcResponse(data)) {
				return data.disponivel ? null : data.erro || "E-mail não disponível";
			}

			return "E-mail não disponível";
		} catch {
			return "Erro ao verificar e-mail";
		}
	};

	// ========================================
	// VALIDADORES DE CÓDIGO
	// ========================================

	/**
	 * Verifica se um código WEBI é válido
	 */
	const validateCodigoWebi = async (codigo: string): Promise<boolean> => {
		if (!codigo || codigo.trim().length === 0) {
			return true; // Deixa validação de required para o schema principal
		}

		try {
			const { data, error } = await supabase.rpc("fn_rpc_validar_codigo_convite", {
				p_codigo: codigo.trim().toUpperCase(),
			});

			if (error) {
				console.error("Erro ao validar código WEBI:", error);
				return false; // Códigos devem ser validados rigorosamente
			}

			if (isCodigoRpcResponse(data)) {
				// Verificar se é código WEBI (tipo 'webi')
				return data.valido && data.tipo === "webi";
			}

			return false;
		} catch (error) {
			console.error("Erro ao validar código WEBI:", error);
			return false;
		}
	};

	/**
	 * Verifica se um código de equipe é válido
	 */
	const validateCodigoEquipe = async (codigo: string): Promise<boolean> => {
		if (!codigo || codigo.trim().length === 0) {
			return true; // Deixa validação de required para o schema principal
		}

		try {
			const { data, error } = await supabase.rpc("fn_rpc_validar_codigo_convite", {
				p_codigo: codigo.trim().toUpperCase(),
			});

			if (error) {
				console.error("Erro ao validar código de equipe:", error);
				return false;
			}

			if (isCodigoRpcResponse(data)) {
				// Verificar se é código de equipe (tipo 'equipe')
				return data.valido && data.tipo === "equipe";
			}

			return false;
		} catch (error) {
			console.error("Erro ao validar código de equipe:", error);
			return false;
		}
	};

	/**
	 * Obtém detalhes de um código válido (para uso após validação)
	 */
	const getCodigoDetails = async (codigo: string): Promise<Record<string, unknown> | null> => {
		try {
			const { data, error } = await supabase.rpc("fn_rpc_validar_codigo_convite", {
				p_codigo: codigo.trim().toUpperCase(),
			});

			if (error) {
				console.error("Erro ao obter detalhes do código:", error);
				return null;
			}

			if (isCodigoRpcResponse(data) && data.valido) {
				return data as Record<string, unknown>;
			}

			return null;
		} catch (error) {
			console.error("Erro ao obter detalhes do código:", error);
			return null;
		}
	};

	/**
	 * Obtém mensagem de erro detalhada para código
	 */
	const getCodigoValidationMessage = async (codigo: string): Promise<string | null> => {
		try {
			const { data } = await supabase.rpc("fn_rpc_validar_codigo_convite", {
				p_codigo: codigo.trim().toUpperCase(),
			});

			if (isCodigoRpcResponse(data)) {
				return data.valido ? null : data.erro || "Código inválido";
			}

			return "Código inválido";
		} catch {
			return "Erro ao verificar código";
		}
	};

	// ========================================
	// VALIDADORES DE SLUG
	// ========================================

	/**
	 * Verifica se um slug está disponível para estabelecimento
	 */
	const validateSlugAvailable = async (slug: string): Promise<boolean> => {
		if (!slug || slug.trim().length === 0) {
			return true; // Deixa validação de required para o schema principal
		}

		try {
			const { data, error } = await supabase.rpc("fn_rpc_verificar_slug_disponivel", {
				p_slug: slug.trim().toLowerCase(),
			});

			if (error) {
				console.error("Erro ao validar slug:", error);
				return true;
			}

			if (isSlugRpcResponse(data)) {
				return data.disponivel;
			}

			return false;
		} catch (error) {
			console.error("Erro ao validar slug:", error);
			return true;
		}
	};

	/**
	 * Obtém mensagem de erro detalhada para slug
	 */
	const getSlugValidationMessage = async (slug: string): Promise<string | null> => {
		try {
			const { data } = await supabase.rpc("fn_rpc_verificar_slug_disponivel", {
				p_slug: slug.trim().toLowerCase(),
			});

			if (isSlugRpcResponse(data)) {
				return data.disponivel ? null : data.erro || "Slug não disponível";
			}

			return "Slug não disponível";
		} catch {
			return "Erro ao verificar slug";
		}
	};

	// ========================================
	// RETORNO DO COMPOSABLE
	// ========================================

	return {
		// Validadores de email
		validateEmailAvailable,
		getEmailValidationMessage,

		// Validadores de código
		validateCodigoWebi,
		validateCodigoEquipe,
		getCodigoDetails,
		getCodigoValidationMessage,

		// Validadores de slug
		validateSlugAvailable,
		getSlugValidationMessage,
	};
};
