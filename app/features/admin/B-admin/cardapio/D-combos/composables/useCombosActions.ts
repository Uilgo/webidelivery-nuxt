/**
 * 📌 useCombosActions
 *
 * Composable responsável pelas ações CUD (Create, Update, Delete) via RPC.
 * Todas as operações de escrita passam por funções RPC do banco.
 */

import type { ComboCreateData, ComboUpdateData } from "../../../types/combo";
import { useCombosFetch } from "./useCombosFetch";
import { useToast } from "~/composables/ui/useToast";

export const useCombosActions = () => {
	const supabase = useSupabaseClient();
	const { fetchCombos } = useCombosFetch();
	const toast = useToast();

	/**
	 * Criar novo combo
	 */
	const createCombo = async (data: ComboCreateData): Promise<string | null> => {
		try {
			const { data: result, error } = await supabase.rpc("fn_combos_criar", {
				p_estabelecimento_id: data.estabelecimento_id,
				p_nome: data.nome,
				p_descricao: data.descricao || null,
				p_imagem_url: data.imagem_url || null,
				p_preco_combo: data.preco_combo,
				p_preco_original: data.preco_original,
				p_destaque: data.destaque || false,
				p_data_inicio: data.data_inicio || null,
				p_data_fim: data.data_fim || null,
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
	 * Atualizar combo existente
	 */
	const updateCombo = async (id: string, data: ComboUpdateData): Promise<boolean> => {
		try {
			const { error } = await supabase.rpc("fn_combos_atualizar", {
				p_combo_id: id,
				p_nome: data.nome,
				p_descricao: data.descricao || null,
				p_imagem_url: data.imagem_url || null,
				p_preco_combo: data.preco_combo,
				p_preco_original: data.preco_original,
				p_destaque: data.destaque,
				p_data_inicio: data.data_inicio || null,
				p_data_fim: data.data_fim || null,
			});

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
	 */
	const toggleStatus = async (id: string, ativo: boolean): Promise<boolean> => {
		try {
			const { error } = await supabase.from("combos").update({ ativo }).eq("id", id);

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
