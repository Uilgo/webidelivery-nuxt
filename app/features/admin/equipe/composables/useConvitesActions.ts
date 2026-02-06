/**
 * 📌 useConvitesActions
 *
 * Composable para ações de convites (criar, cancelar).
 * Todas as operações CUD usam funções RPC do Supabase.
 * Validações client-side com Zod + validações server-side nas RPCs.
 */

import { useState, readonly, useSupabaseClient } from "#imports";
import type { CriarConviteData } from "../types/equipe";
import type { Cargo } from "#shared/types/database";
import { criarConviteSchema } from "#shared/schemas/equipe";
import {
	MENSAGENS_ERRO_EQUIPE,
	MENSAGENS_SUCESSO_EQUIPE,
	PREFIXO_CODIGO_CONVITE,
	TAMANHO_CODIGO_CONVITE,
} from "#shared/constants/equipe";
import { useCargoPermissions } from "./useCargoPermissions";
import { useToast } from "~/composables/ui/useToast";

export const useConvitesActions = () => {
	const supabase = useSupabaseClient();
	const toast = useToast();
	const { podeCriar } = useCargoPermissions();

	/**
	 * Estado de carregamento das ações
	 */
	const actionLoading = useState<boolean>("equipe.convites.actionLoading", () => false);

	/**
	 * Gera código aleatório para convite
	 * Formato: EQUIPE-XXXXXX (6 caracteres alfanuméricos maiúsculos)
	 */
	const gerarCodigoConvite = (): string => {
		const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
		let codigo = "";

		for (let i = 0; i < TAMANHO_CODIGO_CONVITE; i++) {
			const indiceAleatorio = Math.floor(Math.random() * caracteres.length);
			codigo += caracteres[indiceAleatorio];
		}

		return `${PREFIXO_CODIGO_CONVITE}${codigo}`;
	};

	/**
	 * Cria um convite usando RPC fn_equipe_criar_convite
	 *
	 * @param cargoUsuario - Cargo do usuário que está criando o convite
	 * @param dados - Dados do convite (cargo_pretendido, descricao)
	 * @returns Promise<string | null> - Código do convite criado ou null se erro
	 */
	const criarConvite = async (
		cargoUsuario: Cargo,
		dados: CriarConviteData,
	): Promise<string | null> => {
		// Validação de permissão (client-side)
		if (!podeCriar(cargoUsuario, dados.cargo_pretendido)) {
			toast.add({
				title: "Sem permissão",
				description: MENSAGENS_ERRO_EQUIPE.SEM_PERMISSAO_CRIAR,
				color: "error",
			});
			return null;
		}

		// Validação dos dados com Zod
		const validacao = criarConviteSchema.safeParse(dados);
		if (!validacao.success) {
			const primeiroErro = validacao.error.issues[0];
			toast.add({
				title: "Dados inválidos",
				description: primeiroErro?.message || "Verifique os dados informados",
				color: "error",
			});
			return null;
		}

		actionLoading.value = true;

		try {
			// Gera código único
			const codigo = gerarCodigoConvite();

			// Chama RPC fn_equipe_criar_convite
			const { data, error } = await supabase.rpc("fn_equipe_criar_convite", {
				p_codigo: codigo,
				p_cargo_pretendido: dados.cargo_pretendido,
				p_descricao: dados.descricao || null,
			});

			if (error) throw error;

			// RPC retorna o código do convite criado
			if (!data) {
				throw new Error("Falha ao criar convite");
			}

			toast.add({
				title: "Sucesso",
				description: MENSAGENS_SUCESSO_EQUIPE.CONVITE_CRIADO,
				color: "success",
			});

			return data as string;
		} catch (err: unknown) {
			console.error("Erro ao criar convite:", err);

			// Mensagens de erro específicas
			let mensagem = "Não foi possível criar o convite";

			if (err instanceof Error) {
				if (err.message.includes("permissão")) {
					mensagem = MENSAGENS_ERRO_EQUIPE.SEM_PERMISSAO_CRIAR;
				} else if (err.message.includes("código já existe")) {
					// Caso raro de colisão de código, tenta novamente
					return criarConvite(cargoUsuario, dados);
				}
			}

			toast.add({
				title: "Erro",
				description: mensagem,
				color: "error",
			});
			return null;
		} finally {
			actionLoading.value = false;
		}
	};

	/**
	 * Cancela um convite usando RPC fn_equipe_cancelar_convite
	 *
	 * @param conviteId - ID do convite a ser cancelado
	 * @returns Promise<boolean> - true se sucesso, false se erro
	 */
	const cancelarConvite = async (conviteId: string): Promise<boolean> => {
		actionLoading.value = true;

		try {
			// Chama RPC fn_equipe_cancelar_convite
			const { data, error } = await supabase.rpc("fn_equipe_cancelar_convite", {
				p_convite_id: conviteId,
			});

			if (error) throw error;

			// RPC retorna boolean indicando sucesso
			if (!data) {
				throw new Error("Operação não autorizada");
			}

			toast.add({
				title: "Sucesso",
				description: MENSAGENS_SUCESSO_EQUIPE.CONVITE_CANCELADO,
				color: "success",
			});

			return true;
		} catch (err: unknown) {
			console.error("Erro ao cancelar convite:", err);

			// Mensagens de erro específicas
			let mensagem = "Não foi possível cancelar o convite";

			if (err instanceof Error) {
				if (err.message.includes("não encontrado")) {
					mensagem = MENSAGENS_ERRO_EQUIPE.CODIGO_NAO_ENCONTRADO;
				} else if (err.message.includes("já foi usado")) {
					mensagem = MENSAGENS_ERRO_EQUIPE.CODIGO_USADO;
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
		criarConvite,
		cancelarConvite,
		gerarCodigoConvite,
	};
};
