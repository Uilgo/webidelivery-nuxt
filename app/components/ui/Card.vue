<script setup lang="ts">
/**
 * 📌 Card Component
 *
 * Componente de card reutilizável com header, conteúdo e footer opcionais.
 * Suporta diferentes variantes, tamanhos e estados de hover/focus.
 * Segue o design system definido no main.css.
 */

// Tipos para as props do componente
interface Props {
	/** Variante visual do card */
	variant?: "default" | "outlined" | "elevated" | "ghost";
	/** Tamanho do padding interno */
	size?: "sm" | "md" | "lg";
	/** Card clicável com efeitos de hover */
	clickable?: boolean;
	/** Estado desabilitado */
	disabled?: boolean;
	/** Remover padding do conteúdo */
	noPadding?: boolean;
	/** Remover padding do header */
	noHeaderPadding?: boolean;
	/** Remover padding do footer */
	/** Remover padding do footer */
	noFooterPadding?: boolean;
	/** Preencher altura disponível (flex column) */
	fillHeight?: boolean;
}

// Props com valores padrão
const props = withDefaults(defineProps<Props>(), {
	variant: "default",
	size: "md",
	clickable: false,
	disabled: false,
	noPadding: false,
	noHeaderPadding: false,
	noFooterPadding: false,
	fillHeight: false,
});

// Emits tipados
interface Emits {
	click: [event: MouseEvent];
}

const emit = defineEmits<Emits>();

// Classes computadas para o card
const cardClasses = computed(() => {
	const baseClasses = [
		"bg-[var(--card-bg)]",
		"border border-[var(--card-border)]",
		"rounded-lg",
		"transition-all duration-200",
	];

	if (props.fillHeight) {
		baseClasses.push("h-full flex flex-col");
	}

	// Classes de variante
	const variantClasses = {
		default: ["shadow-[var(--card-shadow)]"],
		outlined: ["border-2"],
		elevated: ["shadow-lg"],
		ghost: ["border-transparent", "bg-transparent"],
	};

	// Classes de interação
	const interactionClasses = [];
	if (props.clickable && !props.disabled) {
		interactionClasses.push(
			"cursor-pointer",
			"hover:shadow-md",
			"hover:border-[var(--border-strong)]",
			"focus-ring",
			"interactive",
		);
	}

	// Classes de estado
	const stateClasses = [];
	if (props.disabled) {
		stateClasses.push("opacity-50", "cursor-not-allowed");
	}

	return [
		...baseClasses,
		...variantClasses[props.variant],
		...interactionClasses,
		...stateClasses,
	].join(" ");
});

// Classes computadas para o header
const headerClasses = computed(() => {
	const baseClasses = ["border-b border-[var(--border-muted)]"];

	// Classes de padding baseadas no tamanho
	const paddingClasses = {
		sm: "px-3 py-2",
		md: "px-4 py-3",
		lg: "px-6 py-4",
	};

	return [...baseClasses, props.noHeaderPadding ? "" : paddingClasses[props.size]].join(" ");
});

// Classes computadas para o conteúdo
const contentClasses = computed(() => {
	const classes = [];

	if (props.fillHeight) {
		classes.push("flex-1 flex flex-col min-h-0");
	}

	if (!props.noPadding) {
		// Classes de padding baseadas no tamanho
		const paddingClasses = {
			sm: "p-3",
			md: "p-4",
			lg: "p-6",
		};
		classes.push(paddingClasses[props.size]);
	}

	return classes.join(" ");
});

// Classes computadas para o footer
const footerClasses = computed(() => {
	const baseClasses = ["border-t border-[var(--border-muted)]"];

	// Classes de padding baseadas no tamanho
	const paddingClasses = {
		sm: "px-3 py-2",
		md: "px-4 py-3",
		lg: "px-6 py-4",
	};

	return [...baseClasses, props.noFooterPadding ? "" : paddingClasses[props.size]].join(" ");
});

// Handler para clique
const handleClick = (event: MouseEvent): void => {
	if (props.disabled || !props.clickable) return;
	emit("click", event);
};
</script>

<template>
	<div :class="cardClasses" @click="handleClick">
		<!-- Header do Card (opcional) -->
		<div v-if="$slots.header" :class="headerClasses">
			<slot name="header"></slot>
		</div>

		<!-- Conteúdo principal -->
		<div :class="contentClasses">
			<slot name="content">
				<slot></slot>
			</slot>
		</div>

		<!-- Footer do Card (opcional) -->
		<div v-if="$slots.footer" :class="footerClasses">
			<slot name="footer"></slot>
		</div>
	</div>
</template>

<style scoped>
/* CSS necessário para funcionalidade específica que não pode ser feita apenas com Tailwind */
</style>
