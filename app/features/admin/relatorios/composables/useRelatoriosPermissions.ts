/**
 * 📌 useRelatoriosPermissions
 *
 * Composable para gerenciar permissões de acesso aos relatórios.
 * Apenas Admin e Gerente podem acessar relatórios.
 */

import { useUserStore } from "~/stores/user";

export const useRelatoriosPermissions = () => {
	const userStore = useUserStore();

	/**
	 * Verifica se o usuário pode acessar relatórios
	 */
	const podeAcessarRelatorios = computed(() => {
		const cargo = userStore.userRole;
		return cargo ? ["admin", "gerente"].includes(cargo) : false;
	});

	/**
	 * Verifica se o usuário pode exportar relatórios
	 */
	const podeExportar = computed(() => {
		const cargo = userStore.userRole;
		return cargo ? ["admin", "gerente"].includes(cargo) : false;
	});

	/**
	 * Verifica se o usuário pode ver dados financeiros
	 * (Todos que acessam relatórios podem ver financeiro)
	 */
	const podeVerFinanceiro = computed(() => {
		return podeAcessarRelatorios.value;
	});

	/**
	 * Cargo do usuário atual
	 */
	const cargoUsuario = computed(() => userStore.userRole);

	return {
		podeAcessarRelatorios,
		podeExportar,
		podeVerFinanceiro,
		cargoUsuario,
	};
};
