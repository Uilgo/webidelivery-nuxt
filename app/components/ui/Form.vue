<script setup lang="ts">
/**
 * 📌 Form Component
 *
 * Componente de formulário simples que apenas fornece contexto para FormFields.
 * Usa Vee-Validate + Zod schemas existentes em app/shared/schemas.
 */

// ============================================
// TIPOS E INTERFACES
// ============================================

// Tipos para as props do componente
interface Props {
	/** Desabilitar todos os inputs */
	disabled?: boolean;
	/** Classe CSS adicional */
	className?: string;
}

// Props com valores padrão
const props = withDefaults(defineProps<Props>(), {
	disabled: false,
	className: "",
});

// Emits tipados
interface Emits {
	submit: [event: Event];
}

const emit = defineEmits<Emits>();

// ============================================
// ESTADO REATIVO
// ============================================

const isDisabled = computed(() => props.disabled);

// ============================================
// EVENT HANDLERS
// ============================================

/**
 * Handler para submit do form
 */
const handleSubmit = (event: Event): void => {
	emit("submit", event);
};

// ============================================
// PROVIDE CONTEXT
// ============================================

// Prover contexto simples para FormField filhos
provide("form", {
	disabled: readonly(isDisabled),
});
</script>

<template>
	<form :class="className" @submit="handleSubmit">
		<slot></slot>
	</form>
</template>
