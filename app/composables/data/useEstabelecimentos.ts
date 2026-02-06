/**
 * 📌 useEstabelecimentos
 *
 * Composable para gerenciar dados da tabela `estabelecimentos`.
 * READ: Queries diretas (protegidas por RLS)
 * CUD: Funções RPC (com validações de permissão)
 */

import type { Estabelecimento } from "#shared/types/estabelecimentos";
import type { UUID, EstabelecimentoStatus } from "#shared/types/database";

// ========================================
// TIPOS DO COMPOSABLE
// ========================================

interface EstabelecimentoUpdateData {
	nome?: string;
	slug?: string;
	descricao?: string;
	whatsapp?: string;
	logo_url?: string;
	logo_url_dark?: string;
	capa_url?: string;
	foto_capa_url?: string;
	cor_fundo?: string;
	endereco_rua?: string;
	endereco_numero?: string;
	endereco_bairro?: string;
	endereco_cidade?: string;
	endereco_estado?: string;
	endereco_cep?: string;
	endereco_complemento?: string;
	endereco_referencia?: string;
	config_tema?: Record<string, unknown>;
	config_geral?: Record<string, unknown>;
	config_pagamento?: Record<string, unknown>;
}

interface OnboardingInfoBasica {
	nome: string;
	slug: string;
	descricao?: string;
}

interface OnboardingEndereco {
	endereco_rua: string;
	endereco_numero: string;
	endereco_bairro: string;
	endereco_cidade: string;
	endereco_estado: string;
	endereco_cep: string;
	endereco_complemento?: string;
	endereco_referencia?: string;
}

interface OnboardingContato {
	whatsapp: string;
}

interface OnboardingHorarios {
	horarios: Record<string, unknown>;
}

interface OnboardingPagamentos {
	metodos_pagamento: Record<string, unknown>;
}

// ========================================
// COMPOSABLE PRINCIPAL
// ========================================

