/**
 * 📌 Tipos da Feature de Equipe
 *
 * Define todos os tipos relacionados ao gerenciamento de equipe:
 * - Membros da equipe
 * - Convites pendentes
 * - Filtros e ordenação
 * - Estatísticas
 */

import type { UUID, TimestampTz, Cargo } from "#shared/types/database";
import type { Perfil } from "#shared/types/perfis";

/**
 * Cargos permitidos para membros de equipe (exclui super_admin e gerente_plataforma)
 */
export type CargoEquipe = Extract<Cargo, "admin" | "gerente" | "staff" | "entregador">;

/**
 * Status do membro
 */
export type StatusMembro = "ativo" | "inativo";

/**
 * Membro da equipe (reutiliza tipo Perfil existente)
 */
export type Membro = Perfil;

/**
 * Convite de equipe (baseado na tabela codigos_convite)
 */
export interface Convite {
	readonly id: UUID;
	readonly codigo: string;
	readonly tipo: "membro_equipe";
	readonly criado_por: UUID;
	readonly criador_nome?: string; // Nome do criador (join)
	readonly estabelecimento_id: UUID;
	readonly cargo_pretendido: CargoEquipe;
	readonly expires_at: TimestampTz | null;
	readonly descricao: string | null;
	readonly usado: boolean;
	readonly usado_por: UUID | null;
	readonly usado_em: TimestampTz | null;
	readonly created_at: TimestampTz;
}

/**
 * Dados para criar convite
 */
export interface CriarConviteData {
	cargo_pretendido: CargoEquipe;
	descricao?: string;
}

/**
 * Dados para editar membro
 */
export interface EditarMembroData {
	cargo?: CargoEquipe;
	ativo?: boolean;
}

/**
 * Filtros de membros
 */
export interface FiltrosMembros {
	cargo?: CargoEquipe;
	status?: StatusMembro;
	busca?: string;
}

/**
 * Ordenação de membros
 */
export type OrdenacaoMembros = "nome_asc" | "nome_desc" | "recente_asc" | "recente_desc";

/**
 * Estatísticas da equipe
 */
export interface EstatisticasEquipe {
	total_membros: number;
	membros_ativos: number;
	membros_inativos: number;
	convites_pendentes: number;
	por_cargo: {
		admin: number;
		gerente: number;
		staff: number;
		entregador: number;
	};
}

/**
 * Aba ativa da página
 */
export type AbaEquipe = "membros" | "convites";

/**
 * Estado da feature de equipe
 */
export interface EquipeState {
	aba_ativa: AbaEquipe;
	filtros: FiltrosMembros;
	ordenacao: OrdenacaoMembros;
	busca: string;
}
