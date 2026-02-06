/**
 * 📌 usePerfis
 *
 * Composable para gerenciar dados da tabela `perfis`.
 * READ: Queries diretas (protegidas por RLS)
 * CUD: Funções RPC (com validações de permissão)
 */

import type { Perfil } from "#shared/types/perfis";
import type { UUID, Cargo } from "#shared/types/database";

// ========================================
// TIPOS DO COMPOSABLE
// ========================================

interface PerfilUpdateData {
	nome?: string;
	sobrenome?: string;
	telefone?: string | null;
	avatar_url?: string | null;
	ativo?: boolean;
}

interface PerfilFilters {
	estabelecimento_id?: UUID;
	cargo?: Cargo;
	ativo?: boolean;
	search?: string;
}

// ========================================
// COMPOSABLE PRINCIPAL
// ========================================

export const usePerfis = () => {
	const supabase = useSupabaseClient();

	// ========================================
	// READ - QUERIES DIRETAS (RLS)
	// ========================================

	/**
	 * Busca o perfil do usuário logado
	 */
	const getCurrentProfile = async (): Promise<Perfil | null> => {
		try {
			const { data, error } = await supabase.from("perfis").select("*").single();

			if (error) {
				console.error("Erro ao buscar perfil atual:", error);
				return null;
			}

			return data as Perfil;
		} catch (error) {
			console.error("Erro inesperado ao buscar perfil:", error);
			return null;
		}
	};

	/**
	 * Busca um perfil específico por ID
	 */
	const getProfileById = async (id: UUID): Promise<Perfil | null> => {
		try {
			const { data, error } = await supabase.from("perfis").select("*").eq("id", id).single();

			if (error) {
				console.error("Erro ao buscar perfil por ID:", error);
				return null;
			}

			return data as Perfil;
		} catch (error) {
			console.error("Erro inesperado ao buscar perfil por ID:", error);
			return null;
		}
	};

	/**
	 * Lista perfis com filtros opcionais (RLS aplicada automaticamente)
	 */
	const listProfiles = async (filters?: PerfilFilters): Promise<Perfil[]> => {
		try {
			let query = supabase.from("perfis").select("*");

			// Aplicar filtros
			if (filters?.estabelecimento_id) {
				query = query.eq("estabelecimento_id", filters.estabelecimento_id);
			}

			if (filters?.cargo) {
				query = query.eq("cargo", filters.cargo);
			}

			if (filters?.ativo !== undefined) {
				query = query.eq("ativo", filters.ativo);
			}

			if (filters?.search) {
				query = query.or(
					`nome.ilike.%${filters.search}%,sobrenome.ilike.%${filters.search}%,email.ilike.%${filters.search}%`,
				);
			}

			// Ordenar por nome
			query = query.order("nome", { ascending: true });

			const { data, error } = await query;

			if (error) {
				console.error("Erro ao listar perfis:", error);
				return [];
			}

			return data as Perfil[];
		} catch (error) {
			console.error("Erro inesperado ao listar perfis:", error);
			return [];
		}
	};

	/**
	 * Lista membros da equipe do estabelecimento atual
	 */
	const getTeamMembers = async (): Promise<Perfil[]> => {
		try {
			// RLS já filtra pelo estabelecimento do usuário
			const { data, error } = await supabase
				.from("perfis")
				.select("*")
				.neq("cargo", "super_admin") // Excluir super_admin
				.neq("cargo", "gerente_plataforma") // Excluir gerente_plataforma
				.order("nome", { ascending: true });

			if (error) {
				console.error("Erro ao buscar membros da equipe:", error);
				return [];
			}

			return data as Perfil[];
		} catch (error) {
			console.error("Erro inesperado ao buscar membros da equipe:", error);
			return [];
		}
	};

	// ========================================
	// UPDATE - FUNÇÕES RPC
	// ========================================

	/**
	 * Atualiza dados de um membro da equipe via RPC
	 */
	const updateTeamMember = async (
		memberId: UUID,
		updates: PerfilUpdateData,
	): Promise<{ success: boolean; message?: string }> => {
		try {
			const { error } = await supabase.rpc("fn_rpc_equipe_atualizar_membro", {
				p_membro_id: memberId,
				p_dados: updates,
			});

			if (error) {
				console.error("Erro ao atualizar membro:", error);
				return {
					success: false,
					message: error.message || "Erro ao atualizar membro",
				};
			}

			return {
				success: true,
				message: "Membro atualizado com sucesso",
			};
		} catch (error) {
			console.error("Erro inesperado ao atualizar membro:", error);
			return {
				success: false,
				message: "Erro inesperado ao atualizar membro",
			};
		}
	};

	// ========================================
	// DELETE - FUNÇÕES RPC
	// ========================================

	/**
	 * Remove (desativa) um membro da equipe via RPC
	 */
	const removeTeamMember = async (
		memberId: UUID,
	): Promise<{ success: boolean; message?: string }> => {
		try {
			const { error } = await supabase.rpc("fn_rpc_equipe_remover_membro", {
				p_membro_id: memberId,
			});

			if (error) {
				console.error("Erro ao remover membro:", error);
				return {
					success: false,
					message: error.message || "Erro ao remover membro",
				};
			}

			return {
				success: true,
				message: "Membro removido com sucesso",
			};
		} catch (error) {
			console.error("Erro inesperado ao remover membro:", error);
			return {
				success: false,
				message: "Erro inesperado ao remover membro",
			};
		}
	};

	/**
	 * Deleta permanentemente um membro da equipe via RPC (apenas admin)
	 */
	const deleteTeamMember = async (
		memberId: UUID,
	): Promise<{ success: boolean; message?: string }> => {
		try {
			const { error } = await supabase.rpc("fn_rpc_equipe_deletar_membro", {
				p_membro_id: memberId,
			});

			if (error) {
				console.error("Erro ao deletar membro:", error);
				return {
					success: false,
					message: error.message || "Erro ao deletar membro",
				};
			}

			return {
				success: true,
				message: "Membro deletado permanentemente",
			};
		} catch (error) {
			console.error("Erro inesperado ao deletar membro:", error);
			return {
				success: false,
				message: "Erro inesperado ao deletar membro",
			};
		}
	};

	// ========================================
	// CÓDIGOS DE CONVITE - FUNÇÕES RPC
	// ========================================

	/**
	 * Gera código de convite para equipe via RPC
	 */
	const generateTeamInviteCode = async (
		cargo: Cargo,
		diasValidade?: number,
		descricao?: string,
	): Promise<{ success: boolean; codigo?: string; message?: string }> => {
		try {
			const { data, error } = await supabase.rpc("fn_rpc_admin_gerar_codigo_equipe", {
				p_cargo: cargo,
				p_dias_validade: diasValidade || 30,
				p_descricao: descricao || null,
			});

			if (error) {
				console.error("Erro ao gerar código:", error);
				return {
					success: false,
					message: error.message || "Erro ao gerar código",
				};
			}

			return {
				success: true,
				codigo: data.codigo,
				message: "Código gerado com sucesso",
			};
		} catch (error) {
			console.error("Erro inesperado ao gerar código:", error);
			return {
				success: false,
				message: "Erro inesperado ao gerar código",
			};
		}
	};

	/**
	 * Lista códigos de convite da equipe via RPC
	 */
	const listTeamInviteCodes = async (): Promise<unknown[]> => {
		try {
			const { data, error } = await supabase.rpc("fn_rpc_admin_listar_codigos_equipe");

			if (error) {
				console.error("Erro ao listar códigos:", error);
				return [];
			}

			return data || [];
		} catch (error) {
			console.error("Erro inesperado ao listar códigos:", error);
			return [];
		}
	};

	/**
	 * Revoga código de convite via RPC
	 */
	const revokeTeamInviteCode = async (
		codigoId: UUID,
	): Promise<{ success: boolean; message?: string }> => {
		try {
			const { error } = await supabase.rpc("fn_rpc_admin_revogar_codigo_equipe", {
				p_codigo_id: codigoId,
			});

			if (error) {
				console.error("Erro ao revogar código:", error);
				return {
					success: false,
					message: error.message || "Erro ao revogar código",
				};
			}

			return {
				success: true,
				message: "Código revogado com sucesso",
			};
		} catch (error) {
			console.error("Erro inesperado ao revogar código:", error);
			return {
				success: false,
				message: "Erro inesperado ao revogar código",
			};
		}
	};

	// ========================================
	// RETORNO DO COMPOSABLE
	// ========================================

	return {
		// READ - Queries diretas (RLS)
		getCurrentProfile,
		getProfileById,
		listProfiles,
		getTeamMembers,

		// UPDATE - Funções RPC
		updateTeamMember,

		// DELETE - Funções RPC
		removeTeamMember,
		deleteTeamMember,

		// Códigos de convite - Funções RPC
		generateTeamInviteCode,
		listTeamInviteCodes,
		revokeTeamInviteCode,
	};
};