export const useEstabelecimentos = () => {
	const supabase = useSupabaseClient();

	// ========================================
	// READ - QUERIES DIRETAS (RLS)
	// ========================================

	/**
	 * Busca o estabelecimento do usuário logado
	 */
	const getCurrentEstablishment = async (): Promise<Estabelecimento | null> => {
		try {
			// Buscar estabelecimento através do perfil do usuário
			const { data: userProfile, error: profileError } = await supabase
				.from("perfis")
				.select("estabelecimento_id")
				.single();

			if (profileError || !userProfile?.estabelecimento_id) {
				console.error("Erro ao buscar perfil do usuário:", profileError);
				return null;
			}

			// Buscar dados do estabelecimento
			const { data, error } = await supabase
				.from("estabelecimentos")
				.select("*")
				.eq("id", userProfile.estabelecimento_id)
				.single();

			if (error) {
				console.error("Erro ao buscar estabelecimento atual:", error);
				return null;
			}

			return data as Estabelecimento;
		} catch (error) {
			console.error("Erro inesperado ao buscar estabelecimento:", error);
			return null;
		}
	};

	/**
	 * Busca estabelecimento por ID (para super admin)
	 */
	const getEstablishmentById = async (id: UUID): Promise<Estabelecimento | null> => {
		try {
			const { data, error } = await supabase
				.from("estabelecimentos")
				.select("*")
				.eq("id", id)
				.single();

			if (error) {
				console.error("Erro ao buscar estabelecimento por ID:", error);
				return null;
			}

			return data as Estabelecimento;
		} catch (error) {
			console.error("Erro inesperado ao buscar estabelecimento por ID:", error);
			return null;
		}
	};

	/**
	 * Busca estabelecimento por slug (público)
	 */
	const getEstablishmentBySlug = async (slug: string): Promise<Estabelecimento | null> => {
		try {
			const { data, error } = await supabase
				.from("estabelecimentos")
				.select("*")
				.eq("slug", slug)
				.eq("status", "ativo")
				.single();

			if (error) {
				console.error("Erro ao buscar estabelecimento por slug:", error);
				return null;
			}

			return data as Estabelecimento;
		} catch (error) {
			console.error("Erro inesperado ao buscar estabelecimento por slug:", error);
			return null;
		}
	};

	/**
	 * Lista todos os estabelecimentos (para super admin)
	 */
	const listEstablishments = async (filters?: {
		status?: EstabelecimentoStatus;
		search?: string;
	}): Promise<Estabelecimento[]> => {
		try {
			let query = supabase.from("estabelecimentos").select("*");

			if (filters?.status) {
				query = query.eq("status", filters.status);
			}

			if (filters?.search) {
				query = query.or(`nome.ilike.%${filters.search}%,slug.ilike.%${filters.search}%`);
			}

			query = query.order("created_at", { ascending: false });

			const { data, error } = await query;

			if (error) {
				console.error("Erro ao listar estabelecimentos:", error);
				return [];
			}

			return data as Estabelecimento[];
		} catch (error) {
			console.error("Erro inesperado ao listar estabelecimentos:", error);
			return [];
		}
	};

	// ========================================
	// UPDATE - FUNÇÕES RPC
	// ========================================

	/**
	 * Atualiza dados do estabelecimento via RPC
	 */
	const updateEstablishment = async (
		updates: EstabelecimentoUpdateData,
		establishmentId?: UUID,
	): Promise<{ success: boolean; message?: string }> => {
		try {
			const dados = establishmentId ? { ...updates, id: establishmentId } : updates;

			const { error } = await supabase.rpc("fn_rpc_admin_atualizar_estabelecimento", {
				p_dados: dados,
			});

			if (error) {
				console.error("Erro ao atualizar estabelecimento:", error);
				return {
					success: false,
					message: error.message || "Erro ao atualizar estabelecimento",
				};
			}

			return {
				success: true,
				message: "Estabelecimento atualizado com sucesso",
			};
		} catch (error) {
			console.error("Erro inesperado ao atualizar estabelecimento:", error);
			return {
				success: false,
				message: "Erro inesperado ao atualizar estabelecimento",
			};
		}
	};

	/**
	 * Altera status do estabelecimento (admin)
	 */
	const changeEstablishmentStatus = async (
		status: "ativo" | "inativo",
	): Promise<{ success: boolean; message?: string }> => {
		try {
			const { error } = await supabase.rpc("fn_rpc_admin_alterar_status", {
				p_status: status,
			});

			if (error) {
				console.error("Erro ao alterar status:", error);
				return {
					success: false,
					message: error.message || "Erro ao alterar status",
				};
			}

			return {
				success: true,
				message: `Estabelecimento ${status === "ativo" ? "ativado" : "desativado"} com sucesso`,
			};
		} catch (error) {
			console.error("Erro inesperado ao alterar status:", error);
			return {
				success: false,
				message: "Erro inesperado ao alterar status",
			};
		}
	};

	/**
	 * Altera status da loja (aberto/fechado)
	 */
	const toggleStoreStatus = async (
		aberto: boolean,
	): Promise<{ success: boolean; message?: string }> => {
		try {
			const { error } = await supabase.rpc("fn_rpc_admin_alterar_status_loja", {
				p_aberto: aberto,
			});

			if (error) {
				console.error("Erro ao alterar status da loja:", error);
				return {
					success: false,
					message: error.message || "Erro ao alterar status da loja",
				};
			}

			return {
				success: true,
				message: `Loja ${aberto ? "aberta" : "fechada"} com sucesso`,
			};
		} catch (error) {
			console.error("Erro inesperado ao alterar status da loja:", error);
			return {
				success: false,
				message: "Erro inesperado ao alterar status da loja",
			};
		}
	};

	// ========================================
	// SUPER ADMIN - FUNÇÕES RPC
	// ========================================

	/**
	 * Altera status do estabelecimento (super admin)
	 */
	const superAdminChangeStatus = async (
		establishmentId: UUID,
		status: EstabelecimentoStatus,
	): Promise<{ success: boolean; message?: string }> => {
		try {
			const { error } = await supabase.rpc("fn_rpc_super_admin_alterar_status", {
				p_estabelecimento_id: establishmentId,
				p_status: status,
			});

			if (error) {
				console.error("Erro ao alterar status (super admin):", error);
				return {
					success: false,
					message: error.message || "Erro ao alterar status",
				};
			}

			return {
				success: true,
				message: "Status alterado com sucesso",
			};
		} catch (error) {
			console.error("Erro inesperado ao alterar status (super admin):", error);
			return {
				success: false,
				message: "Erro inesperado ao alterar status",
			};
		}
	};

	/**
	 * Exclui estabelecimento (super admin)
	 */
	const superAdminDeleteEstablishment = async (
		establishmentId: UUID,
	): Promise<{ success: boolean; message?: string }> => {
		try {
			const { error } = await supabase.rpc("fn_rpc_super_admin_excluir_estabelecimento", {
				p_estabelecimento_id: establishmentId,
			});

			if (error) {
				console.error("Erro ao excluir estabelecimento:", error);
				return {
					success: false,
					message: error.message || "Erro ao excluir estabelecimento",
				};
			}

			return {
				success: true,
				message: "Estabelecimento excluído com sucesso",
			};
		} catch (error) {
			console.error("Erro inesperado ao excluir estabelecimento:", error);
			return {
				success: false,
				message: "Erro inesperado ao excluir estabelecimento",
			};
		}
	};

	// ========================================
	// ONBOARDING - FUNÇÕES RPC
	// ========================================

	/**
	 * Salva informações básicas do onboarding
	 */
	const saveOnboardingBasicInfo = async (
		data: OnboardingInfoBasica,
	): Promise<{ success: boolean; message?: string }> => {
		try {
			const { error } = await supabase.rpc("fn_rpc_onboarding_salvar_info_basica", {
				p_dados: data,
			});

			if (error) {
				console.error("Erro ao salvar informações básicas:", error);
				return {
					success: false,
					message: error.message || "Erro ao salvar informações básicas",
				};
			}

			return {
				success: true,
				message: "Informações básicas salvas com sucesso",
			};
		} catch (error) {
			console.error("Erro inesperado ao salvar informações básicas:", error);
			return {
				success: false,
				message: "Erro inesperado ao salvar informações básicas",
			};
		}
	};

	/**
	 * Salva endereço do onboarding
	 */
	const saveOnboardingAddress = async (
		data: OnboardingEndereco,
	): Promise<{ success: boolean; message?: string }> => {
		try {
			const { error } = await supabase.rpc("fn_rpc_onboarding_salvar_endereco", {
				p_dados: data,
			});

			if (error) {
				console.error("Erro ao salvar endereço:", error);
				return {
					success: false,
					message: error.message || "Erro ao salvar endereço",
				};
			}

			return {
				success: true,
				message: "Endereço salvo com sucesso",
			};
		} catch (error) {
			console.error("Erro inesperado ao salvar endereço:", error);
			return {
				success: false,
				message: "Erro inesperado ao salvar endereço",
			};
		}
	};

	/**
	 * Salva contato do onboarding
	 */
	const saveOnboardingContact = async (
		data: OnboardingContato,
	): Promise<{ success: boolean; message?: string }> => {
		try {
			const { error } = await supabase.rpc("fn_rpc_onboarding_salvar_contato", {
				p_dados: data,
			});

			if (error) {
				console.error("Erro ao salvar contato:", error);
				return {
					success: false,
					message: error.message || "Erro ao salvar contato",
				};
			}

			return {
				success: true,
				message: "Contato salvo com sucesso",
			};
		} catch (error) {
			console.error("Erro inesperado ao salvar contato:", error);
			return {
				success: false,
				message: "Erro inesperado ao salvar contato",
			};
		}
	};

	/**
	 * Salva horários do onboarding
	 */
	const saveOnboardingSchedule = async (
		data: OnboardingHorarios,
	): Promise<{ success: boolean; message?: string }> => {
		try {
			const { error } = await supabase.rpc("fn_rpc_onboarding_salvar_horarios", {
				p_dados: data,
			});

			if (error) {
				console.error("Erro ao salvar horários:", error);
				return {
					success: false,
					message: error.message || "Erro ao salvar horários",
				};
			}

			return {
				success: true,
				message: "Horários salvos com sucesso",
			};
		} catch (error) {
			console.error("Erro inesperado ao salvar horários:", error);
			return {
				success: false,
				message: "Erro inesperado ao salvar horários",
			};
		}
	};

	/**
	 * Salva métodos de pagamento do onboarding
	 */
	const saveOnboardingPayments = async (
		data: OnboardingPagamentos,
	): Promise<{ success: boolean; message?: string }> => {
		try {
			const { error } = await supabase.rpc("fn_rpc_onboarding_salvar_pagamentos", {
				p_dados: data,
			});

			if (error) {
				console.error("Erro ao salvar pagamentos:", error);
				return {
					success: false,
					message: error.message || "Erro ao salvar pagamentos",
				};
			}

			return {
				success: true,
				message: "Métodos de pagamento salvos com sucesso",
			};
		} catch (error) {
			console.error("Erro inesperado ao salvar pagamentos:", error);
			return {
				success: false,
				message: "Erro inesperado ao salvar pagamentos",
			};
		}
	};

	/**
	 * Finaliza o onboarding
	 */
	const finishOnboarding = async (): Promise<{ success: boolean; message?: string }> => {
		try {
			const { error } = await supabase.rpc("fn_rpc_onboarding_finalizar");

			if (error) {
				console.error("Erro ao finalizar onboarding:", error);
				return {
					success: false,
					message: error.message || "Erro ao finalizar onboarding",
				};
			}

			return {
				success: true,
				message: "Onboarding finalizado com sucesso",
			};
		} catch (error) {
			console.error("Erro inesperado ao finalizar onboarding:", error);
			return {
				success: false,
				message: "Erro inesperado ao finalizar onboarding",
			};
		}
	};

	// ========================================
	// RETORNO DO COMPOSABLE
	// ========================================

	return {
		// READ - Queries diretas (RLS)
		getCurrentEstablishment,
		getEstablishmentById,
		getEstablishmentBySlug,
		listEstablishments,

		// UPDATE - Funções RPC (Admin)
		updateEstablishment,
		changeEstablishmentStatus,
		toggleStoreStatus,

		// Super Admin - Funções RPC
		superAdminChangeStatus,
		superAdminDeleteEstablishment,

		// Onboarding - Funções RPC
		saveOnboardingBasicInfo,
		saveOnboardingAddress,
		saveOnboardingContact,
		saveOnboardingSchedule,
		saveOnboardingPayments,
		finishOnboarding,
	};
};
