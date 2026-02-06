/**
 * 📌 useHorariosFuncionamento - Gerenciamento de Horários de Funcionamento
 *
 * Responsável por:
 * - Buscar horários de funcionamento (config_geral.horarios)
 * - Gerenciar exceções de horários (feriados, datas especiais)
 * - Atualizar horários via RPC fn_rpc_onboarding_salvar_horarios
 * - Reutiliza lógica do onboarding
 */

import type { HorarioFuncionamento, HorarioExcecao } from "#shared/types/estabelecimentos";
import { useEstabelecimentoStore } from "~/stores/estabelecimento";
import { useToast } from "~/composables/ui/useToast";

export interface UseHorariosFuncionamentoReturn {
	// Dados
	horarios: Ref<HorarioFuncionamento[]>;
	excecoes: Ref<HorarioExcecao[]>;

	// Estados
	loading: Ref<boolean>;
	saving: Ref<boolean>;
	error: Ref<string | null>;

	// Métodos
	buscarHorarios: () => Promise<void>;
	salvarHorarios: (horarios: HorarioFuncionamento[]) => Promise<boolean>;
	adicionarExcecao: (excecao: Omit<HorarioExcecao, "id">) => Promise<boolean>;
	atualizarExcecao: (id: string, excecao: Partial<HorarioExcecao>) => Promise<boolean>;
	removerExcecao: (id: string) => Promise<boolean>;
}

