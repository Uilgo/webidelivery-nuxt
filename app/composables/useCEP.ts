/**
 * 📌 useCEP
 *
 * Composable reativo para consulta de CEP.
 * Utiliza o utilitário consultarCEP com estados reativos e debounce.
 */

import { consultarCEP } from "../../services/api/cep";
import { isValidCEP, parseCEP } from "../../lib/formatters/address";
import type { EnderecoViaCEP } from "../../services/api/cep";

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
			const resultado = await consultarCEP(cepRef.value);

			if ("error" in resultado) {
				error.value = resultado.message;
				data.value = null;
			} else {
				data.value = resultado;
				error.value = null;
			}
		} catch (err) {
			error.value = err instanceof Error ? err.message : "Erro desconhecido";
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
