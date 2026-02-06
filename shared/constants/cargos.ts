/**
 * 📌 Constantes de Cargos e Permissões
 *
 * Constantes relacionadas a cargos, hierarquia e permissões.
 */

import type { Cargo } from "../types/database";

// ========================================
// CARGOS
// ========================================

export const CARGOS = {
	SUPER_ADMIN: "super_admin",
	GERENTE_PLATAFORMA: "gerente_plataforma",
	ADMIN: "admin",
	GERENTE: "gerente",
	STAFF: "staff",
	ENTREGADOR: "entregador",
} as const;

export const CARGOS_LABELS: Record<Cargo, string> = {
	super_admin: "Super Admin",
	gerente_plataforma: "Gerente da Plataforma",
	admin: "Administrador",
	gerente: "Gerente",
	staff: "Atendente",
	entregador: "Entregador",
};

export const CARGOS_DESCRICOES: Record<Cargo, string> = {
	super_admin: "Acesso total à plataforma e todos os estabelecimentos",
	gerente_plataforma: "Gestão operacional e suporte aos estabelecimentos",
	admin: "Acesso total ao estabelecimento",
	gerente: "Gestão operacional do estabelecimento",
	staff: "Execução de pedidos e atendimento",
	entregador: "Acesso restrito às entregas",
};

// ========================================
// HIERARQUIA DE CARGOS
// ========================================

/**
 * Hierarquia de cargos (maior número = maior poder)
 */
export const HIERARQUIA_CARGOS: Record<Cargo, number> = {
	super_admin: 6,
	gerente_plataforma: 5,
	admin: 4,
	gerente: 3,
	staff: 2,
	entregador: 1,
};

/**
 * Cargos da plataforma (WebiDelivery)
 */
export const CARGOS_PLATAFORMA: readonly Cargo[] = ["super_admin", "gerente_plataforma"];

/**
 * Cargos de estabelecimento
 */
export const CARGOS_ESTABELECIMENTO: readonly Cargo[] = ["admin", "gerente", "staff", "entregador"];

/**
 * Cargos que podem gerenciar equipe
 */
export const CARGOS_GERENCIAM_EQUIPE: readonly Cargo[] = ["admin", "gerente"];

/**
 * Cargos que podem criar outros cargos
 */
export const CARGOS_PODEM_CRIAR: Record<Cargo, readonly Cargo[]> = {
	super_admin: ["super_admin", "gerente_plataforma"],
	gerente_plataforma: [],
	admin: ["admin", "gerente", "staff", "entregador"],
	gerente: ["staff", "entregador"],
	staff: [],
	entregador: [],
};

// ========================================
// PERMISSÕES POR CARGO
// ========================================

export const PERMISSOES = {
	// Dashboard
	VER_DASHBOARD: "ver_dashboard",
	VER_DASHBOARD_COMPLETO: "ver_dashboard_completo",

	// Pedidos
	VER_PEDIDOS: "ver_pedidos",
	CRIAR_PEDIDOS: "criar_pedidos",
	ATUALIZAR_PEDIDOS: "atualizar_pedidos",
	CANCELAR_PEDIDOS: "cancelar_pedidos",

	// Cardápio
	VER_CARDAPIO: "ver_cardapio",
	CRIAR_CARDAPIO: "criar_cardapio",
	ATUALIZAR_CARDAPIO: "atualizar_cardapio",
	DELETAR_CARDAPIO: "deletar_cardapio",
	TOGGLE_ITEM_CARDAPIO: "toggle_item_cardapio",

	// Marketing
	VER_MARKETING: "ver_marketing",
	CRIAR_MARKETING: "criar_marketing",
	ATUALIZAR_MARKETING: "atualizar_marketing",
	DELETAR_MARKETING: "deletar_marketing",

	// Equipe
	VER_EQUIPE: "ver_equipe",
	CRIAR_EQUIPE: "criar_equipe",
	ATUALIZAR_EQUIPE: "atualizar_equipe",
	DELETAR_EQUIPE: "deletar_equipe",

	// Relatórios
	VER_RELATORIOS: "ver_relatorios",
	EXPORTAR_RELATORIOS: "exportar_relatorios",

	// Configurações
	VER_CONFIGURACOES: "ver_configuracoes",
	ATUALIZAR_CONFIGURACOES: "atualizar_configuracoes",
	VER_CONFIGURACOES_PAGAMENTO: "ver_configuracoes_pagamento",
	VER_CONFIGURACOES_SEGURANCA: "ver_configuracoes_seguranca",

	// Entregas
	VER_ENTREGAS: "ver_entregas",
	ATUALIZAR_ENTREGAS: "atualizar_entregas",

	// Plataforma
	VER_ESTABELECIMENTOS: "ver_estabelecimentos",
	CRIAR_ESTABELECIMENTOS: "criar_estabelecimentos",
	ATUALIZAR_ESTABELECIMENTOS: "atualizar_estabelecimentos",
	DELETAR_ESTABELECIMENTOS: "deletar_estabelecimentos",
	IMPERSONAR_ESTABELECIMENTO: "impersonar_estabelecimento",
} as const;

