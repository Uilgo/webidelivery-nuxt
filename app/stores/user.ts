/**
 * 📌 Store de Usuário (Pinia)
 *
 * Gerencia o estado do usuário autenticado, incluindo dados do perfil
 * da tabela `perfis`. Integra com Supabase Auth e aproveita as políticas RLS.
 */

import { defineStore } from "pinia";
import type { Perfil, PerfilCompleto } from "#shared/types/perfis";
import type { Cargo } from "#shared/types/database";

// ========================================
// TIPOS DO STORE
// ========================================

interface SupabaseUser {
	id: string;
	email?: string;
	[key: string]: unknown;
}

// Type guard para verificar se é um usuário válido do Supabase
const isSupabaseUser = (user: unknown): user is SupabaseUser => {
	try {
		if (typeof user !== "object" || user === null) {
			return false;
		}

		const userObj = user as Record<string, unknown>;
		return "id" in userObj && typeof userObj.id === "string" && userObj.id.length > 0;
	} catch {
		return false;
	}
};

interface UserState {
	// Dados do Supabase Auth
	authUser: SupabaseUser | null;

	// Dados do perfil (tabela perfis)
	profile: Perfil | null;

	// Estados de carregamento
	isLoadingProfile: boolean;
	isAuthenticated: boolean;

	// Cache e controle
	lastProfileFetch: number | null;
	profileError: string | null;
}

interface ProfileUpdateData {
	nome?: string;
	sobrenome?: string;
	telefone?: string | null;
	avatar_url?: string | null;
}

// ========================================
// STORE PRINCIPAL
// ========================================

