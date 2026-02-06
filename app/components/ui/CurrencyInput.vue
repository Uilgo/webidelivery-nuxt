/** * 📌 CurrencyInput Component * * Componente especializado para inputs monetários. * Usa o
formatter de currency do projeto e segue melhores práticas de UX. */

<script setup lang="ts">
import { useCurrencyInput } from "~/composables/ui/useCurrencyInput";
interface Props {
	/** Valor numérico (v-model) */
	modelValue?: number;
	/** Placeholder do input */
	placeholder?: string;
	/** Tamanho do input */
	size?: "sm" | "md" | "lg";
	/** Estado desabilitado */
	disabled?: boolean;
	/** Estado somente leitura */
	readonly?: boolean;
	/** Campo obrigatório */
	required?: boolean;
	/** ID customizado para o input */
	id?: string;
	/** Estado de erro (para styling) */
	error?: boolean;
	/** Símbolo da moeda (padrão: R$) */
	currencySymbol?: string;
}

interface Emits {
	"update:modelValue": [value: number];
	focus: [event: FocusEvent];
	blur: [event: FocusEvent];
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: undefined,
	placeholder: "Ex: 50,00",
	size: "md",
	disabled: false,
	readonly: false,
	required: false,
	id: undefined,
	error: false,
	currencySymbol: "R$",
});

const emit = defineEmits<Emits>();

// ========================================
// REF DO INPUT
// ========================================

const inputRef = ref<HTMLInputElement>();

// ========================================
// COMPOSABLE DE CURRENCY
// ========================================

const { displayValue, handleFocus, handleInput, handleBlur, setValue } = useCurrencyInput({
	initialValue: props.modelValue,
	onUpdate: (value: number) => {
		emit("update:modelValue", value);
	},
});

// ========================================
// WATCHERS
// ========================================

// Sincronizar valor externo com interno
watch(
	() => props.modelValue,
	(newValue) => {
		if (newValue !== undefined) {
			setValue(newValue);
			// Atualizar o input diretamente
			if (inputRef.value) {
				inputRef.value.value = displayValue.value;
			}
		}
	},
);

// Sincronizar displayValue com input
watch(displayValue, (newValue) => {
	if (inputRef.value) {
		inputRef.value.value = newValue;
	}
});

// ========================================
// LIFECYCLE
// ========================================

onMounted(() => {
	// Definir valor inicial se existir
	if (props.modelValue && inputRef.value) {
		inputRef.value.value = displayValue.value;
	}
});

// ========================================
// HANDLERS
// ========================================

const handleFocusEvent = (event: FocusEvent) => {
	handleFocus();
	emit("focus", event);
};

const handleBlurEvent = (event: FocusEvent) => {
	handleBlur();
	emit("blur", event);
};
</script>

<template>
	<div class="relative">
		<!-- Container do input com símbolo -->
		<div
			class="flex items-center bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg transition-all duration-200 focus-within:border-[var(--input-border-focus)] focus-within:ring-2 focus-within:ring-[var(--input-border-focus)] focus-within:ring-opacity-20"
			:class="{
				'min-h-[32px] px-3': size === 'sm',
				'min-h-[40px] px-3': size === 'md',
				'min-h-[48px] px-4': size === 'lg',
				'border-[var(--error)] focus-within:border-[var(--error)] focus-within:ring-[var(--error)]':
					error,
				'opacity-50 cursor-not-allowed': disabled,
			}"
		>
			<!-- Símbolo da moeda -->
			<div class="text-[var(--text-muted)] font-medium mr-2 pointer-events-none">
				{{ currencySymbol }}
			</div>

			<!-- Input -->
			<input
				:id="id"
				ref="inputRef"
				type="text"
				:placeholder="placeholder"
				:disabled="disabled"
				:readonly="readonly"
				:required="required"
				class="flex-1 bg-transparent border-0 outline-none text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] disabled:cursor-not-allowed"
				:class="{
					'text-sm': size === 'sm',
					'text-base': size === 'md',
					'text-lg': size === 'lg',
				}"
				@input="handleInput"
				@focus="handleFocusEvent"
				@blur="handleBlurEvent"
			/>
		</div>
	</div>
</template>

<style scoped>
/* Remover spinners do input number */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
	-webkit-appearance: none;
	margin: 0;
}

input[type="number"] {
	-moz-appearance: textfield;
}
</style>
