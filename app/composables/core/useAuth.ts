/**
 * 📌 useAuth
 *
 * Composable central para autenticação usando Supabase.
 * Contém funções para login, logout e signup seguindo o fluxo PKCE.
 *
 * IMPORTANTE:
 * - super_admin já existe no banco (único)
 * - Cadastros disponíveis: gerente_plataforma, admin, gerente, staff, entregador
 * - Integra com trigger fn_trig_auth_criar_perfil_e_estabelecimento
 * - Usa funções RPC para validação (fn_rpc_verificar_email_disponivel, fn_rpc_validar_codigo_convite)
 */

import type {
	LoginFormData,
	RegisterFormData,
	SuperAdminLoginFormData,
	SuperAdminRegisterFormData,
	TeamMemberRegisterFormData,
} from "#shared/schemas/auth";
import { useUserStore } from "~/stores/user";
import { clearAllCache } from "../../../lib/utils/cache";

// ========================================
// TIPOS E INTERFACES
// ========================================

interface AuthError {
	message: string;
	code?: string;
}

interface AuthResponse {
	success: boolean;
	error?: AuthError;
	data?: unknown;
}

// ========================================
// COMPOSABLE PRINCIPAL
// ========================================

export const useAuth = () => {
	const supabase = useSupabaseClient();
	const user = useSupabaseUser();
	const userStore = useUserStore();

	// ========================================
	// FUNÇÃO DE LOGIN
	// ========================================

	/**
	 * Login com email e senha
	 * CRÍTICO: Limpa cache antes de fazer login para evitar dados de sessão anterior
	 */
	const login = async (
		credentials: LoginFormData | SuperAdminLoginFormData,
	): Promise<AuthResponse> => {
		try {
			// 🔒 SEGURANÇA: Limpar cache ANTES do login
			clearAllCache();

			const { data, error } = await supabase.auth.signInWithPassword({
				email: credentials.email,
				password: credentials.password,
			});

			if (error) {
				return {
					success: false,
					error: {
						message: getAuthErrorMessage(error.message),
						code: error.message,
					},
				};
			}

			return {
				success: true,
				data: data.user,
			};
		} catch {
			return {
				success: false,
				error: {
					message: "Erro inesperado ao fazer login. Tente novamente.",
				},
			};
		}
	};

	// ========================================
	// FUNÇÃO DE LOGOUT
	// ========================================

	/**
	 * Logout do usuário atual
	 * CRÍTICO: Limpa TODO o cache para evitar vazamento de dados entre usuários
	 */
	const logout = async (): Promise<AuthResponse> => {
		try {
			const { error } = await supabase.auth.signOut();

			if (error) {
				return {
					success: false,
					error: {
						message: "Erro ao fazer logout. Tente novamente.",
						code: error.message,
					},
				};
			}

			// 🔒 SEGURANÇA: Limpar TODO o cache
			clearAllCache();

			// Limpar store de usuário
			userStore.clearUser();

			// Limpar estados globais do Nuxt (incluindo dashboard)
			if (import.meta.client) {
				clearNuxtState([
					// Cardápio
					"produtos",
					"categorias",
					"adicionais",
					"grupos_adicionais",
					"combos",
					// Pedidos
					"pedidos",
					"admin-pedidos",
					"admin-pedidos-loading",
					"admin-pedidos-erro",
					"admin-pedidos-cache-loaded",
					// Dashboard
					"admin-dashboard-kpis",
					"admin-dashboard-charts",
					"admin-dashboard-realtime",
					"admin-dashboard-loading",
					"admin-dashboard-cache-loaded",
					"admin-dashboard-initialized",
				]);
			}

			// Redirecionar para login após logout
			await navigateTo("/login");

			return {
				success: true,
			};
		} catch {
			return {
				success: false,
				error: {
					message: "Erro inesperado ao fazer logout.",
				},
			};
		}
	};

	// ========================================
	// FUNÇÕES DE SIGNUP
	// ========================================

	/**
	 * Cadastro de estabelecimento (admin)
	 */
	const signupEstablishment = async (data: RegisterFormData): Promise<AuthResponse> => {
		try {
			const { data: authData, error } = await supabase.auth.signUp({
				email: data.email,
				password: data.password,
				options: {
					data: {
						full_name: `${data.nome} ${data.sobrenome}`,
						signup_type: "admin", // Trigger espera "admin", não "estabelecimento"
					},
				},
			});

			if (error) {
				return {
					success: false,
					error: {
						message: getAuthErrorMessage(error.message),
						code: error.message,
					},
				};
			}

			return {
				success: true,
				data: authData.user,
			};
		} catch {
			return {
				success: false,
				error: {
					message: "Erro inesperado ao criar conta. Tente novamente.",
				},
			};
		}
	};

	/**
	 * Cadastro de gerente da plataforma (apenas gerente_plataforma, não super_admin)
	 */
	const signupSuperAdmin = async (data: SuperAdminRegisterFormData): Promise<AuthResponse> => {
		try {
			const { data: authData, error } = await supabase.auth.signUp({
				email: data.email,
				password: data.password,
				options: {
					data: {
						full_name: `${data.nome} ${data.sobrenome}`,
						signup_type: "gerente_plataforma",
						codigo_convite: data.codigo_webi, // Trigger espera "codigo_convite"
					},
				},
			});

			if (error) {
				return {
					success: false,
					error: {
						message: getAuthErrorMessage(error.message),
						code: error.message,
					},
				};
			}

			return {
				success: true,
				data: authData.user,
			};
		} catch {
			return {
				success: false,
				error: {
					message: "Erro inesperado ao criar conta na plataforma. Tente novamente.",
				},
			};
		}
	};

	/**
	 * Cadastro de membro da equipe
	 */
	const signupTeamMember = async (data: TeamMemberRegisterFormData): Promise<AuthResponse> => {
		try {
			const { data: authData, error } = await supabase.auth.signUp({
				email: data.email,
				password: data.password,
				options: {
					data: {
						full_name: `${data.nome} ${data.sobrenome}`,
						signup_type: "membro_equipe", // Trigger espera "membro_equipe"
						codigo_convite: data.codigo_equipe, // Trigger espera "codigo_convite"
					},
				},
			});

			if (error) {
				return {
					success: false,
					error: {
						message: getAuthErrorMessage(error.message),
						code: error.message,
					},
				};
			}

			return {
				success: true,
				data: authData.user,
			};
		} catch {
			return {
				success: false,
				error: {
					message: "Erro inesperado ao entrar na equipe. Tente novamente.",
				},
			};
		}
	};

	// ========================================
	// FUNÇÕES UTILITÁRIAS
	// ========================================

	/**
	 * Converte mensagens de erro do Supabase para português
	 */
	const getAuthErrorMessage = (errorMessage: string): string => {
		const errorMap: Record<string, string> = {
			"Invalid login credentials": "E-mail ou senha incorretos",
			"Email not confirmed": "E-mail não confirmado. Verifique sua caixa de entrada",
			"User already registered": "Já existe uma conta com este e-mail",
			"Password should be at least 6 characters": "A senha deve ter pelo menos 6 caracteres",
			"Unable to validate email address: invalid format": "Formato de e-mail inválido",
			"Email rate limit exceeded": "Muitas tentativas. Tente novamente em alguns minutos",
			"Signup is disabled": "Cadastro desabilitado temporariamente",
			"Invalid email or password": "E-mail ou senha inválidos",
			"Email address not authorized": "E-mail não autorizado",
			"User not found": "Usuário não encontrado",
		};

		return errorMap[errorMessage] || "Erro de autenticação. Tente novamente.";
	};

	/**
	 * Verifica se o usuário está autenticado
	 */
	const isAuthenticated = computed(() => !!user.value);

	/**
	 * Obtém dados do usuário atual
	 */
	const getCurrentUser = () => user.value;

	// ========================================
	// RETORNO DO COMPOSABLE
	// ========================================

	return {
		// Estados
		user: readonly(user),
		isAuthenticated,

		// Funções principais
		login,
		logout,
		signupEstablishment,
		signupSuperAdmin,
		signupTeamMember,

		// Utilitários
		getCurrentUser,
		getAuthErrorMessage,
	};
};
