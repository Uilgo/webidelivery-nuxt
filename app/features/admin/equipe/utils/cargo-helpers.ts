/**
 * 📌 Helpers de Cargos
 *
 * Funções utilitárias para trabalhar com hierarquia de cargos,
 * validações de permissões e formatação.
 */

import type { Cargo } from "#shared/types/database";
import type { CargoEquipe } from "../types/equipe";

/**
 * Hierarquia de cargos (quanto maior o número, maior o poder)
 */
export const HIERARQUIA_CARGOS: Record<Cargo, number> = {
	super_admin: 6,
	gerente_plataforma: 5,
	admin: 4,
	gerente: 3,
	staff: 2,
	entregador: 1,
} as const;

/**
 * Labels amigáveis para cada cargo
 */
export const CARGO_LABELS: Record<CargoEquipe, string> = {
	admin: "Administrador",
	gerente: "Gerente",
	staff: "Atendente",
	entregador: "Entregador",
} as const;

/**
 * Descrições dos cargos
 */
export const CARGO_DESCRICOES: Record<CargoEquipe, string> = {
	admin: "Acesso total ao estabelecimento",
	gerente: "Gerencia operações e equipe",
	staff: "Executa pedidos e atendimento",
	entregador: "Realiza entregas",
} as const;

/**
 * Verifica se um cargo é superior a outro
 */
export const cargoSuperior = (cargo1: Cargo, cargo2: Cargo): boolean => {
	return HIERARQUIA_CARGOS[cargo1] > HIERARQUIA_CARGOS[cargo2];
};

/**
 * Verifica se um cargo é igual ou superior a outro
 */
export const cargoIgualOuSuperior = (cargo1: Cargo, cargo2: Cargo): boolean => {
	return HIERARQUIA_CARGOS[cargo1] >= HIERARQUIA_CARGOS[cargo2];
};

/**
 * Retorna os cargos que um usuário pode criar
 * Admin pode criar: gerente, staff, entregador
 * Gerente pode criar: staff, entregador
 */
export const cargosPermitidosCriar = (cargoUsuario: Cargo): CargoEquipe[] => {
	const nivelUsuario = HIERARQUIA_CARGOS[cargoUsuario];

	// Super admin e gerente plataforma não criam membros de estabelecimento
	if (cargoUsuario === "super_admin" || cargoUsuario === "gerente_plataforma") {
		return [];
	}

	const todosCargoEquipe: CargoEquipe[] = ["admin", "gerente", "staff", "entregador"];

	// Retorna apenas cargos com nível inferior ao do usuário
	return todosCargoEquipe.filter((cargo) => {
		const nivelCargo = HIERARQUIA_CARGOS[cargo];
		return nivelCargo < nivelUsuario;
	});
};

/**
 * Verifica se um usuário pode editar um membro
 * Não pode editar a si mesmo
 * Não pode editar cargo superior ou igual
 */
export const podeEditarMembro = (
	cargoUsuario: Cargo,
	cargoMembro: Cargo,
	usuarioId: string,
	membroId: string,
): boolean => {
	// Não pode editar a si mesmo
	if (usuarioId === membroId) {
		return false;
	}

	// Não pode editar cargo superior ou igual
	return cargoSuperior(cargoUsuario, cargoMembro);
};

/**
 * Verifica se um usuário pode remover um membro
 * Mesmas regras de edição
 */
export const podeRemoverMembro = podeEditarMembro;

/**
 * Formata o nome do cargo para exibição
 */
export const formatarCargo = (cargo: CargoEquipe): string => {
	return CARGO_LABELS[cargo];
};

/**
 * Retorna a cor do badge do cargo (Tailwind classes)
 */
export const corBadgeCargo = (cargo: CargoEquipe): string => {
	const cores: Record<CargoEquipe, string> = {
		admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
		gerente: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
		staff: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
		entregador: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
	};

	return cores[cargo];
};

/**
 * Retorna o ícone do cargo (Lucide icons)
 */
export const iconeCargo = (cargo: CargoEquipe): string => {
	const icones: Record<CargoEquipe, string> = {
		admin: "lucide:shield-check",
		gerente: "lucide:briefcase",
		staff: "lucide:user-check",
		entregador: "lucide:truck",
	};

	return icones[cargo];
};
