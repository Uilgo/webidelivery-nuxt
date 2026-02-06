/**
 * 📌 useMembrosActions
 *
 * Composable para ações de membros (editar, ativar/desativar, remover).
 * Todas as operações CUD usam funções RPC do Supabase.
 * Validações client-side com Zod + validações server-side nas RPCs.
 */

import type { EditarMembroData } from "../types/equipe";
import type { Cargo } from "#shared/types/database";
import { editarMembroSchema } from "#shared/schemas/equipe";
import { MENSAGENS_ERRO_EQUIPE, MENSAGENS_SUCESSO_EQUIPE } from "#shared/constants/equipe";
import { useCargoPermissions } from "./useCargoPermissions";
import { useToast } from "~/composables/ui/useToast";

export const useMembrosActions = () => {
	const supabase = useSupabaseClient();
	const toast = useToast();
	const { podeEditar, podeRemover } = useCargoPermissions();

	/**
	 * Estado de carregamento das ações
	 */
	const actionLoading = useState<boolean>("equipe.membros.actionLoading", () => false);

	/**
	 * Edita um membro usando RPC fn_equipe_editar_membro
	 *
	 * @param membroId - ID do membro a ser editado
	 * @param cargoMembro - Cargo atual do membro (para validação client-side)
	 * @param dados - Dados a serem atualizados (cargo e/ou ativo)
	 * @returns Promise<boolean> - true se sucesso, false se erro
	 */
	const editarMembro = async (
		membroId: string,
		cargoMembro: Cargo,
		dados: EditarMembroData,
	): Promise<boolean> => {
		// Validação de permissão (client-side)
		if (!podeEditar(cargoMembro, membroId)) {
			toast.add({
				title: "Sem permissão",
				description: MENSAGENS_ERRO_EQUIPE.SEM_PERMISSAO_EDITAR,
				color: "error",
			});
			return false;
		}

		// Validação dos dados com Zod
		const validacao = editarMembroSchema.safeParse(dados);
		if (!validacao.success) {
			const primeiroErro = validacao.error.issues[0];
			toast.add({
				title: "Dados inválidos",
				description: primeiroErro?.message || "Verifique os dados informados",
				color: "error",
			});
			return false;
		}

		actionLoading.value = true;

		try {
			// Chama RPC fn_equipe_editar_membro
			const { data, error } = await supabase.rpc("fn_equipe_editar_membro", {
				p_membro_id: membroId,
				p_cargo: dados.cargo || null,
				p_ativo: dados.ativo !== undefined ? dados.ativo : null,
			});

			if (error) throw error;

			// RPC retorna boolean indicando sucesso
			if (!data) {
				throw new Error("Operação não autorizada");
			}

			toast.add({
				title: "Sucesso",
				description: MENSAGENS_SUCESSO_EQUIPE.MEMBRO_EDITADO,
				color: "success",
			});

			return true;
		} catch (err: unknown) {
			console.error("Erro ao editar membro:", err);

			// Mensagens de erro específicas baseadas no erro do RPC
			let mensagem = "Não foi possível editar o membro";

			if (err instanceof Error) {
				if (err.message.includes("não pode editar a si mesmo")) {
					mensagem = MENSAGENS_ERRO_EQUIPE.NAO_PODE_EDITAR_SI_MESMO;
				} else if (err.message.includes("cargo superior")) {
					mensagem = MENSAGENS_ERRO_EQUIPE.CARGO_SUPERIOR;
				} else if (err.message.includes("permissão")) {
					mensagem = MENSAGENS_ERRO_EQUIPE.SEM_PERMISSAO_EDITAR;
				}
			}

			toast.add({
				title: "Erro",
				description: mensagem,
				color: "error",
			});
			return false;
		} finally {
			actionLoading.value = false;
		}
	};

	/**
	 * Ativa um membro (atalho para editarMembro com ativo: true)
	 *
	 * @param membroId - ID do membro a ser ativado
	 * @param cargoMembro - Cargo atual do membro
	 * @returns Promise<boolean> - true se sucesso, false se erro
	 */
	const ativarMembro = async (membroId: string, cargoMembro: Cargo): Promise<boolean> => {
		const sucesso = await editarMembro(membroId, cargoMembro, { ativo: true });

		if (sucesso) {
			toast.add({
				title: "Sucesso",
				description: MENSAGENS_SUCESSO_EQUIPE.MEMBRO_ATIVADO,
				color: "success",
			});
		}

		return sucesso;
	};

	/**
	 * Desativa um membro (atalho para editarMembro com ativo: false)
	 *
	 * @param membroId - ID do membro a ser desativado
	 * @param cargoMembro - Cargo atual do membro
	 * @returns Promise<boolean> - true se sucesso, false se erro
	 */
	const desativarMembro = async (membroId: string, cargoMembro: Cargo): Promise<boolean> => {
		const sucesso = await editarMembro(membroId, cargoMembro, { ativo: false });

		if (sucesso) {
			toast.add({
				title: "Sucesso",
				description: MENSAGENS_SUCESSO_EQUIPE.MEMBRO_DESATIVADO,
				color: "success",
			});
		}

		return sucesso;
	};

	/**
	 * Remove um membro usando RPC fn_equipe_remover_membro
	 * Realiza soft delete (apenas desativa o membro)
	 *
	 * @param membroId - ID do membro a ser removido
	 * @param cargoMembro - Cargo atual do membro (para validação client-side)
	 * @returns Promise<boolean> - true se sucesso, false se erro
	 */
	const removerMembro = async (membroId: string, cargoMembro: Cargo): Promise<boolean> => {
		// Validação de permissão (client-side)
		if (!podeRemover(cargoMembro, membroId)) {
			toast.add({
				title: "Sem permissão",
				description: MENSAGENS_ERRO_EQUIPE.SEM_PERMISSAO_REMOVER,
				color: "error",
			});
			return false;
		}

		actionLoading.value = true;

		try {
			// Chama RPC fn_equipe_remover_membro
			const { data, error } = await supabase.rpc("fn_equipe_remover_membro", {
				p_membro_id: membroId,
			});

			if (error) throw error;

			// RPC retorna boolean indicando sucesso
			if (!data) {
				throw new Error("Operação não autorizada");
			}

			toast.add({
				title: "Sucesso",
				description: MENSAGENS_SUCESSO_EQUIPE.MEMBRO_REMOVIDO,
				color: "success",
			});

			return true;
		} catch (err: unknown) {
			console.error("Erro ao remover membro:", err);

			// Mensagens de erro específicas baseadas no erro do RPC
			let mensagem = "Não foi possível remover o membro";

			if (err instanceof Error) {
				if (err.message.includes("não pode remover a si mesmo")) {
					mensagem = MENSAGENS_ERRO_EQUIPE.NAO_PODE_REMOVER_SI_MESMO;
				} else if (err.message.includes("cargo superior")) {
					mensagem = MENSAGENS_ERRO_EQUIPE.CARGO_SUPERIOR;
				} else if (err.message.includes("permissão")) {
					mensagem = MENSAGENS_ERRO_EQUIPE.SEM_PERMISSAO_REMOVER;
				}
			}

			toast.add({
				title: "Erro",
				description: mensagem,
				color: "error",
			});
			return false;
		} finally {
			actionLoading.value = false;
		}
	};

	return {
		// Estado
		actionLoading: readonly(actionLoading),

		// Métodos
		editarMembro,
		ativarMembro,
		desativarMembro,
		removerMembro,
	};
};
