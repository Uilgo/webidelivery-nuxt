<script setup lang="ts">
/**
 * 📌 UiFormField Component
 *
 * Wrapper simples para elementos de formulário.
 * Fornece label, descrição, hint, help e exibição de erros.
 * Funciona com Vee-Validate para exibir erros automaticamente.
 */

// ============================================
// TIPOS E INTERFACES
// ============================================

// Tipos para as props do componente
interface Props {
	/** Nome do campo (usado para associar erros do Vee-Validate) */
	name?: string;
	/** Label do campo */
	label?: string;
	/** Descrição adicional abaixo do label */
	description?: string;
	/** Texto de ajuda abaixo do input */
	help?: string;
	/** Mensagem de erro manual (sobrescreve Vee-Validate) */
	error?: string;
	/** Dica ao lado do label */
	hint?: string;
	/** Tamanho do campo */
	size?: "sm" | "md" | "lg";
	/** Campo obrigatório */
	required?: boolean;
	/** Orientação do layout */
	orientation?: "vertical" | "horizontal";
}

// Props com valores padrão
const props = withDefaults(defineProps<Props>(), {
	name: undefined,
	label: undefined,
	description: undefined,
	help: undefined,
	error: undefined,
	hint: undefined,
	size: "md",
	required: false,
	orientation: "vertical",
});

// ============================================
// INJECT FORM CONTEXT
// ============================================

// Injetar contexto do Form pai (se existir)
const formContext = inject<{
	disabled: { value: boolean };
} | null>("form", null);

// ============================================
// COMPUTED PROPERTIES
// ============================================

// ID único para o campo
const fieldId = useId();

// Estado desabilitado (do form pai)
const isDisabled = computed(() => formContext?.disabled.value || false);

// Classes do container principal
const containerClasses = computed(() => {
	const baseClasses = ["w-full"];

	// Classes de tamanho
	const sizeClasses = {
		sm: "text-xs",
		md: "text-sm",
		lg: "text-base",
	};

	// Classes de orientação
	const orientationClasses = {
		vertical: "space-y-1",
		horizontal: "flex justify-between items-baseline gap-2",
	};

	return [...baseClasses, sizeClasses[props.size], orientationClasses[props.orientation]].join(" ");
});

// Classes do wrapper do label
const labelWrapperClasses = computed(() => {
	return "flex items-center justify-between gap-1";
});

// Classes do label
const labelClasses = computed(() => {
	const baseClasses = [
		"block font-medium text-[var(--text-primary)]",
		"transition-colors duration-200",
	];

	// Adicionar asterisco se obrigatório
	if (props.required) {
		baseClasses.push("after:content-['*'] after:ms-0.5 after:text-[var(--error)]");
	}

	return baseClasses.join(" ");
});

// Classes do container do input
const inputContainerClasses = computed(() => {
	const baseClasses = ["relative"];

	// Classes de orientação
	if (props.orientation === "vertical") {
		baseClasses.push("mt-1");
	}

	return baseClasses.join(" ");
});

// Classes para textos auxiliares
const helpTextClasses = computed(() => {
	return "mt-1.5 text-[var(--text-muted)]";
});

const errorTextClasses = computed(() => {
	return "mt-1.5 text-[var(--error)] flex items-center gap-1";
});

// ============================================
// PROVIDE CONTEXT
// ============================================

// Prover contexto para o input filho
provide("formField", {
	id: ref(fieldId),
	name: props.name,
	disabled: isDisabled,
	required: props.required,
	size: props.size,
});
</script>

<template>
	<div :class="containerClasses">
		<!-- Label e Hint -->
		<div v-if="label || hint || $slots.label || $slots.hint" :class="labelWrapperClasses">
			<label v-if="label || $slots.label" :for="fieldId" :class="labelClasses">
				<slot name="label">{{ label }}</slot>
			</label>
			<span v-if="hint || $slots.hint" class="text-[var(--text-muted)]">
				<slot name="hint">{{ hint }}</slot>
			</span>
		</div>

		<!-- Descrição -->
		<div v-if="description || $slots.description" class="text-[var(--text-muted)]">
			<slot name="description">{{ description }}</slot>
		</div>

		<!-- Container do Input -->
		<div :class="inputContainerClasses">
			<slot></slot>
		</div>

		<!-- Mensagem de Erro (manual ou slot) -->
		<div v-if="error || $slots.error" :class="errorTextClasses">
			<Icon name="lucide:alert-circle" class="w-4 h-4 flex-shrink-0" />
			<span>
				<slot name="error">{{ error }}</slot>
			</span>
		</div>

		<!-- Texto de Ajuda -->
		<div v-else-if="help || $slots.help" :class="helpTextClasses">
			<slot name="help">{{ help }}</slot>
		</div>
	</div>
</template>
