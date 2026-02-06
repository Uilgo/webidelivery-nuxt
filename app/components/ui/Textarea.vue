<script setup lang="ts">
/**
 * 📌 Textarea Component
 *
 * Componente de textarea reutilizável com label, validação, contador de caracteres e auto-resize.
 * Suporta diferentes tamanhos, estados e funcionalidades avançadas.
 * Segue o design system definido no main.css.
 */

// Tipos para as props do componente
interface Props {
	/** Valor do textarea (v-model) */
	modelValue: string;
	/** Label do campo */
	label?: string;
	/** Placeholder do textarea */
	placeholder?: string;
	/** Texto de ajuda */
	help?: string;
	/** Mensagem de erro */
	error?: string;
	/** Campo obrigatório */
	required?: boolean;
	/** Estado desabilitado */
	disabled?: boolean;
	/** Somente leitura */
	readonly?: boolean;
	/** Tamanho do textarea */
	size?: "sm" | "md" | "lg";
	/** Número de linhas visíveis */
	rows?: number;
	/** Limite máximo de caracteres */
	maxLength?: number;
	/** Mostrar contador de caracteres */
	showCounter?: boolean;
	/** Permitir redimensionamento */
	resize?: boolean;
	/** Auto-resize baseado no conteúdo */
	autoResize?: boolean;
	/** Altura mínima em pixels */
	minHeight?: number;
	/** Altura máxima em pixels */
	maxHeight?: number;
}

// Props com valores padrão
const props = withDefaults(defineProps<Props>(), {
	label: "",
	placeholder: "",
	help: "",
	error: "",
	required: false,
	disabled: false,
	readonly: false,
	size: "md",
	rows: 3,
	maxLength: undefined,
	showCounter: false,
	resize: false,
	autoResize: false,
	minHeight: 80,
	maxHeight: 200,
});

// Emits tipados
interface Emits {
	"update:modelValue": [value: string];
	focus: [event: FocusEvent];
	blur: [event: FocusEvent];
	input: [event: Event];
	keydown: [event: KeyboardEvent];
}

const emit = defineEmits<Emits>();

// Refs
const textareaRef = ref<HTMLTextAreaElement>();

// Estados reativos
const isFocused = ref(false);

// IDs únicos para acessibilidade
const inputId = useId();
const errorId = useId();
const helpId = useId();

// Estilo computado para altura
const textareaStyle = computed(() => {
	const style: Record<string, string> = {};

	if (!props.autoResize) {
		style.minHeight = `${props.minHeight}px`;
		style.maxHeight = `${props.maxHeight}px`;
	}

	return style;
});

// Computadas
const hasError = computed(() => !!props.error);
const characterCount = computed(() => props.modelValue?.length || 0);

// Classes computadas para o label
const labelClasses = computed(() => {
	const baseClasses = ["block text-sm font-medium mb-1"];
	const colorClasses = hasError.value ? "text-[var(--error)]" : "text-[var(--text-primary)]";

	return [...baseClasses, colorClasses].join(" ");
});

// Classes computadas para o textarea
const textareaClasses = computed(() => {
	const baseClasses = [
		"w-full",
		"bg-[var(--input-bg)]",
		"border",
		"rounded-lg",
		"text-[var(--input-text)]",
		"placeholder-[var(--input-placeholder)]",
		"transition-all duration-200",
		"focus-ring",
	];

	// Classes de tamanho
	const sizeClasses = {
		sm: "px-3 py-2 text-sm",
		md: "px-4 py-3 text-base",
		lg: "px-4 py-4 text-lg",
	};

	// Classes de estado
	const stateClasses = [];
	if (hasError.value) {
		stateClasses.push(
			"border-[var(--error)]",
			"focus:border-[var(--error)]",
			"focus:ring-[var(--error)]/20",
		);
	} else if (isFocused.value) {
		stateClasses.push("border-[var(--input-border-focus)]", "ring-4 ring-[var(--primary)]/10");
	} else {
		stateClasses.push("border-[var(--input-border)]", "hover:border-[var(--border-strong)]");
	}

	// Classes de interação
	if (props.disabled) {
		stateClasses.push("opacity-50", "cursor-not-allowed", "bg-[var(--bg-muted)]");
	} else if (props.readonly) {
		stateClasses.push("bg-[var(--bg-muted)]", "cursor-default");
	}

	// Classes de resize - sempre desabilitado
	const resizeClasses = "resize-none";

	return [...baseClasses, sizeClasses[props.size], ...stateClasses, resizeClasses].join(" ");
});

// Handlers
const handleInput = (event: Event): void => {
	const target = event.target as HTMLTextAreaElement;
	emit("update:modelValue", target.value);
	emit("input", event);

	// Auto-resize se habilitado
	if (props.autoResize) {
		autoResizeTextarea();
	}
};

const handleFocus = (event: FocusEvent): void => {
	isFocused.value = true;
	emit("focus", event);
};

const handleBlur = (event: FocusEvent): void => {
	isFocused.value = false;
	emit("blur", event);
};

const handleKeydown = (event: KeyboardEvent): void => {
	emit("keydown", event);
};

// Função para auto-resize
const autoResizeTextarea = (): void => {
	if (!textareaRef.value || !props.autoResize) return;

	const textarea = textareaRef.value;
	textarea.style.height = "auto";

	const newHeight = Math.min(Math.max(textarea.scrollHeight, props.minHeight), props.maxHeight);

	textarea.style.height = `${newHeight}px`;
};

// Watcher para auto-resize quando o valor muda externamente
watch(
	() => props.modelValue,
	() => {
		if (props.autoResize) {
			nextTick(() => {
				autoResizeTextarea();
			});
		}
	},
);

// Lifecycle hooks
onMounted(() => {
	if (props.autoResize) {
		autoResizeTextarea();
	}
});
</script>

<template>
	<div class="w-full">
		<!-- Label -->
		<label v-if="label" :for="inputId" :class="labelClasses">
			{{ label }}
			<span v-if="required" class="text-[var(--error)] ml-1">*</span>
		</label>

		<!-- Textarea Container -->
		<div class="relative">
			<textarea
				:id="inputId"
				ref="textareaRef"
				:value="modelValue"
				:placeholder="placeholder"
				:disabled="disabled"
				:readonly="readonly"
				:required="required"
				:maxlength="maxLength"
				:rows="rows"
				:class="textareaClasses"
				:style="textareaStyle"
				:aria-invalid="hasError"
				:aria-describedby="hasError ? errorId : helpId"
				@input="handleInput"
				@blur="handleBlur"
				@focus="handleFocus"
				@keydown="handleKeydown"
			></textarea>

			<!-- Contador de caracteres -->
			<div
				v-if="showCounter && maxLength"
				class="absolute bottom-2 right-2 text-xs text-[var(--text-muted)] bg-[var(--bg-surface)] px-1 rounded"
			>
				{{ characterCount }}/{{ maxLength }}
			</div>
		</div>

		<!-- Texto de ajuda -->
		<p v-if="help && !hasError" :id="helpId" class="mt-1 text-sm text-[var(--text-muted)]">
			{{ help }}
		</p>

		<!-- Mensagem de erro -->
		<p v-if="hasError" :id="errorId" class="mt-1 text-sm text-[var(--error)]">
			{{ error }}
		</p>
	</div>
</template>

<style scoped>
/* CSS necessário para funcionalidade específica que não pode ser feita apenas com Tailwind */
</style>