export const useUserStore = defineStore("user", {
	// ========================================
	// ESTADO
	// ========================================
	state: (): UserState => ({
		authUser: null,
		profile: null,
		isLoadingProfile: false,
		isAuthenticated: false,
		lastProfileFetch: null,
		profileError: null,
	}),

	// ========================================
	// GETTERS
	// ========================================
	getters: {
		/**
		 * Perfil completo com propriedades computadas
		 */
		profileComplete(): PerfilCompleto | null {
			if (!this.profile) return null;

			return {
				...this.profile,
				nome_completo: `${this.profile.nome} ${this.profile.sobrenome}`.trim(),
				iniciais: `${this.profile.nome.charAt(0)}${this.profile.sobrenome.charAt(0)}`.toUpperCase(),
				eh_admin: this.profile.cargo === "admin",
				eh_gerente: this.profile.cargo === "gerente",
				eh_staff: this.profile.cargo === "staff",
				eh_entregador: this.profile.cargo === "entregador",
				eh_plataforma: ["super_admin", "gerente_plataforma"].includes(this.profile.cargo),
			};
		},

		/**
		 * Verifica se é usuário da plataforma (super_admin ou gerente_plataforma)
		 */
		isPlataformUser(): boolean {
			return this.profile?.cargo === "super_admin" || this.profile?.cargo === "gerente_plataforma";
		},

		/**
		 * Verifica se é admin do estabelecimento
		 */
		isEstablishmentAdmin(): boolean {
			return this.profile?.cargo === "admin";
		},

		/**
		 * Verifica se tem permissões de gerenciamento (admin ou gerente)
		 */
		hasManagementPermissions(): boolean {
			return ["admin", "gerente"].includes(this.profile?.cargo || "");
		},

		/**
		 * ID do estabelecimento (se aplicável)
		 */
		establishmentId(): string | null {
			return this.profile?.estabelecimento_id || null;
		},

		/**
		 * Cargo do usuário
		 */
		userRole(): Cargo | null {
			return this.profile?.cargo || null;
		},

		/**
		 * Verifica se o perfil precisa ser recarregado (cache de 5 minutos)
		 */
		shouldRefreshProfile(): boolean {
			if (!this.lastProfileFetch) return true;
			const fiveMinutes = 5 * 60 * 1000;
			return Date.now() - this.lastProfileFetch > fiveMinutes;
		},
	},

	// ========================================
	// ACTIONS
	// ========================================
	actions: {
		/**
		 * Inicializa o store com dados do Supabase Auth
		 */
		setAuthUser(user: unknown) {
			// Validar se é um usuário válido do Supabase
			if (user && isSupabaseUser(user)) {
				this.authUser = user;
				this.isAuthenticated = true;
			} else if (user === null) {
				this.authUser = null;
				this.isAuthenticated = false;
			} else {
				// Aceitar qualquer objeto com id válido (para resolver problema do Proxy)
				if (user && typeof user === "object" && "sub" in user) {
					const userObj = user as Record<string, unknown>;
					this.authUser = {
						id: userObj.sub as string,
						email: userObj.email as string,
						...userObj,
					} as SupabaseUser;
					this.isAuthenticated = true;
				} else {
					console.error("Usuário inválido recebido:", user);
					this.authUser = null;
					this.isAuthenticated = false;
				}
			}

			// Se não há usuário, limpar perfil
			if (!this.authUser) {
				this.clearProfile();
			}
		},

		/**
		 * Busca o perfil do usuário na tabela perfis
		 */
		async fetchProfile(): Promise<void> {
			// Não buscar se não há usuário autenticado
			if (!this.authUser?.id) {
				console.warn("Tentativa de buscar perfil sem usuário autenticado");
				return;
			}

			// Evitar múltiplas requisições simultâneas
			if (this.isLoadingProfile) {
				return;
			}

			this.isLoadingProfile = true;
			this.profileError = null;

			try {
				const supabase = useSupabaseClient();

				// Buscar perfil usando RLS (só retorna dados do usuário atual)
				const { data, error } = await supabase
					.from("perfis")
					.select("*")
					.eq("id", this.authUser.id)
					.single();

				if (error) {
					console.error("Erro ao buscar perfil:", error);
					this.profileError = "Erro ao carregar dados do perfil";
					return;
				}

				if (!data) {
					console.warn("Perfil não encontrado para o usuário:", this.authUser.id);
					this.profileError = "Perfil não encontrado";
					return;
				}

				// Atualizar estado
				this.profile = data as Perfil;
				this.lastProfileFetch = Date.now();
				this.profileError = null;
			} catch (error) {
				console.error("Erro inesperado ao buscar perfil:", error);
				this.profileError = "Erro inesperado ao carregar perfil";
			} finally {
				this.isLoadingProfile = false;
			}
		},

		/**
		 * Atualiza dados do perfil
		 */
		async updateProfile(updates: ProfileUpdateData): Promise<boolean> {
			if (!this.authUser?.id || !this.profile) {
				console.error("Usuário não autenticado ou perfil não carregado");
				return false;
			}

			try {
				const supabase = useSupabaseClient();

				const { data, error } = await supabase
					.from("perfis")
					.update({
						...updates,
						updated_at: new Date().toISOString(),
					})
					.eq("id", this.authUser.id)
					.select()
					.single();

				if (error) {
					console.error("Erro ao atualizar perfil:", error);
					return false;
				}

				// Atualizar estado local
				this.profile = data as Perfil;
				this.lastProfileFetch = Date.now();

				return true;
			} catch (error) {
				console.error("Erro inesperado ao atualizar perfil:", error);
				return false;
			}
		},

		/**
		 * Força recarregamento do perfil (ignora cache)
		 */
		async refreshProfile(): Promise<void> {
			this.lastProfileFetch = null;
			await this.fetchProfile();
		},

		/**
		 * Limpa dados do perfil
		 */
		clearProfile(): void {
			this.profile = null;
			this.lastProfileFetch = null;
			this.profileError = null;
			this.isLoadingProfile = false;
		},

		/**
		 * Limpa todo o estado do usuário (logout)
		 */
		clearUser(): void {
			this.authUser = null;
			this.isAuthenticated = false;
			this.clearProfile();
		},

		/**
		 * Inicialização automática do perfil quando há usuário
		 */
		async initializeProfile(): Promise<void> {
			if (this.authUser && (!this.profile || this.shouldRefreshProfile)) {
				await this.fetchProfile();
			}
		},

		/**
		 * Verifica se o usuário tem permissão para um cargo específico
		 */
		hasRole(role: Cargo): boolean {
			return this.profile?.cargo === role;
		},

		/**
		 * Verifica se o usuário tem pelo menos um dos cargos especificados
		 */
		hasAnyRole(roles: Cargo[]): boolean {
			return roles.includes(this.profile?.cargo as Cargo);
		},

		/**
		 * Verifica se o usuário pertence ao estabelecimento especificado
		 */
		belongsToEstablishment(establishmentId: string): boolean {
			return this.profile?.estabelecimento_id === establishmentId;
		},
	},
});
