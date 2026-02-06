/**
 * 📌 useCEP
 *
 * Composable reativo para consulta de CEP.
 * Utiliza endpoint server-side /api/cep/:cep com estados reativos e debounce.
 */

import { isValidCEP } from "~/lib/validators/cep";
import { parseCEP } from "~/lib/formatters/cep";

/**
 * Interface padronizada para resposta da API de CEP
 */
export interface EnderecoViaCEP {
	cep: string;
	logradouro: string;
	complemento?: string;
	bairro: string;
	localidade: string; // cidade
	uf: string;
	estado: string;
	regiao?: string;
	ibge?: string;
	ddd?: string;
	siafi?: string;
}

/**
 * Composable para consulta de CEP reativa
 *
 * @param cep - CEP a ser consultado
 * @returns Ref reativo com o resultado
 *
 * @example
 * const { data, error, loading } = useCEP('01001-000')
 */
export const useCEP = (cep: Ref<string> | string) => {
	const cepRef = typeof cep === "string" ? ref(cep) : cep;
	const data = ref<EnderecoViaCEP | null>(null);
	const error = ref<string | null>(null);
	const loading = ref(false);

	const buscar = async () => {
		if (!cepRef.value || !isValidCEP(parseCEP(cepRef.value))) {
			data.value = null;
			error.value = "CEP inválido";
			return;
		}

		loading.value = true;
		error.value = null;

		try {
			// Chama endpoint server-side
			const cepLimpo = parseCEP(cepRef.value);
			const resultado = await $fetch<EnderecoViaCEP>(`/api/cep/${cepLimpo}`);

			data.value = resultado;
			error.value = null;
		} catch (err) {
			// Trata erros do endpoint
			if (err && typeof err === "object" && "statusMessage" in err) {
				error.value = (err as { statusMessage: string }).statusMessage;
			} else {
				error.value = err instanceof Error ? err.message : "Erro ao consultar CEP";
			}
			data.value = null;
		} finally {
			loading.value = false;
		}
	};

	// Buscar automaticamente quando CEP mudar (com debounce)
	const debouncedBuscar = debounce(buscar, 500);

	watch(
		cepRef,
		(novoCep) => {
			if (novoCep && isValidCEP(parseCEP(novoCep))) {
				debouncedBuscar();
			}
		},
		{ immediate: true },
	);

	return {
		data: readonly(data),
		error: readonly(error),
		loading: readonly(loading),
		buscar,
	};
};

/**
 * Função de debounce simples
 */
function debounce<T extends (...args: unknown[]) => unknown>(func: T, wait: number): T {
	let timeout: NodeJS.Timeout;
	return ((...args: unknown[]) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => func(...args), wait);
	}) as T;
}
