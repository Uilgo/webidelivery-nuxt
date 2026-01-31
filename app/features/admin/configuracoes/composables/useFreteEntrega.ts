/**
 * 📌 useFreteEntrega - Gerenciamento de Frete e Entrega
 *
 * Responsável por:
 * - Buscar configurações de frete e entrega (config_geral)
 * - Atualizar configurações via RPC fn_rpc_admin_atualizar_estabelecimento
 */

import type {
	TipoTaxaEntrega,
	TaxaLocalizacao,
	ConfigGeral as ConfiguracoesGerais,
} from "#shared/types/estabelecimentos";
import { useEstabelecimentoStore } from "~/stores/estabelecimento";
import { useToast } from "~/composables/ui/useToast";

export interface ConfigFreteEntrega {
	taxa_entrega: number;
	tipo_taxa_entrega: TipoTaxaEntrega;
	cidades_atendidas: string[]; // Cidades onde o estabelecimento faz entregas
	taxas_por_localizacao: TaxaLocalizacao[];
	taxa_padrao_outros_bairros?: number; // Taxa para bairros não cadastrados
	tempo_preparo_min: number;
	tempo_preparo_max: number;
	valor_minimo_pedido: number;
}

export interface UseFreteEntregaReturn {
	// Dados
	configuracoes: Ref<ConfigFreteEntrega | null>;

	// Estados
	loading: Ref<boolean>;
	saving: Ref<boolean>;
	error: Ref<string | null>;

	// Métodos
	buscarConfiguracoes: () => Promise<void>;
	salvarConfiguracoes: (config: Partial<ConfigFreteEntrega>) => Promise<boolean>;
}

export const useFreteEntrega = (): UseFreteEntregaReturn => {
	const supabase = useSupabaseClient();
	const estabelecimentoStore = useEstabelecimentoStore();
	const { success, error: showError } = useToast();

	// Estados
	const configuracoes = ref<ConfigFreteEntrega | null>(null);
	const loading = ref(false);
	const saving = ref(false);
	const error = ref<string | null>(null);

	/**
	 * Buscar configurações de frete e entrega (READ via RLS)
	 */
	const buscarConfiguracoes = async (): Promise<void> => {
		loading.value = true;
		error.value = null;

		try {
			const estabelecimento = estabelecimentoStore.estabelecimento;

			if (!estabelecimento) {
				throw new Error("Estabelecimento não encontrado");
			}

			// Extrair config_geral
			const configGeral = estabelecimento.config_geral as ConfiguracoesGerais | null;

			configuracoes.value = {
				taxa_entrega: configGeral?.taxa_entrega || 0,
				tipo_taxa_entrega: configGeral?.tipo_taxa_entrega || "taxa_unica",
				cidades_atendidas: configGeral?.cidades_atendidas || [],
				taxas_por_localizacao: (configGeral?.taxas_por_localizacao || []) as TaxaLocalizacao[],
				taxa_padrao_outros_bairros: configGeral?.taxa_padrao_outros_bairros || 0,
				tempo_preparo_min: configGeral?.tempo_preparo_min || 30,
				tempo_preparo_max: configGeral?.tempo_preparo_max || 60,
				valor_minimo_pedido: configGeral?.valor_minimo_pedido || 0,
			};
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao buscar configurações de frete";
			error.value = message;
			console.error("[useFreteEntrega] Erro ao buscar configurações:", err);
		} finally {
			loading.value = false;
		}
	};

	/**
	 * Salvar configurações de frete e entrega (UPDATE via RPC)
	 */
	const salvarConfiguracoes = async (
		configAtualizadas: Partial<ConfigFreteEntrega>,
	): Promise<boolean> => {
		saving.value = true;
		error.value = null;

		try {
			// Mesclar com configurações existentes
			const configAtual = estabelecimentoStore.estabelecimento
				?.config_geral as ConfiguracoesGerais | null;

			const novaConfig = {
				...configAtual,
				...configAtualizadas,
			};

			// Chamar RPC fn_rpc_admin_atualizar_estabelecimento
			const { error: rpcError } = await supabase.rpc("fn_rpc_admin_atualizar_estabelecimento", {
				p_dados: {
					config_geral: novaConfig,
				},
			});

			if (rpcError) {
				throw rpcError;
			}

			// Atualizar store local usando função mutadora
			if (estabelecimentoStore.estabelecimento) {
				estabelecimentoStore.$patch((state) => {
					if (state.estabelecimento) {
						const configAtual = (state.estabelecimento.config_geral || {}) as Record<
							string,
							unknown
						>;
						state.estabelecimento.config_geral = {
							...configAtual,
							...configAtualizadas,
						};
					}
				});
			}

			// Atualizar dados locais
			if (configuracoes.value) {
				configuracoes.value = {
					...configuracoes.value,
					...configAtualizadas,
				};
			}

			success({
				title: "Configurações atualizadas",
				description: "As configurações de frete e entrega foram salvas com sucesso",
			});

			return true;
		} catch (err) {
			const message = err instanceof Error ? err.message : "Erro ao salvar configurações de frete";
			error.value = message;
			showError({
				title: "Erro ao salvar",
				description: message,
			});
			console.error("[useFreteEntrega] Erro ao salvar configurações:", err);
			return false;
		} finally {
			saving.value = false;
		}
	};

	// Watch para reagir a mudanças na store (dados carregados pelo plugin)
	watch(
		() => estabelecimentoStore.estabelecimento?.config_geral,
		() => {
			buscarConfiguracoes();
		},
		{ immediate: true },
	);

	return {
		// Dados
		configuracoes,

		// Estados
		loading,
		saving,
		error,

		// Métodos
		buscarConfiguracoes,
		salvarConfiguracoes,
	};
};
