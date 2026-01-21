/**
 * 📌 useCombosActions
 *
 * Composable responsável pelas ações CUD (Create, Update, Delete) via RPC.
 * Todas as operações de escrita passam por funções RPC do banco.
 */

import type { ComboCreateData, ComboUpdateData } from "../../../types/combo";
import { useCombosFetch } from "./useCombosFetch";
import { useToast } from "~/composables/ui/useToast";
import { parseCurrency } from "../../../../../../lib/formatters/currency";

export const useCombosActions = () => {
	const supabase = useSupabaseClient();
	const { fetchCombos } = useCombosFetch();
	const toast = useToast();

	/**
	 * Criar novo combo
	 */
	const createCombo = async (
		data: Omit<ComboCreateData, "estabelecimento_id">,
	): Promise<string | null> => {
		try {
			const { data: result, error } = await supabase.rpc("fn_combos_criar", {
				p_nome: data.nome,
				p_preco_combo: data.preco_combo,
				p_preco_original: data.preco_original,
				p_descricao: data.descricao || null,
				p_imagem_url: data.imagem_url || null,
				p_destaque: data.destaque || false,
				p_ativo: data.ativo !== undefined ? data.ativo : true,
				p_data_inicio: data.data_inicio || null,
				p_data_fim: data.data_fim || null,
				p_produtos: data.produtos || [],
			});

			if (error) throw error;

			await fetchCombos();

			toast.add({
				title: "Combo criado",
				description: `${data.nome} foi criado com sucesso`,
				color: "success",
				duration: 3000,
			});

			return result as string;
		} catch (err) {
			toast.add({
				title: "Erro ao criar combo",
				description: err instanceof Error ? err.message : "Erro desconhecido",
				color: "error",
				duration: 5000,
			});
			return null;
		}
	};

	/**
	 * Atualizar combo existente via RPC
	 */
	const updateCombo = async (id: string, data: ComboUpdateData): Promise<boolean> => {
		try {
			// Garantir que preços são números usando formatter centralizado
			const precoCombo =
				typeof data.preco_combo === "string"
					? parseCurrency(data.preco_combo as string)
					: Number(data.preco_combo);

			const precoOriginal =
				typeof data.preco_original === "string"
					? parseCurrency(data.preco_original as string)
					: Number(data.preco_original);

			// Montar parâmetros dinamicamente - só adiciona se não for null/undefined
			const params: Record<string, unknown> = {
				p_combo_id: id,
				p_nome: data.nome,
				p_preco_combo: precoCombo,
				p_preco_original: precoOriginal,
				p_destaque: data.destaque,
				p_ativo: data.ativo,
			};

			// Adicionar opcionais apenas se tiverem valor
			if (data.descricao) params.p_descricao = data.descricao;
			if (data.imagem_url) params.p_imagem_url = data.imagem_url;
			if (data.data_inicio) params.p_data_inicio = data.data_inicio;
			if (data.data_fim) params.p_data_fim = data.data_fim;
			if (data.produtos && data.produtos.length > 0) params.p_produtos = data.produtos;

			const { error } = await supabase.rpc("fn_combos_atualizar", params);

			if (error) throw error;

			await fetchCombos();

			toast.add({
				title: "Combo atualizado",
				description: `${data.nome} foi atualizado com sucesso`,
				color: "success",
				duration: 3000,
			});

			return true;
		} catch (err) {
			toast.add({
				title: "Erro ao atualizar combo",
				description: err instanceof Error ? err.message : "Erro desconhecido",
				color: "error",
				duration: 5000,
			});
			return false;
		}
	};

	/**
	 * Deletar combo
	 */
	const deleteCombo = async (id: string): Promise<boolean> => {
		try {
			const { error } = await supabase.rpc("fn_combos_excluir", {
				p_combo_id: id,
			});

			if (error) throw error;

			await fetchCombos();

			toast.add({
				title: "Combo excluído",
				description: "O combo foi excluído com sucesso",
				color: "success",
				duration: 3000,
			});

			return true;
		} catch (err) {
			toast.add({
				title: "Erro ao excluir combo",
				description: err instanceof Error ? err.message : "Erro desconhecido",
				color: "error",
				duration: 5000,
			});
			return false;
		}
	};

	/**
	 * Toggle status ativo/inativo
	 * SEGURANÇA: Usa RPC para garantir que só atualiza combos do próprio estabelecimento
	 */
	const toggleStatus = async (id: string, ativo: boolean): Promise<boolean> => {
		try {
			// Usar RPC para garantir segurança multi-tenant
			const { error } = await supabase.rpc("fn_combos_toggle_ativo", {
				p_combo_id: id,
				p_ativo: ativo,
			});

			if (error) throw error;

			await fetchCombos();

			return true;
		} catch (err) {
			toast.add({
				title: "Erro ao alterar status",
				description: err instanceof Error ? err.message : "Erro desconhecido",
				color: "error",
				duration: 5000,
			});
			return false;
		}
	};

	/**
	 * Reordenar combos
	 */
	const reorderCombos = async (comboIds: string[]): Promise<boolean> => {
		try {
			const { error } = await supabase.rpc("fn_combos_reordenar", {
				p_combo_ids: comboIds,
			});

			if (error) throw error;

			await fetchCombos();

			return true;
		} catch {
			return false;
		}
	};

	return {
		createCombo,
		updateCombo,
		deleteCombo,
		toggleStatus,
		reorderCombos,
	};
};
