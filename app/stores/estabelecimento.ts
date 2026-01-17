/**
 * 📌 Store de Estabelecimento (Pinia)
 *
 * Gerencia o estado do estabelecimento atual do usuário.
 * Carregado automaticamente pelos plugins de autenticação.
 */

import { defineStore } from "pinia";

// ========================================
// TIPOS DO STORE
// ========================================

interface Estabelecimento {
	id: string;
	nome: string;
	slug?: string;
	logo_url?: string | null;
	status?: string;
	aberto?: boolean;
}

interface EstabelecimentoState {
	// Dados do estabelecimento atual
	estabelecimento: Estabelecimento | null;

	// Estados de carregamento
	isLoading: boolean;
	error: string | null;

	// Cache
	lastFetch: number | null;
}

// ========================================
// STORE PRINCIPAL
// ========================================

export const useEstabelecimentoStore = defineStore("estabelecimento", {
	// ========================================
	// ESTADO
	// ========================================
	state: (): EstabelecimentoState => ({
		estabelecimento: null,
		isLoading: false,
		error: null,
		lastFetch: null,
	}),

	// ========================================
	// GETTERS
	// ========================================
	getters: {
		/**
		 * Nome do estabelecimento ou fallback
		 */
		nome(): string {
			return this.estabelecimento?.nome || "Estabelecimento";
		},

		/**
		 * ID do estabelecimento
		 */
		id(): string | null {
			return this.estabelecimento?.id || null;
		},

		/**
		 * Slug do estabelecimento
		 */
		slug(): string | null {
			return this.estabelecimento?.slug || null;
		},

		/**
		 * Verifica se precisa recarregar (cache de 5 minutos)
		 */
		shouldRefresh(): boolean {
			if (!this.lastFetch) return true;
			const fiveMinutes = 5 * 60 * 1000;
			return Date.now() - this.lastFetch > fiveMinutes;
		},
	},

	// ========================================
	// ACTIONS
	// ========================================
	actions: {
		/**
		 * Busca o estabelecimento pelo ID
		 */
		async fetchEstabelecimento(estabelecimentoId: string): Promise<void> {
			if (!estabelecimentoId) {
				console.warn("ID do estabelecimento não fornecido");
				return;
			}

			// Evitar múltiplas requisições simultâneas
			if (this.isLoading) return;

			this.isLoading = true;
			this.error = null;

			try {
				const supabase = useSupabaseClient();

				const { data, error } = await supabase
					.from("estabelecimentos")
					.select("id, nome, slug, logo_url, status, aberto")
					.eq("id", estabelecimentoId)
					.single();

				if (error) {
					console.error("Erro ao buscar estabelecimento:", error);
					this.error = "Erro ao carregar estabelecimento";
					return;
				}

				if (!data) {
					console.warn("Estabelecimento não encontrado:", estabelecimentoId);
					this.error = "Estabelecimento não encontrado";
					return;
				}

				this.estabelecimento = data as Estabelecimento;
				this.lastFetch = Date.now();
				this.error = null;
			} catch (error) {
				console.error("Erro inesperado ao buscar estabelecimento:", error);
				this.error = "Erro inesperado";
			} finally {
				this.isLoading = false;
			}
		},

		/**
		 * Define o estabelecimento diretamente (útil para SSR)
		 */
		setEstabelecimento(estabelecimento: Estabelecimento | null): void {
			this.estabelecimento = estabelecimento;
			this.lastFetch = Date.now();
		},

		/**
		 * Limpa os dados do estabelecimento
		 */
		clear(): void {
			this.estabelecimento = null;
			this.lastFetch = null;
			this.error = null;
			this.isLoading = false;
		},

		/**
		 * Força recarregamento
		 */
		async refresh(estabelecimentoId: string): Promise<void> {
			this.lastFetch = null;
			await this.fetchEstabelecimento(estabelecimentoId);
		},
	},
});
