/**
 * 📌 useConfiguracoes - Composable Orquestrador de Configurações
 *
 * Unifica todos os composables de configurações em uma API única:
 * - useDadosEmpresa (dados da empresa)
 * - useHorariosFuncionamento (horários)
 * - usePagamentos (métodos de pagamento)
 * - useFreteEntrega (frete e entrega)
 * - usePersonalizacao (tema e personalização)
 */

import { useDadosEmpresa } from "./useDadosEmpresa";
import { useHorariosFuncionamento } from "./useHorariosFuncionamento";
import { usePagamentos } from "./usePagamentos";
import { useFreteEntrega } from "./useFreteEntrega";
import { usePersonalizacao } from "./usePersonalizacao";

export interface UseConfiguracoesReturn {
	// Composables específicos
	dadosEmpresa: ReturnType<typeof useDadosEmpresa>;
	horarios: ReturnType<typeof useHorariosFuncionamento>;
	pagamentos: ReturnType<typeof usePagamentos>;
	freteEntrega: ReturnType<typeof useFreteEntrega>;
	personalizacao: ReturnType<typeof usePersonalizacao>;

	// Estado global de loading
	isLoading: ComputedRef<boolean>;
	hasError: ComputedRef<boolean>;
}

export const useConfiguracoes = (): UseConfiguracoesReturn => {
	// Instanciar todos os composables
	const dadosEmpresa = useDadosEmpresa();
	const horarios = useHorariosFuncionamento();
	const pagamentos = usePagamentos();
	const freteEntrega = useFreteEntrega();
	const personalizacao = usePersonalizacao();

	// Estado global de loading (qualquer composable carregando)
	const isLoading = computed(
		() =>
			dadosEmpresa.loading.value ||
			horarios.loading.value ||
			pagamentos.loading.value ||
			freteEntrega.loading.value ||
			personalizacao.loading.value,
	);

	// Estado global de erro (qualquer composable com erro)
	const hasError = computed(
		() =>
			!!dadosEmpresa.error.value ||
			!!horarios.error.value ||
			!!pagamentos.error.value ||
			!!freteEntrega.error.value ||
			!!personalizacao.error.value,
	);

	return {
		// Composables específicos
		dadosEmpresa,
		horarios,
		pagamentos,
		freteEntrega,
		personalizacao,

		// Estados globais
		isLoading,
		hasError,
	};
};