export const useHorariosFuncionamento = (): UseHorariosFuncionamentoReturn => {
	const supabase = useSupabaseClient();
	const estabelecimentoStore = useEstabelecimentoStore();
	const { success, error: showError } = useToast();

	// Estados
	const horarios = ref<HorarioFuncionamento[]>([]);
	const excecoes = ref<HorarioExcecao[]>([]);
	const loading = ref(false);
	const saving = ref(false);
	const error = ref<string | null>(null);

	/**
	 * Buscar horários de funcionamento (READ via RLS)
	 */
	const buscarHorarios = async (): Promise<void> => {
		loading.value = true;
		error.value = null;

		try {
			const estabelecimento = estabelecimentoStore.estabelecimento;

			if (!estabelecimento) {
				throw new Error("Estabelecimento não encontrado");
			}

			// Extrair horários de config_geral
			const configGeral = estabelecimento.config_geral as Record<string, unknown> | null;
			const horariosData = (configGeral?.horario_funcionamento ||
				configGeral?.horarios ||
				[]) as HorarioFuncionamento[];
			const excecoesData = (configGeral?.excecoes_horario || []) as HorarioExcecao[];

			// Se não houver horários salvos, inicializar com estrutura padrão
			if (!horariosData || horariosData.length === 0) {
				horarios.value = [
					{ dia_semana: "domingo", aberto: false, periodos: [] },
					{ dia_semana: "segunda", aberto: false, periodos: [] },
					{ dia_semana: "terca", aberto: false, periodos: [] },
					{ dia_semana: "quarta", aberto: false, periodos: [] },
					{ dia_semana: "quinta", aberto: false, periodos: [] },
					{ dia_semana: "sexta", aberto: false, periodos: [] },
					{ dia_semana: "sabado", aberto: false, periodos: [] },
				];
			} else {
				horarios.value = horariosData;
			}

			// Carregar exceções
			excecoes.value = excecoesData;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao buscar horários";
			error.value = message;
			console.error("[useHorariosFuncionamento] Erro ao buscar horários:", err);

			// Inicializar com estrutura padrão em caso de erro
			horarios.value = [
				{ dia_semana: "domingo", aberto: false, periodos: [] },
				{ dia_semana: "segunda", aberto: false, periodos: [] },
				{ dia_semana: "terca", aberto: false, periodos: [] },
				{ dia_semana: "quarta", aberto: false, periodos: [] },
				{ dia_semana: "quinta", aberto: false, periodos: [] },
				{ dia_semana: "sexta", aberto: false, periodos: [] },
				{ dia_semana: "sabado", aberto: false, periodos: [] },
			];
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Salvar horários de funcionamento (UPDATE via RPC)
	 */
	const salvarHorarios = async (horariosAtualizados: HorarioFuncionamento[]): Promise<boolean> => {
		saving.value = true;
		error.value = null;

		try {
			// Chamar RPC fn_rpc_onboarding_salvar_horarios (reutiliza do onboarding)
			const { error: rpcError } = await supabase.rpc("fn_rpc_onboarding_salvar_horarios", {
				p_horarios: horariosAtualizados,
			});

			if (rpcError) {
				throw rpcError;
			}

			// Recarregar estabelecimento do banco para garantir sincronização
			const estabelecimentoId = estabelecimentoStore.id;
			if (estabelecimentoId) {
				await estabelecimentoStore.fetchEstabelecimento(estabelecimentoId);
			}

			success({
				title: "Horários atualizados",
				description: "Os horários de funcionamento foram salvos com sucesso",
			});

			return true;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao salvar horários";
			error.value = message;
			showError({
				title: "Erro ao salvar",
				description: message,
			});
			console.error("[useHorariosFuncionamento] Erro ao salvar horários:", err);
			return false;
		} finally {
			saving.value = false;
		}
	};

	/**
	 * Adicionar nova exceção (CREATE via RPC)
	 */
	const adicionarExcecao = async (excecao: Omit<HorarioExcecao, "id">): Promise<boolean> => {
		saving.value = true;
		error.value = null;

		try {
			// Chamar RPC para adicionar exceção
			const { error: rpcError } = await supabase.rpc("fn_rpc_configuracoes_adicionar_excecao", {
				p_data: excecao.data,
				p_nome: excecao.nome,
				p_aberto: excecao.aberto,
				p_periodos: excecao.periodos,
			});

			if (rpcError) {
				throw rpcError;
			}

			// Recarregar estabelecimento do banco para pegar dados atualizados
			const estabelecimentoId = estabelecimentoStore.id;
			if (estabelecimentoId) {
				await estabelecimentoStore.fetchEstabelecimento(estabelecimentoId);
			}

			success({
				title: "Exceção adicionada",
				description: "A exceção de horário foi criada com sucesso",
			});

			return true;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao adicionar exceção";
			error.value = message;
			showError({
				title: "Erro ao adicionar",
				description: message,
			});
			console.error("[useHorariosFuncionamento] Erro ao adicionar exceção:", err);
			return false;
		} finally {
			saving.value = false;
		}
	};

	/**
	 * Atualizar exceção existente (UPDATE via RPC)
	 */
	const atualizarExcecao = async (
		id: string,
		excecaoAtualizada: Partial<HorarioExcecao>,
	): Promise<boolean> => {
		saving.value = true;
		error.value = null;

		try {
			// Chamar RPC para atualizar exceção
			const { error: rpcError } = await supabase.rpc("fn_rpc_configuracoes_atualizar_excecao", {
				p_excecao_id: id,
				p_data: excecaoAtualizada.data,
				p_nome: excecaoAtualizada.nome,
				p_aberto: excecaoAtualizada.aberto,
				p_periodos: excecaoAtualizada.periodos,
			});

			if (rpcError) {
				throw rpcError;
			}

			// Recarregar estabelecimento do banco para pegar dados atualizados
			const estabelecimentoId = estabelecimentoStore.id;
			if (estabelecimentoId) {
				await estabelecimentoStore.fetchEstabelecimento(estabelecimentoId);
			}

			success({
				title: "Exceção atualizada",
				description: "A exceção de horário foi atualizada com sucesso",
			});

			return true;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao atualizar exceção";
			error.value = message;
			showError({
				title: "Erro ao atualizar",
				description: message,
			});
			console.error("[useHorariosFuncionamento] Erro ao atualizar exceção:", err);
			return false;
		} finally {
			saving.value = false;
		}
	};

	/**
	 * Remover exceção (DELETE via RPC)
	 */
	const removerExcecao = async (id: string): Promise<boolean> => {
		saving.value = true;
		error.value = null;

		try {
			// Chamar RPC para remover exceção
			const { error: rpcError } = await supabase.rpc("fn_rpc_configuracoes_remover_excecao", {
				p_excecao_id: id,
			});

			if (rpcError) {
				throw rpcError;
			}

			// Recarregar estabelecimento do banco para pegar dados atualizados
			const estabelecimentoId = estabelecimentoStore.id;
			if (estabelecimentoId) {
				await estabelecimentoStore.fetchEstabelecimento(estabelecimentoId);
			}

			success({
				title: "Exceção removida",
				description: "A exceção de horário foi removida com sucesso",
			});

			return true;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao remover exceção";
			error.value = message;
			showError({
				title: "Erro ao remover",
				description: message,
			});
			console.error("[useHorariosFuncionamento] Erro ao remover exceção:", err);
			return false;
		} finally {
			saving.value = false;
		}
	};

	// Watch para reagir a mudanças na store (dados carregados pelo plugin)
	watch(
		() => estabelecimentoStore.estabelecimento?.config_geral,
		() => {
			buscarHorarios();
		},
		{ immediate: true, deep: true },
	);

	return {
		// Dados
		horarios,
		excecoes,

		// Estados
		loading,
		saving,
		error,

		// Métodos
		buscarHorarios,
		salvarHorarios,
		adicionarExcecao,
		atualizarExcecao,
		removerExcecao,
	};
};
