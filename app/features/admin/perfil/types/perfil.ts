/**
 * 📌 Tipos para o módulo de perfil do usuário
 *
 * Define as interfaces para dados do perfil, preferências e estruturas relacionadas.
 * Mantém tipagem rigorosa para garantir consistência nos dados.
 * Baseado na estrutura real do banco de dados Supabase.
 */

import type { Perfil } from "#shared/types/perfis";

// ========================================
// TIPOS PARA PERFIL COM ESTABELECIMENTO
// ========================================

export interface PerfilComEstabelecimento extends Perfil {
	readonly estabelecimento?: {
		readonly id: string;
		readonly nome: string;
		readonly slug: string | null;
	} | null;
}
