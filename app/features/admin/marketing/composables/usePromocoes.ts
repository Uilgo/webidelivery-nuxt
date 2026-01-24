/**
 * 📌 usePromocoes - Gerenciamento de Promoções
 *
 * Responsável por:
 * - CRUD de promoções via RPC
 * - Leitura via RLS
 * - Validação de períodos
 * - Cálculo de descontos
 * - Aplicação automática
 * - Filtros e busca
 */

import { useToast } from "~/composables/ui/useToast";
import type { PromocaoCompleta, PromocaoFormData } from "#shared/types/marketing";
import type { PromocaoFilters, ValidacaoPromocao } from "../types/marketing";

/** Interface de retorno do composable */
export interface UsePromocoesReturn {
	// Estado
	promocoes: Ref<PromocaoCompleta[]>;
	loading: Readonly<Ref<boolean>>;
	error: Readonly<Ref<string | null>>;

	// Estatísticas
	promocoesCount: ComputedRef<number>;
	promocoesAtivas: ComputedRef<number>;
	promocoesExpiradas: ComputedRef<number>;
	economiaTotal: ComputedRef<number>;

	// CRUD
	createPromocao: (data: PromocaoFormData) => Promise<void>;
	updatePromocao: (id: string, data: PromocaoFormData) => Promise<void>;
	deletePromocao: (id: string) => Promise<void>;
	togglePromocaoStatus: (id: string) => Promise<void>;

	// Ordenação
	reorderPromocao: (id: string, newOrder: number) => Promise<void>;

	// Validação
	validatePromocao: (id: string) => Promise<ValidacaoPromocao>;
	checkPeriodoValido: (dataInicio: string, dataFim?: string) => boolean;

	// Cálculos
	calculateDesconto: (promocao: PromocaoCompleta, valor: number) => number;
	getPromocoesAplicaveis: (produtos: string[], categorias: string[]) => PromocaoCompleta[];

	// Filtros
	filteredPromocoes: ComputedRef<PromocaoCompleta[]>;
	applyFilters: (filters: PromocaoFilters) => void;

	// Utilitários
	refreshPromocoes: () => Promise<void>;
	duplicatePromocao: (id: string) => Promise<void>;
	extendPromocao: (id: string, novaDataFim: string) => Promise<void>;
	getPromocaoById: (id: string) => ComputedRef<PromocaoCompleta | undefined>;
}

