/**
 * 🎯 Utilitário de Debounce para Filtros
 *
 * Wrapper para adicionar debounce em filtros de busca de forma consistente.
 * Reduz processamento e melhora performance em listas grandes.
 *
 * @example
 * ```typescript
 * const { searchInput, debouncedSearch, setSearch } = useDebouncedSearch(
 *   (value) => filters.value.busca = value,
 *   300
 * );
 * ```
 */

import { useDebounceFn } from "@vueuse/core";

export interface DebouncedSearchReturn {
	/**
	 * Valor do input (atualizado imediatamente)
	 */
	searchInput: Ref<string>;

	/**
	 * Valor debounced (atualizado com delay)
	 */
	debouncedValue: Readonly<Ref<string>>;

	/**
	 * Função para atualizar a busca
	 */
	setSearch: (value: string) => void;

	/**
	 * Limpa a busca
	 */
	clearSearch: () => void;
}

/**
 * Cria um composable de busca com debounce
 *
 * @param onUpdate - Callback executado após o debounce
 * @param delay - Delay em ms (padrão: 300ms)
 * @param initialValue - Valor inicial (padrão: "")
 */
export const useDebouncedSearch = (
	onUpdate: (value: string) => void,
	delay = 300,
	initialValue = "",
): DebouncedSearchReturn => {
	// Input do usuário (sem delay)
	const searchInput = ref(initialValue);

	// Valor debounced (com delay)
	const debouncedValue = ref(initialValue);

	// Função debounced que atualiza o valor e chama callback
	const debouncedUpdate = useDebounceFn((value: string) => {
		debouncedValue.value = value;
		onUpdate(value);
	}, delay);

	/**
	 * Atualiza a busca (input imediato + debounce)
	 */
	const setSearch = (value: string): void => {
		searchInput.value = value; // Atualiza input imediatamente
		debouncedUpdate(value); // Aplica filtro com delay
	};

	/**
	 * Limpa a busca
	 */
	const clearSearch = (): void => {
		searchInput.value = "";
		debouncedValue.value = "";
		onUpdate("");
	};

	return {
		searchInput,
		debouncedValue: readonly(debouncedValue),
		setSearch,
		clearSearch,
	};
};

/**
 * Cria um debounce simples para qualquer função
 *
 * @param fn - Função a ser debounced
 * @param delay - Delay em ms (padrão: 300ms)
 */
export const createDebounced = <T extends (...args: unknown[]) => unknown>(
	fn: T,
	delay = 300,
): ((...args: Parameters<T>) => void) => {
	return useDebounceFn(fn, delay);
};

/**
 * Delays pré-configurados para diferentes casos de uso
 */
export const DEBOUNCE_DELAYS = {
	/**
	 * Busca rápida (100ms) - Para listas pequenas
	 */
	FAST: 100,

	/**
	 * Busca normal (300ms) - Padrão recomendado
	 */
	NORMAL: 300,

	/**
	 * Busca lenta (500ms) - Para operações pesadas
	 */
	SLOW: 500,

	/**
	 * Busca muito lenta (1000ms) - Para APIs externas
	 */
	VERY_SLOW: 1000,
} as const;
