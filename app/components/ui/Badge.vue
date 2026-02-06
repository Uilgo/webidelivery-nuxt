<script setup lang="ts">
/**
 * 📌 Badge Component
 *
 * Componente de badge reutilizável para indicadores, status e labels.
 * Suporta diferentes variantes, tamanhos e ícones.
 * Segue o design system definido no main.css.
 */

// Tipos para as props do componente
interface Props {
	/** Variante visual do badge */
	variant?: "default" | "primary" | "success" | "warning" | "error" | "info" | "outline";
	/** Tamanho do badge */
	size?: "sm" | "md" | "lg";
	/** Ícone à esquerda (deprecated - use slot iconLeft) */
	icon?: string;
	/** Ícone à direita (deprecated - use slot iconRight) */
	iconRight?: string;
	/** Badge com formato de pílula (mais arredondado) */
	pill?: boolean;
	/** Badge clicável */
	clickable?: boolean;
	/** Estado desabilitado */
	disabled?: boolean;
	/** Mostrar ponto indicador */
	dot?: boolean;
}

// Props com valores padrão
const props = withDefaults(defineProps<Props>(), {
	variant: "default",
	size: "md",
	icon: "",
	iconRight: "",
	pill: false,
	clickable: false,
	disabled: false,
	dot: false,
});

// Slots tipados
defineSlots<{
	default?: () => unknown;
	iconLeft?: () => unknown;
	iconRight?: () => unknown;
}>();

// Emits tipados
interface Emits {
	click: [event: MouseEvent];
}

const emit = defineEmits<Emits>();

// Classes computadas para o badge
const badgeClasses = computed(() => {
	const baseClasses = [
		"inline-flex items-center justify-center gap-1",
		"font-medium",
		"border",
		"transition-all duration-200",
	];

	// Classes de tamanho
	const sizeClasses = {
		sm: "px-2 py-0.5 text-xs",
		md: "px-2.5 py-1 text-sm",
		lg: "px-3 py-1.5 text-base",
	};

	// Classes de formato
	const shapeClasses = props.pill ? "rounded-full" : "rounded-md";

	// Classes de variante
	const variantClasses = {
		default: [
			"bg-[var(--bg-muted)]",
			"text-[var(--text-secondary)]",
			"border-[var(--border-muted)]",
		],
		primary: ["bg-[var(--primary)]", "text-[var(--primary-foreground)]", "border-[var(--primary)]"],
		success: ["bg-[var(--success)]", "text-[var(--success-foreground)]", "border-[var(--success)]"],
		warning: ["bg-[var(--warning)]", "text-[var(--warning-foreground)]", "border-[var(--warning)]"],
		error: ["bg-[var(--error)]", "text-[var(--error-foreground)]", "border-[var(--error)]"],
		info: ["bg-[var(--info)]", "text-[var(--info-foreground)]", "border-[var(--info)]"],
		outline: ["bg-transparent", "text-[var(--text-primary)]", "border-[var(--border-default)]"],
	};

	// Classes de interação
	const interactionClasses = [];
	if (props.clickable && !props.disabled) {
		interactionClasses.push("cursor-pointer", "hover:opacity-80", "focus-ring");
	}

	// Classes de estado
	const stateClasses = [];
	if (props.disabled) {
		stateClasses.push("opacity-50", "cursor-not-allowed");
	}

	return [
		...baseClasses,
		sizeClasses[props.size],
		shapeClasses,
		...variantClasses[props.variant],
		...interactionClasses,
		...stateClasses,
	].join(" ");
});

// Classes computadas para os ícones
const iconClasses = computed(() => {
	const sizeClasses = {
		sm: "w-3 h-3",
		md: "w-4 h-4",
		lg: "w-5 h-5",
	};

	return sizeClasses[props.size];
});

// Classes computadas para o ponto indicador
const dotClasses = computed(() => {
	const baseClasses = ["rounded-full", "bg-current"];

	const sizeClasses = {
		sm: "w-1.5 h-1.5",
		md: "w-2 h-2",
		lg: "w-2.5 h-2.5",
	};

	return [...baseClasses, sizeClasses[props.size]].join(" ");
});

// Handler para clique
const handleClick = (event: MouseEvent): void => {
	if (props.disabled || !props.clickable) return;
	emit("click", event);
};
</script>

<template>
	<span :class="badgeClasses" @click="handleClick">
		<!-- Ponto indicador -->
		<span v-if="dot" :class="dotClasses"></span>

		<!-- Ícone à esquerda (slot ou prop) -->
		<slot name="iconLeft">
			<Icon v-if="icon" :name="icon" :class="iconClasses" />
		</slot>

		<!-- Conteúdo -->
		<slot></slot>

		<!-- Ícone à direita (slot ou prop) -->
		<slot name="iconRight">
			<Icon v-if="iconRight" :name="iconRight" :class="iconClasses" />
		</slot>
	</span>
</template>

<style scoped>
/* CSS necessário para funcionalidade específica que não pode ser feita apenas com Tailwind */
</style>