/**
 * Mapa de permissões por cargo
 */
export const PERMISSOES_POR_CARGO: Record<Cargo, readonly string[]> = {
	super_admin: [
		// Todas as permissões
		...Object.values(PERMISSOES),
	],

	gerente_plataforma: [
		PERMISSOES.VER_DASHBOARD_COMPLETO,
		PERMISSOES.VER_ESTABELECIMENTOS,
		PERMISSOES.ATUALIZAR_ESTABELECIMENTOS,
		PERMISSOES.VER_RELATORIOS,
		PERMISSOES.EXPORTAR_RELATORIOS,
	],

	admin: [
		PERMISSOES.VER_DASHBOARD_COMPLETO,
		PERMISSOES.VER_PEDIDOS,
		PERMISSOES.CRIAR_PEDIDOS,
		PERMISSOES.ATUALIZAR_PEDIDOS,
		PERMISSOES.CANCELAR_PEDIDOS,
		PERMISSOES.VER_CARDAPIO,
		PERMISSOES.CRIAR_CARDAPIO,
		PERMISSOES.ATUALIZAR_CARDAPIO,
		PERMISSOES.DELETAR_CARDAPIO,
		PERMISSOES.TOGGLE_ITEM_CARDAPIO,
		PERMISSOES.VER_MARKETING,
		PERMISSOES.CRIAR_MARKETING,
		PERMISSOES.ATUALIZAR_MARKETING,
		PERMISSOES.DELETAR_MARKETING,
		PERMISSOES.VER_EQUIPE,
		PERMISSOES.CRIAR_EQUIPE,
		PERMISSOES.ATUALIZAR_EQUIPE,
		PERMISSOES.DELETAR_EQUIPE,
		PERMISSOES.VER_RELATORIOS,
		PERMISSOES.EXPORTAR_RELATORIOS,
		PERMISSOES.VER_CONFIGURACOES,
		PERMISSOES.ATUALIZAR_CONFIGURACOES,
		PERMISSOES.VER_CONFIGURACOES_PAGAMENTO,
		PERMISSOES.VER_CONFIGURACOES_SEGURANCA,
	],

	gerente: [
		PERMISSOES.VER_DASHBOARD_COMPLETO,
		PERMISSOES.VER_PEDIDOS,
		PERMISSOES.CRIAR_PEDIDOS,
		PERMISSOES.ATUALIZAR_PEDIDOS,
		PERMISSOES.CANCELAR_PEDIDOS,
		PERMISSOES.VER_CARDAPIO,
		PERMISSOES.CRIAR_CARDAPIO,
		PERMISSOES.ATUALIZAR_CARDAPIO,
		PERMISSOES.DELETAR_CARDAPIO,
		PERMISSOES.TOGGLE_ITEM_CARDAPIO,
		PERMISSOES.VER_MARKETING,
		PERMISSOES.CRIAR_MARKETING,
		PERMISSOES.ATUALIZAR_MARKETING,
		PERMISSOES.DELETAR_MARKETING,
		PERMISSOES.VER_EQUIPE,
		PERMISSOES.CRIAR_EQUIPE,
		PERMISSOES.ATUALIZAR_EQUIPE,
		PERMISSOES.VER_RELATORIOS,
		PERMISSOES.EXPORTAR_RELATORIOS,
		PERMISSOES.VER_CONFIGURACOES,
	],

	staff: [
		PERMISSOES.VER_DASHBOARD,
		PERMISSOES.VER_PEDIDOS,
		PERMISSOES.ATUALIZAR_PEDIDOS,
		PERMISSOES.VER_CARDAPIO,
		PERMISSOES.TOGGLE_ITEM_CARDAPIO,
		PERMISSOES.VER_MARKETING,
	],

	entregador: [PERMISSOES.VER_ENTREGAS, PERMISSOES.ATUALIZAR_ENTREGAS],
};

// ========================================
// HELPERS DE PERMISSÕES
// ========================================

/**
 * Verifica se um cargo tem uma permissão específica
 */
export const cargoTemPermissao = (cargo: Cargo, permissao: string): boolean => {
	return PERMISSOES_POR_CARGO[cargo].includes(permissao);
};

/**
 * Verifica se um cargo pode gerenciar outro cargo
 */
export const cargoPoDeGerenciar = (cargoGerente: Cargo, cargoGerenciado: Cargo): boolean => {
	return HIERARQUIA_CARGOS[cargoGerente] > HIERARQUIA_CARGOS[cargoGerenciado];
};

/**
 * Verifica se um cargo pode criar outro cargo
 */
export const cargoPodeCriar = (cargoAtual: Cargo, cargoNovo: Cargo): boolean => {
	return CARGOS_PODEM_CRIAR[cargoAtual].includes(cargoNovo);
};
