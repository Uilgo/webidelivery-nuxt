/**
 * 📌 useCargoPermissions
 *
 * Composable para validações de hierarquia de cargos e permissões.
 * Centraliza toda a lógica de "quem pode fazer o quê" na equipe.
 */

import type { Cargo } from "#shared/types/database";
import type { CargoEquipe } from "../types/equipe";
import { cargosPermitidosCriar, podeEditarMembro, podeRemoverMembro } from "../utils/cargo-helpers";
import { useUserStore } from "~/stores/user";

export const useCargoPermissions = () => {
	const userStore = useUserStore();

	/**
	 * Cargo do usuário logado
	 */
	const cargoUsuario = computed<Cargo>(() => {
		return userStore.profileComplete?.cargo || "staff";
	});

	/**
	 * ID do usuário logado
	 */
	const usuarioId = computed<string>(() => {
		return userStore.profileComplete?.id || "";
	});

	/**
	 * Verifica se o usuário pode acessar a página de equipe
	 * Apenas Admin e Gerente podem acessar
	 */
	const podeAcessarEquipe = computed<boolean>(() => {
		return cargoUsuario.value === "admin" || cargoUsuario.value === "gerente";
	});

	/**
	 * Retorna os cargos que o usuário pode criar
	 */
	const cargosDisponiveis = computed<CargoEquipe[]>(() => {
		return cargosPermitidosCriar(cargoUsuario.value);
	});

	/**
	 * Verifica se o usuário pode criar um cargo específico
	 */
	const podeCriar = (cargoUsuario: Cargo, cargoAlvo: CargoEquipe): boolean => {
		return cargosPermitidosCriar(cargoUsuario).includes(cargoAlvo);
	};

	/**
	 * Verifica se o usuário pode convidar um cargo específico (alias para podeCriar)
	 */
	const podeConvidarCargo = (cargo: CargoEquipe): boolean => {
		return cargosDisponiveis.value.includes(cargo);
	};

	/**
	 * Verifica se o usuário pode editar um membro específico
	 */
	const podeEditar = (cargoMembro: Cargo, membroId: string): boolean => {
		return podeEditarMembro(cargoUsuario.value, cargoMembro, usuarioId.value, membroId);
	};

	/**
	 * Verifica se o usuário pode remover um membro específico
	 */
	const podeRemover = (cargoMembro: Cargo, membroId: string): boolean => {
		return podeRemoverMembro(cargoUsuario.value, cargoMembro, usuarioId.value, membroId);
	};

	/**
	 * Verifica se o membro é o próprio usuário logado
	 */
	const ehUsuarioLogado = (membroId: string): boolean => {
		return usuarioId.value === membroId;
	};

	return {
		// Estado
		cargoUsuario,
		usuarioId,
		cargosDisponiveis,

		// Permissões
		podeAcessarEquipe,
		podeCriar,
		podeConvidarCargo,
		podeEditar,
		podeRemover,
		ehUsuarioLogado,
	};
};
