/**
 * 📌 useCurrencyInput
 *
 * Composable para inputs monetários com formatação em tempo real.
 * Baseado no mesmo padrão dos formatters de CEP e telefone.
 */

import { formatCurrencyProgressive, parseCurrency } from "~/lib/formatters/currency";

export interface UseCurrencyInputOptions {
	/** Valor inicial */
	initialValue?: number;
	/** Callback quando o valor muda */
	onUpdate?: (value: number) => void;
}

export const useCurrencyInput = (options: UseCurrencyInputOptions = {}) => {
	// Estado interno - dígitos puros e valor formatado para exibição
	const rawDigits = ref("");
	const displayValue = ref("");
	const numericValue = ref(options.initialValue || 0);

	// Inicializar com valor formatado se houver valor inicial
	if (options.initialValue && options.initialValue > 0) {
		// Converter para centavos (inteiro)
		rawDigits.value = Math.round(options.initialValue * 100).toString();
		displayValue.value = formatCurrencyProgressive(rawDigits.value);
	}

	// Handler de input - formata em tempo real como CEP/telefone
	const handleInput = (event: Event) => {
		const target = event.target as HTMLInputElement;
		const inputValue = target.value;

		// Extrair apenas os dígitos do input atual
		const digitsOnly = inputValue.replace(/\D/g, "");

		// Atualizar o estado interno
		rawDigits.value = digitsOnly;

		// Formatar progressivamente usando apenas os dígitos
		const formatted = formatCurrencyProgressive(digitsOnly);

		// Atualizar o valor do input diretamente (como telefone/CEP fazem)
		target.value = formatted;
		displayValue.value = formatted;

		// Converter para número e notificar
		const parsed = parseCurrency(formatted);
		numericValue.value = parsed;
		options.onUpdate?.(parsed);
	};

	// Handlers de foco (não precisam fazer nada especial)
	const handleFocus = () => {
		// Não precisa fazer nada - mantém formatação
	};

	const handleBlur = () => {
		// Não precisa fazer nada - já está formatado
	};

	// Método para definir valor programaticamente
	const setValue = (value: number) => {
		numericValue.value = value;
		rawDigits.value = value > 0 ? Math.round(value * 100).toString() : "";
		displayValue.value = value > 0 ? formatCurrencyProgressive(rawDigits.value) : "";
		options.onUpdate?.(value);
	};

	// Método para limpar o campo
	const clear = () => {
		numericValue.value = 0;
		rawDigits.value = "";
		displayValue.value = "";
		options.onUpdate?.(0);
	};

	return {
		// Estados
		displayValue,
		numericValue: readonly(numericValue),

		// Handlers
		handleFocus,
		handleInput,
		handleBlur,

		// Métodos
		setValue,
		clear,
	};
};
