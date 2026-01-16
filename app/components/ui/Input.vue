<script setup lang="ts">
/**
 * 📌 Input Component
 *
 * Componente de input limpo que funciona bem com FormField.
 * Remove duplicações de label, help, error - essas funcionalidades ficam no FormField.
 * Foca apenas no input em si com ícones e toggle de senha.
 */

// Tipos para as props do componente
interface Props {
	/** Valor do input (v-model) */
	modelValue?: string | number;
	/** Tipo do input HTML */
	type?: "text" | "email" | "password" | "number" | "tel" | "url" | "search" | "date";
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
	/** Atributo autocomplete */
	autocomplete?: string;
	/** ID customizado para o input */
	id?: string;
	/** Estado de erro (para styling) */
	error?: boolean;
}

// Props com valores padrão
const props = withDefaults(defineProps<Props>(), {
	modelValue: "",
	type: "text",
	placeholder: undefined,
	size: "md",
	disabled: false,
	readonly: false,
	required: false,
	autocomplete: undefined,
	id: undefined,
	error: false,
});

// Emits tipados
interface Emits {
	"update:modelValue": [value: string | number];
	focus: [event: FocusEvent];
	blur: [event: FocusEvent];
	keydown: [event: KeyboardEvent];
}

const emit = defineEmits<Emits>();

// ============================================
// INJECT FORMFIELD CONTEXT
// ============================================

// Injetar contexto do FormField pai (se existir)
const formFieldContext = inject<{
	id: { value: string };
	name?: string;
	disabled: { value: boolean };
	required: boolean;
	size: string;
} | null>("formField", null);

// ============================================
// COMPUTED PROPERTIES
// ============================================

// Estados reativos
const inputRef = ref<HTMLInputElement>();
const showPassword = ref(false);

// Gerar ID único usando useId() do Nuxt
const generatedId = useId();

// ID do input (do FormField ou próprio)
const inputId = computed(() => {
	if (formFieldContext?.id.value) {
		return formFieldContext.id.value;
	}
	if (props.id) {
		return props.id;
	}
	// Usar useId() do Nuxt para gerar IDs consistentes
	return generatedId;
});

// Tamanho do input (do FormField ou próprio)
const inputSize = computed(() => {
	return (formFieldContext?.size as "sm" | "md" | "lg") || props.size;
});

// Estado desabilitado (do FormField ou próprio)
const isDisabled = computed(() => {
	return formFieldContext?.disabled.value || props.disabled;
});

// Estado obrigatório (do FormField ou próprio)
const isRequired = computed(() => {
	return formFieldContext?.required || props.required;
});

// Verifica se é um campo de senha
const isPasswordType = computed(() => props.type === "password");

// Tipo computado para o input (muda entre password e text)
const computedType = computed(() => {
	if (isPasswordType.value) {
		return showPassword.value ? "text" : "password";
	}
	return props.type;
});

// Classes do container do input
const containerClasses = computed(() => {
	const baseClasses = [
		"flex items-center",
		"bg-[var(--input-bg)]",
		"border border-[var(--input-border)]",
		"rounded-lg",
		"transition-all duration-200",
		"focus-within:border-[var(--input-border-focus)]",
		"focus-within:ring-2 focus-within:ring-[var(--input-border-focus)] focus-within:ring-opacity-20",
	];

	// Classes de tamanho
	const sizeClasses = {
		sm: "min-h-[32px] px-3",
		md: "min-h-[40px] px-3",
		lg: "min-h-[48px] px-4",
	};

	// Classes de estado
	const stateClasses = [];
	if (props.error) {
		stateClasses.push(
			"border-[var(--error)]",
			"focus-within:border-[var(--error)]",
			"focus-within:ring-[var(--error)]",
		);
	}
	if (isDisabled.value) {
		stateClasses.push("opacity-50", "cursor-not-allowed");
	}

	return [...baseClasses, sizeClasses[inputSize.value], ...stateClasses].join(" ");
});

// Classes do input
const inputClasses = computed(() => {
	const baseClasses = [
		"flex-1",
		"bg-transparent",
		"border-0",
		"outline-none",
		"text-[var(--input-text)]",
		"placeholder:text-[var(--input-placeholder)]",
		"disabled:cursor-not-allowed",
	];

	// Classes de tamanho para o texto
	const sizeClasses = {
		sm: "text-sm",
		md: "text-base",
		lg: "text-lg",
	};

	return [...baseClasses, sizeClasses[inputSize.value]].join(" ");
});

