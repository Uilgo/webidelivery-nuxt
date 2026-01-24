/**
 * 📌 useCupons - Gerenciamento de Cupons
 *
 * Responsável por:
 * - CRUD de cupons via RPC
 * - Leitura via RLS
 * - Validação de cupons
 * - Estatísticas de uso
 * - Filtros e busca
 */

import { useToast } from "~/composables/ui/useToast";
import type { CupomCompleto, CupomFormData, StatusCupom } from "#shared/types/marketing";
import type { CupomFilters, ValidacaoCupom } from "../types/marketing";

/** Interface para dados brutos do Supabase */
interface CupomRaw {
	id: string;
	created_at: string;
	updated_at: string;
	estabelecimento_id: string;
	codigo: string;
	tipo: "percentual" | "valor_fixo" | "frete_gratis";
	valor_desconto: number;
	valor_minimo: number | null;
	limite_uso: number | null;
	usos_realizados: number;
	data_expiracao: string | null;
	ativo: boolean;
	descricao: string | null;
	ordem: number;
}

/** Interface de retorno do composable */
export interface UseCuponsReturn {
	// Estado
	cupons: Ref<CupomCompleto[]>;
	loading: Readonly<Ref<boolean>>;
	error: Readonly<Ref<string | null>>;

	// Estatísticas
	cuponsCount: ComputedRef<number>;
	cuponsAtivos: ComputedRef<number>;
	cuponsExpirados: ComputedRef<number>;
	totalUsos: ComputedRef<number>;

	// CRUD
	createCupom: (data: CupomFormData) => Promise<void>;
	updateCupom: (id: string, data: CupomFormData) => Promise<void>;
	deleteCupom: (id: string) => Promise<void>;
	toggleCupomStatus: (id: string) => Promise<void>;

	// Ordenação
	reorderCupom: (id: string, newOrder: number) => Promise<void>;

	// Validação
	validateCupom: (codigo: string, valorPedido?: number) => Promise<ValidacaoCupom>;
	checkCodigoDisponivel: (codigo: string, cupomId?: string) => Promise<boolean>;

	// Filtros
	filteredCupons: ComputedRef<CupomCompleto[]>;
	applyFilters: (filters: CupomFilters) => void;

	// Utilitários
	refreshCupons: () => Promise<void>;
	duplicateCupom: (id: string) => Promise<void>;
	getCupomById: (id: string) => ComputedRef<CupomCompleto | undefined>;
}