export const usePromocoes = (): UsePromocoesReturn => {
	const toast = useToast();
	const supabase = useSupabaseClient();

	// ========================================
	// ESTADO REATIVO
	// ========================================

	const promocoes = ref<PromocaoCompleta[]>([]);
	const loading = ref(false);
	const error = ref<string | null>(null);
	const currentFilters = ref<PromocaoFilters>({});

	// ========================================
	// COMPUTADAS - ESTATÍSTICAS
	// ========================================

	const promocoesCount = computed(() => promocoes.value.length);

	const promocoesAtivas = computed(
		() => promocoes.value.filter((promocao) => promocao.ativo && promocao.periodo_valido).length,
	);

	const promocoesExpiradas = computed(
		() => promocoes.value.filter((promocao) => !promocao.periodo_valido).length,
	);

	const economiaTotal = computed(() => {
		// Calcular economia total baseada nas promoções ativas
		// Por enquanto retorna 0, será implementado quando tivermos dados de uso
		return 0;
	});

	// ========================================
	// COMPUTADAS - FILTROS
	// ========================================

	const filteredPromocoes = computed(() => {
		let result = [...promocoes.value];

		// Filtro por tipo
		if (currentFilters.value.tipo) {
			result = result.filter((promocao) => promocao.tipo === currentFilters.value.tipo);
		}

		// Filtro por status
		if (currentFilters.value.status) {
			switch (currentFilters.value.status) {
				case "ativo":
					result = result.filter((promocao) => promocao.ativo && promocao.periodo_valido);
					break;
				case "inativo":
					result = result.filter((promocao) => !promocao.ativo);
					break;
				case "expirado":
					result = result.filter((promocao) => !promocao.periodo_valido);
					break;
			}
		}

		// Filtro por período
		if (currentFilters.value.periodo) {
			const hoje = new Date();
			const inicioSemana = new Date(hoje.setDate(hoje.getDate() - hoje.getDay()));
			const fimSemana = new Date(inicioSemana);
			fimSemana.setDate(inicioSemana.getDate() + 6);

			switch (currentFilters.value.periodo) {
				case "hoje":
					result = result.filter((promocao) => {
						const inicio = new Date(promocao.data_inicio);
						const fim = promocao.data_fim ? new Date(promocao.data_fim) : null;
						const hoje = new Date();
						return inicio <= hoje && (!fim || fim >= hoje);
					});
					break;
				case "semana":
					result = result.filter((promocao) => {
						const inicio = new Date(promocao.data_inicio);
						return inicio >= inicioSemana && inicio <= fimSemana;
					});
					break;
			}
		}

		// Busca por nome
		if (currentFilters.value.search) {
			const searchTerm = currentFilters.value.search.toLowerCase();
			result = result.filter(
				(promocao) =>
					promocao.nome.toLowerCase().includes(searchTerm) ||
					promocao.descricao?.toLowerCase().includes(searchTerm),
			);
		}

		// Ordenar por ordem
		return result.sort((a, b) => a.ordem - b.ordem);
	});

	// ========================================
	// UTILITÁRIOS
	// ========================================

	/**
	 * Busca promoção por ID
	 */
	const getPromocaoById = (id: string): ComputedRef<PromocaoCompleta | undefined> => {
		return computed(() => promocoes.value.find((promocao) => promocao.id === id));
	};

	/**
	 * Verifica se período é válido
	 */
	const checkPeriodoValido = (dataInicio: string, dataFim?: string): boolean => {
		const hoje = new Date();
		const inicio = new Date(dataInicio);

		if (inicio > hoje) {
			return false; // Ainda não começou
		}

		if (dataFim) {
			const fim = new Date(dataFim);
			return fim >= hoje; // Não expirou
		}

		return true; // Sem data fim, sempre válido se já começou
	};

	/**
	 * Calcula desconto aplicado
	 */
	const calculateDesconto = (promocao: PromocaoCompleta, valor: number): number => {
		if (!promocao.ativo || !promocao.periodo_valido) {
			return 0;
		}

		switch (promocao.tipo) {
			case "desconto_produto":
			case "desconto_categoria":
				return (valor * promocao.desconto) / 100;
			case "combo_promocional":
				return promocao.desconto; // Valor fixo
			case "leve_pague":
				// Lógica específica para leve X pague Y
				return (valor * promocao.desconto) / 100;
			default:
				return 0;
		}
	};

	/**
	 * Obtém promoções aplicáveis para produtos/categorias
	 */
	const getPromocoesAplicaveis = (
		_produtos: string[],
		_categorias: string[],
	): PromocaoCompleta[] => {
		return promocoes.value.filter((promocao) => {
			if (!promocao.ativo || !promocao.periodo_valido) {
				return false;
			}

			// Por enquanto retorna todas as promoções ativas
			// Implementar lógica específica quando tivermos relacionamentos
			return true;
		});
	};

	// ========================================
	// CRUD OPERATIONS
	// ========================================

	/**
	 * Busca todas as promoções via RLS
	 */
	const fetchPromocoes = async (): Promise<void> => {
		try {
			loading.value = true;
			error.value = null;

			const { data, error: supabaseError } = await supabase
				.from("promocoes")
				.select("*")
				.order("ordem", { ascending: true });

			if (supabaseError) {
				throw supabaseError;
			}

			// Transformar dados para o formato esperado com campos calculados
			promocoes.value = (data || []).map((promocao) => ({
				...promocao,
				periodo_valido: checkPeriodoValido(promocao.data_inicio, promocao.data_fim),
				dias_restantes: promocao.data_fim
					? Math.ceil((new Date(promocao.data_fim).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
					: null,
			}));
		} catch (err) {
			error.value = "Erro ao carregar promoções";
			console.error("Erro ao buscar promoções:", err);
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Cria nova promoção via RPC
	 */
	const createPromocao = async (data: PromocaoFormData): Promise<void> => {
		try {
			loading.value = true;
			error.value = null;

			const { data: response, error: supabaseError } = await supabase.rpc("fn_promocoes_criar", {
				p_nome: data.nome,
				p_descricao: data.descricao,
				p_tipo: data.tipo,
				p_desconto: data.desconto,
				p_data_inicio: data.data_inicio,
				p_data_fim: data.data_fim,
				p_ativo: true, // Promoção criada sempre ativa
			});

			if (supabaseError) {
				throw supabaseError;
			}

			if (response && response.length > 0) {
				promocoes.value.push(response[0]);
			}

			toast.success({ title: "Promoção criada com sucesso!" });
		} catch (err) {
			error.value = "Erro ao criar promoção";
			toast.error({ title: "Erro ao criar promoção" });
			throw err;
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Atualiza promoção existente via RPC
	 */
	const updatePromocao = async (id: string, data: PromocaoFormData): Promise<void> => {
		try {
			loading.value = true;
			error.value = null;

			const { data: response, error: supabaseError } = await supabase.rpc(
				"fn_promocoes_atualizar",
				{
					p_promocao_id: id,
					p_nome: data.nome,
					p_descricao: data.descricao,
					p_tipo: data.tipo,
					p_desconto: data.desconto,
					p_data_inicio: data.data_inicio,
					p_data_fim: data.data_fim,
					p_ativo: true, // Manter ativo na atualização
				},
			);

			if (supabaseError) {
				throw supabaseError;
			}

			if (response && response.length > 0) {
				const index = promocoes.value.findIndex((promocao) => promocao.id === id);
				if (index !== -1) {
					promocoes.value[index] = response[0];
				}
			}

			toast.success({ title: "Promoção atualizada com sucesso!" });
		} catch (err) {
			error.value = "Erro ao atualizar promoção";
			toast.error({ title: "Erro ao atualizar promoção" });
			throw err;
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Exclui promoção via RPC
	 */
	const deletePromocao = async (id: string): Promise<void> => {
		try {
			loading.value = true;
			error.value = null;

			const { error: supabaseError } = await supabase.rpc("fn_promocoes_excluir", {
				p_promocao_id: id,
			});

			if (supabaseError) {
				throw supabaseError;
			}

			promocoes.value = promocoes.value.filter((promocao) => promocao.id !== id);
			toast.success({ title: "Promoção excluída com sucesso!" });
		} catch (err) {
			error.value = "Erro ao excluir promoção";
			toast.error({ title: "Erro ao excluir promoção" });
			throw err;
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Alterna status da promoção (ativo/inativo) via RPC
	 */
	const togglePromocaoStatus = async (id: string): Promise<void> => {
		try {
			const { data: response, error: supabaseError } = await supabase.rpc(
				"fn_promocoes_toggle_ativo",
				{
					p_promocao_id: id,
				},
			);

			if (supabaseError) {
				throw supabaseError;
			}

			if (response && response.length > 0) {
				const index = promocoes.value.findIndex((p) => p.id === id);
				if (index !== -1) {
					promocoes.value[index] = response[0];
				}

				const status = response[0].ativo ? "ativada" : "desativada";
				toast.success({ title: `Promoção ${status} com sucesso!` });
			}
		} catch (err) {
			error.value = "Erro ao alterar status da promoção";
			toast.error({ title: "Erro ao alterar status da promoção" });
			throw err;
		}
	};

	/**
	 * Duplica promoção existente via RPC
	 */
	const duplicatePromocao = async (id: string): Promise<void> => {
		try {
			loading.value = true;
			error.value = null;

			const { data: response, error: supabaseError } = await supabase.rpc("fn_promocoes_duplicar", {
				p_promocao_id: id,
			});

			if (supabaseError) {
				throw supabaseError;
			}

			if (response && response.length > 0) {
				promocoes.value.push(response[0]);
			}

			toast.success({ title: "Promoção duplicada com sucesso!" });
		} catch (err) {
			error.value = "Erro ao duplicar promoção";
			toast.error({ title: "Erro ao duplicar promoção" });
			throw err;
		} finally {
			loading.value = false;
		}
	};

	// ========================================
	// ORDENAÇÃO
	// ========================================

	/**
	 * Reordena promoção para nova posição via RPC
	 */
	const reorderPromocao = async (id: string, newOrder: number): Promise<void> => {
		try {
			const { data: response, error: supabaseError } = await supabase.rpc(
				"fn_promocoes_reordenar",
				{
					p_promocao_id: id,
					p_new_ordem: newOrder,
				},
			);

			if (supabaseError) {
				throw supabaseError;
			}

			if (response && response.length > 0) {
				// Atualizar todas as promoções com a nova ordenação
				promocoes.value = response;
			}

			toast.success({ title: "Promoção reordenada com sucesso!" });
		} catch (err) {
			error.value = "Erro ao reordenar promoção";
			toast.error({ title: "Erro ao reordenar promoção" });
			throw err;
		}
	};

	// ========================================
	// VALIDAÇÃO
	// ========================================

	/**
	 * Valida promoção específica
	 */
	const validatePromocao = async (id: string): Promise<ValidacaoPromocao> => {
		try {
			const promocao = promocoes.value.find((p) => p.id === id);

			if (!promocao) {
				return {
					promocao_id: id,
					valida: false,
					motivo_invalido: "Promoção não encontrada",
				};
			}

			if (!promocao.ativo) {
				return {
					promocao_id: id,
					valida: false,
					motivo_invalido: "Promoção inativa",
				};
			}

			if (!promocao.periodo_valido) {
				return {
					promocao_id: id,
					valida: false,
					motivo_invalido: "Promoção expirada",
				};
			}

			return {
				promocao_id: id,
				valida: true,
				desconto_aplicado: promocao.desconto,
			};
		} catch {
			return {
				promocao_id: id,
				valida: false,
				motivo_invalido: "Erro na validação",
			};
		}
	};

	// ========================================
	// UTILITÁRIOS ESPECÍFICOS
	// ========================================

	/**
	 * Estende período da promoção
	 */
	const extendPromocao = async (id: string, novaDataFim: string): Promise<void> => {
		try {
			const promocao = promocoes.value.find((p) => p.id === id);
			if (!promocao) {
				throw new Error("Promoção não encontrada");
			}

			await updatePromocao(id, {
				nome: promocao.nome,
				descricao: promocao.descricao || undefined,
				tipo: promocao.tipo,
				desconto: promocao.desconto,
				data_inicio: promocao.data_inicio,
				data_fim: novaDataFim,
			});

			toast.success({ title: "Período da promoção estendido!" });
		} catch (err) {
			toast.error({ title: "Erro ao estender promoção" });
			throw err;
		}
	};

	// ========================================
	// FILTROS
	// ========================================

	/**
	 * Aplica filtros às promoções
	 */
	const applyFilters = (filters: PromocaoFilters): void => {
		currentFilters.value = filters;
	};

	// ========================================
	// UTILITÁRIOS
	// ========================================

	/**
	 * Recarrega lista de promoções
	 */
	const refreshPromocoes = async (): Promise<void> => {
		await fetchPromocoes();
	};

	// ========================================
	// INICIALIZAÇÃO
	// ========================================

	// Carregar promoções na inicialização
	onMounted(() => {
		fetchPromocoes();
	});

	// ========================================
	// RETORNO
	// ========================================

	return {
		// Estado
		promocoes,
		loading: readonly(loading),
		error: readonly(error),

		// Estatísticas
		promocoesCount,
		promocoesAtivas,
		promocoesExpiradas,
		economiaTotal,

		// CRUD
		createPromocao,
		updatePromocao,
		deletePromocao,
		togglePromocaoStatus,

		// Ordenação
		reorderPromocao,

		// Validação
		validatePromocao,
		checkPeriodoValido,

		// Cálculos
		calculateDesconto,
		getPromocoesAplicaveis,

		// Filtros
		filteredPromocoes,
		applyFilters,

		// Utilitários
		refreshPromocoes,
		duplicatePromocao,
		extendPromocao,
		getPromocaoById,
	};
};