// ============================================
// EVENT HANDLERS
// ============================================

// Funções de manipulação de eventos
const handleInput = (event: Event): void => {
	const target = event.target as HTMLInputElement;
	const value = props.type === "number" ? Number(target.value) : target.value;
	emit("update:modelValue", value);
};

const handleFocus = (event: FocusEvent): void => {
	emit("focus", event);
};

const handleBlur = (event: FocusEvent): void => {
	emit("blur", event);
};

const handleKeydown = (event: KeyboardEvent): void => {
	emit("keydown", event);
};

// Toggle da visibilidade da senha
const togglePasswordVisibility = (event: MouseEvent): void => {
	event.preventDefault();
	event.stopPropagation();
	showPassword.value = !showPassword.value;
	// Manter o foco no input após o toggle
	nextTick(() => {
		if (inputRef.value) {
			const currentValue = inputRef.value.value;
			inputRef.value.focus();
			// Garantir que o valor seja mantido
			if (inputRef.value.value !== currentValue) {
				inputRef.value.value = currentValue;
			}
		}
	});
};

// Método público para focar o input
const focus = (): void => {
	inputRef.value?.focus();
};

// Expor métodos públicos
defineExpose({
	focus,
	inputRef,
});
</script>

<template>
	<!-- Container do input -->
	<div class="relative" :class="containerClasses">
		<!-- Ícone à esquerda -->
		<div
			v-if="$slots.iconLeft"
			class="flex items-center justify-center text-[var(--text-muted)] pointer-events-none mr-2 input-icon"
		>
			<slot name="iconLeft"></slot>
		</div>

		<!-- Campo de input -->
		<input
			:id="inputId"
			ref="inputRef"
			:type="computedType"
			:value="modelValue"
			:placeholder="placeholder"
			:disabled="isDisabled"
			:readonly="readonly"
			:required="isRequired"
			:autocomplete="autocomplete"
			:class="inputClasses"
			v-bind="$attrs"
			@input="handleInput"
			@focus="handleFocus"
			@blur="handleBlur"
			@keydown="handleKeydown"
		/>

		<!-- Ícone à direita ou toggle de senha -->
		<div
			v-if="$slots.iconRight || isPasswordType"
			class="flex items-center justify-center text-[var(--text-muted)] pointer-events-none ml-2 input-icon"
		>
			<!-- Toggle de senha para tipo password -->
			<button
				v-if="isPasswordType"
				type="button"
				tabindex="-1"
				class="flex items-center justify-center p-1 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors duration-200 pointer-events-auto cursor-pointer rounded hover:bg-[var(--bg-hover)]"
				:aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
				@click="togglePasswordVisibility"
				@mousedown.prevent
			>
				<!-- Ícone de olho aberto/fechado -->
				<Icon :name="showPassword ? 'lucide:eye-off' : 'lucide:eye'" class="w-5 h-5" />
			</button>
			<!-- Slot para ícone customizado à direita -->
			<slot v-else name="iconRight"></slot>
		</div>
	</div>
</template>

<style scoped>
/* CSS necessário para funcionalidade específica que não pode ser feita apenas com Tailwind */

/* Garantir que os ícones do Nuxt Icon fiquem centralizados perfeitamente */
.input-icon :deep(.icon) {
	width: 1.25rem; /* 20px - equivalente a w-5 */
	height: 1.25rem; /* 20px - equivalente a h-5 */
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
}

/* Ajustes responsivos para diferentes tamanhos de input */
.relative:has(.text-sm) .input-icon :deep(.icon) {
	width: 1rem; /* 16px - equivalente a w-4 */
	height: 1rem; /* 16px - equivalente a h-4 */
}

.relative:has(.text-lg) .input-icon :deep(.icon) {
	width: 1.5rem; /* 24px - equivalente a w-6 */
	height: 1.5rem; /* 24px - equivalente a h-6 */
}

/* Corrigir estilos do autocomplete do navegador */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
	-webkit-box-shadow: 0 0 0 30px var(--input-bg) inset !important;
	-webkit-text-fill-color: var(--input-text) !important;
	background-color: var(--input-bg) !important;
	color: var(--input-text) !important;
}

/* Para Firefox */
input:-moz-autofill {
	background-color: var(--input-bg) !important;
	color: var(--input-text) !important;
}

/* Para outros navegadores */
input:autofill {
	background-color: var(--input-bg) !important;
	color: var(--input-text) !important;
}
</style>