export const useCupons = (): UseCuponsReturn => {
	const toast = useToast();
	const supabase = useSupabaseClient();

	// ========================================
	// ESTADO REATIVO
	// ========================================

	const cupons = ref<CupomCompleto[]>([]);
	const loading = ref(false);
	const error = ref<string | null>(null);
	const currentFilters = ref<CupomFilters>({});

	// ========================================
	// COMPUTADAS - ESTATÍSTICAS
	// ========================================

	const cuponsCount = computed(() => cupons.value.length);

	const cuponsAtivos = computed(
		() => cupons.value.filter((cupom) => cupom.ativo && cupom.periodo_valido).length,
	);

	const cuponsExpirados = computed(
		() => cupons.value.filter((cupom) => !cupom.periodo_valido).length,
	);

	const totalUsos = computed(() =>
		cupons.value.reduce((total, cupom) => total + cupom.usos_realizados, 0),
	);

	// ========================================
	// COMPUTADAS - FILTROS
	// ========================================

	const filteredCupons = computed(() => {
		let result = [...cupons.value];

		// Filtro por tipo
		if (currentFilters.value.tipo) {
			result = result.filter((cupom) => cupom.tipo === currentFilters.value.tipo);
		}

		// Filtro por status
		if (currentFilters.value.status) {
			result = result.filter((cupom) => cupom.status_cupom === currentFilters.value.status);
		}

		// Filtro por período
		if (currentFilters.value.periodo) {
			const { inicio, fim } = currentFilters.value.periodo;

			if (inicio) {
				result = result.filter((cupom) => new Date(cupom.created_at) >= new Date(inicio));
			}

			if (fim) {
				result = result.filter((cupom) => new Date(cupom.created_at) <= new Date(fim));
			}
		}

		// Busca por código ou descrição
		if (currentFilters.value.search) {
			const searchTerm = currentFilters.value.search.toLowerCase();
			result = result.filter(
				(cupom) =>
					cupom.codigo.toLowerCase().includes(searchTerm) ||
					cupom.descricao?.toLowerCase().includes(searchTerm),
			);
		}

		// Ordenar por ordem
		return result.sort((a, b) => a.ordem - b.ordem);
	});

	// ========================================
	// UTILITÁRIOS
	// ========================================

	/**
	 * Busca cupom por ID
	 */
	const getCupomById = (id: string): ComputedRef<CupomCompleto | undefined> => {
		return computed(() => cupons.value.find((cupom) => cupom.id === id));
	};

	/**
	 * Calcula status do cupom baseado nas regras de negócio
	 */
	const calculateCupomStatus = (cupom: {
		ativo: boolean;
		data_expiracao?: string | null;
		limite_uso?: number | null;
		usos_realizados: number;
	}): StatusCupom => {
		if (!cupom.ativo) {
			return "inativo";
		}

		if (cupom.data_expiracao && new Date(cupom.data_expiracao) < new Date()) {
			return "expirado";
		}

		if (cupom.limite_uso && cupom.usos_realizados >= cupom.limite_uso) {
			return "esgotado";
		}

		return "ativo";
	};

	/**
	 * Verifica se período é válido
	 */
	const checkPeriodoValido = (dataExpiracao?: string | null): boolean => {
		if (!dataExpiracao) return true;
		return new Date(dataExpiracao) >= new Date();
	};

	// ========================================
	// CRUD OPERATIONS
	// ========================================

	/**
	 * Busca todos os cupons via RLS
	 */
	const fetchCupons = async (): Promise<void> => {
		try {
			loading.value = true;
			error.value = null;

			const { data, error: supabaseError } = await supabase
				.from("cupons")
				.select("*")
				.order("ordem", { ascending: true });

			if (supabaseError) {
				throw supabaseError;
			}

			// Transformar dados para o formato esperado com campos calculados
			cupons.value = (data || []).map((cupom: CupomRaw) => ({
				...cupom,
				percentual_uso: cupom.limite_uso
					? Math.round((cupom.usos_realizados / cupom.limite_uso) * 100)
					: 0,
				usos_restantes: cupom.limite_uso
					? Math.max(0, cupom.limite_uso - cupom.usos_realizados)
					: null,
				status_cupom: calculateCupomStatus(cupom),
				periodo_valido: checkPeriodoValido(cupom.data_expiracao),
			}));
		} catch (err) {
			error.value = "Erro ao carregar cupons";
			console.error("Erro ao buscar cupons:", err);
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Cria novo cupom via RPC
	 */
	const createCupom = async (data: CupomFormData): Promise<void> => {
		try {
			loading.value = true;
			error.value = null;

			const { data: response, error: supabaseError } = await supabase.rpc("fn_cupons_criar", {
				p_codigo: data.codigo,
				p_tipo: data.tipo,
				// Para frete grátis, enviar 1 como valor simbólico (será calculado dinamicamente)
				// Para outros tipos, usar o valor fornecido ou 1 como fallback
				p_valor_desconto: data.valor_desconto && data.valor_desconto > 0 ? data.valor_desconto : 1,
				p_valor_minimo: data.valor_minimo,
				p_limite_uso: data.limite_uso,
				p_data_expiracao: data.data_expiracao,
				p_descricao: data.descricao,
			});

			if (supabaseError) {
				throw supabaseError;
			}

			if (response && response.length > 0) {
				const novoCupom = {
					...response[0],
					percentual_uso: 0,
					usos_restantes: response[0].limite_uso || null,
					status_cupom: "ativo" as StatusCupom,
					periodo_valido: checkPeriodoValido(response[0].data_expiracao),
				};
				cupons.value.push(novoCupom);
			}

			toast.success({ title: "Cupom criado com sucesso!" });
		} catch (err) {
			error.value = "Erro ao criar cupom";
			toast.error({ title: "Erro ao criar cupom" });
			throw err;
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Atualiza cupom existente via RPC
	 */
	const updateCupom = async (id: string, data: CupomFormData): Promise<void> => {
		try {
			loading.value = true;
			error.value = null;

			const { data: response, error: supabaseError } = await supabase.rpc("fn_cupons_atualizar", {
				p_cupom_id: id,
				p_codigo: data.codigo,
				p_tipo: data.tipo,
				// Para frete grátis, enviar 1 como valor simbólico (será calculado dinamicamente)
				// Para outros tipos, usar o valor fornecido ou 1 como fallback
				p_valor_desconto: data.valor_desconto && data.valor_desconto > 0 ? data.valor_desconto : 1,
				p_valor_minimo: data.valor_minimo,
				p_limite_uso: data.limite_uso,
				p_data_expiracao: data.data_expiracao,
				p_descricao: data.descricao,
			});

			if (supabaseError) {
				throw supabaseError;
			}

			if (response && response.length > 0) {
				const index = cupons.value.findIndex((cupom) => cupom.id === id);
				if (index !== -1) {
					cupons.value[index] = {
						...response[0],
						percentual_uso: response[0].limite_uso
							? Math.round((response[0].usos_realizados / response[0].limite_uso) * 100)
							: 0,
						usos_restantes: response[0].limite_uso
							? Math.max(0, response[0].limite_uso - response[0].usos_realizados)
							: null,
						status_cupom: calculateCupomStatus(response[0]),
						periodo_valido: checkPeriodoValido(response[0].data_expiracao),
					};
				}
			}

			toast.success({ title: "Cupom atualizado com sucesso!" });
		} catch (err) {
			error.value = "Erro ao atualizar cupom";
			toast.error({ title: "Erro ao atualizar cupom" });
			throw err;
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Exclui cupom via RPC
	 */
	const deleteCupom = async (id: string): Promise<void> => {
		try {
			loading.value = true;
			error.value = null;

			const { error: supabaseError } = await supabase.rpc("fn_cupons_excluir", {
				p_cupom_id: id,
			});

			if (supabaseError) {
				throw supabaseError;
			}

			cupons.value = cupons.value.filter((cupom) => cupom.id !== id);
			toast.success({ title: "Cupom excluído com sucesso!" });
		} catch (err) {
			error.value = "Erro ao excluir cupom";
			toast.error({ title: "Erro ao excluir cupom" });
			throw err;
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Alterna status do cupom (ativo/inativo) via RPC
	 */
	const toggleCupomStatus = async (id: string): Promise<void> => {
		try {
			const { data: response, error: supabaseError } = await supabase.rpc(
				"fn_cupons_toggle_ativo",
				{
					p_cupom_id: id,
				},
			);

			if (supabaseError) {
				throw supabaseError;
			}

			if (response && response.length > 0) {
				const index = cupons.value.findIndex((c) => c.id === id);
				if (index !== -1) {
					cupons.value[index] = {
						...response[0],
						percentual_uso: response[0].limite_uso
							? Math.round((response[0].usos_realizados / response[0].limite_uso) * 100)
							: 0,
						usos_restantes: response[0].limite_uso
							? Math.max(0, response[0].limite_uso - response[0].usos_realizados)
							: null,
						status_cupom: calculateCupomStatus(response[0]),
						periodo_valido: checkPeriodoValido(response[0].data_expiracao),
					};
				}

				const status = response[0].ativo ? "ativado" : "desativado";
				toast.success({ title: `Cupom ${status} com sucesso!` });
			}
		} catch (err) {
			error.value = "Erro ao alterar status do cupom";
			toast.error({ title: "Erro ao alterar status do cupom" });
			throw err;
		}
	};

	/**
	 * Duplica cupom existente via RPC
	 */
	const duplicateCupom = async (id: string): Promise<void> => {
		try {
			loading.value = true;
			error.value = null;

			const { data: response, error: supabaseError } = await supabase.rpc("fn_cupons_duplicar", {
				p_cupom_id: id,
			});

			if (supabaseError) {
				throw supabaseError;
			}

			if (response && response.length > 0) {
				const novoCupom = {
					...response[0],
					percentual_uso: 0,
					usos_restantes: response[0].limite_uso || null,
					status_cupom: calculateCupomStatus(response[0]), // Calcular status baseado no estado atual
					periodo_valido: checkPeriodoValido(response[0].data_expiracao),
				};
				cupons.value.push(novoCupom);
			}

			toast.success({ title: "Cupom duplicado com sucesso!" });
		} catch (err) {
			error.value = "Erro ao duplicar cupom";
			toast.error({ title: "Erro ao duplicar cupom" });
			throw err;
		} finally {
			loading.value = false;
		}
	};

	// ========================================
	// ORDENAÇÃO
	// ========================================

	/**
	 * Reordena cupom para nova posição via RPC
	 */
	const reorderCupom = async (id: string, newOrder: number): Promise<void> => {
		try {
			const { data: response, error: supabaseError } = await supabase.rpc("fn_cupons_reordenar", {
				p_cupom_id: id,
				p_new_ordem: newOrder,
			});

			if (supabaseError) {
				throw supabaseError;
			}

			if (response && response.length > 0) {
				// Atualizar todos os cupons com a nova ordenação
				cupons.value = response.map((cupom: CupomRaw) => ({
					...cupom,
					percentual_uso: cupom.limite_uso
						? Math.round((cupom.usos_realizados / cupom.limite_uso) * 100)
						: 0,
					usos_restantes: cupom.limite_uso
						? Math.max(0, cupom.limite_uso - cupom.usos_realizados)
						: null,
					status_cupom: calculateCupomStatus(cupom),
					periodo_valido: checkPeriodoValido(cupom.data_expiracao),
				}));
			}

			toast.success({ title: "Cupom reordenado com sucesso!" });
		} catch (err) {
			error.value = "Erro ao reordenar cupom";
			toast.error({ title: "Erro ao reordenar cupom" });
			throw err;
		}
	};

	// ========================================
	// VALIDAÇÃO
	// ========================================

	/**
	 * Valida cupom para uso no checkout
	 */
	const validateCupom = async (codigo: string, valorPedido = 0): Promise<ValidacaoCupom> => {
		try {
			const { data: response, error: supabaseError } = await supabase.rpc("fn_cupons_validar", {
				p_codigo: codigo,
				p_valor_pedido: valorPedido,
			});

			if (supabaseError) {
				throw supabaseError;
			}

			if (response && response.length > 0) {
				const result = response[0];
				return {
					codigo: result.codigo,
					valido: result.valido,
					motivo_invalido: result.motivo_invalido,
					valor_desconto: result.valor_desconto,
					valor_minimo: result.valor_minimo,
					desconto_aplicado: result.desconto_aplicado,
				};
			}

			return {
				codigo,
				valido: false,
				motivo_invalido: "Erro na validação",
			};
		} catch (err) {
			console.error("Erro ao validar cupom:", err);
			return {
				codigo,
				valido: false,
				motivo_invalido: "Erro na validação",
			};
		}
	};

	/**
	 * Verifica se código está disponível
	 */
	const checkCodigoDisponivel = async (codigo: string, cupomId?: string): Promise<boolean> => {
		try {
			// Se estiver editando e o código for o mesmo, considerar disponível
			if (cupomId) {
				const cupomAtual = cupons.value.find((c) => c.id === cupomId);
				if (cupomAtual && cupomAtual.codigo.toUpperCase() === codigo.toUpperCase()) {
					return true;
				}
			}

			const query = supabase.from("cupons").select("id").ilike("codigo", codigo);

			// Se estiver editando, excluir o próprio cupom da verificação
			if (cupomId) {
				query.neq("id", cupomId);
			}

			const { data, error: supabaseError } = await query;

			if (supabaseError) {
				throw supabaseError;
			}

			return !data || data.length === 0;
		} catch (err) {
			console.error("Erro ao verificar código:", err);
			return false;
		}
	};

	// ========================================
	// FILTROS
	// ========================================

	/**
	 * Aplica filtros aos cupons
	 */
	const applyFilters = (filters: CupomFilters): void => {
		currentFilters.value = filters;
	};

	// ========================================
	// UTILITÁRIOS
	// ========================================

	/**
	 * Recarrega lista de cupons
	 */
	const refreshCupons = async (): Promise<void> => {
		await fetchCupons();
	};

	// ========================================
	// INICIALIZAÇÃO
	// ========================================

	// Carregar cupons na inicialização
	onMounted(() => {
		fetchCupons();
	});

	// ========================================
	// RETORNO
	// ========================================

	return {
		// Estado
		cupons,
		loading: readonly(loading),
		error: readonly(error),

		// Estatísticas
		cuponsCount,
		cuponsAtivos,
		cuponsExpirados,
		totalUsos,

		// CRUD
		createCupom,
		updateCupom,
		deleteCupom,
		toggleCupomStatus,

		// Ordenação
		reorderCupom,

		// Validação
		validateCupom,
		checkCodigoDisponivel,

		// Filtros
		filteredCupons,
		applyFilters,

		// Utilitários
		refreshCupons,
		duplicateCupom,
		getCupomById,
	};
};
