<script setup lang="ts">
/**
 * 📌 Button Component
 *
 * Componente de botão reutilizável com múltiplas variantes e estados.
 * Suporta ícones, loading state e diferentes tamanhos.
 * Segue o design system definido no main.css.
 */

// Tipos para as props do componente
interface Props {
	/** Variante visual do botão */
	variant?: "solid" | "outline" | "soft" | "ghost" | "link";
	/** Tamanho do botão */
	size?: "sm" | "md" | "lg";
	/** Cor do botão baseada no design system */
	color?: "primary" | "success" | "warning" | "error" | "neutral";
	/** Ícone único central (quando não há texto) */
	icon?: string;
	/** Estado de loading */
	loading?: boolean;
	/** Estado desabilitado */
	disabled?: boolean;
	/** Tipo do botão HTML */
	type?: "button" | "submit" | "reset";
	/** Ocupar toda a largura disponível */
	fullWidth?: boolean;
	/** URL para transformar em link */
	href?: string;
	/** Target do link (quando href é fornecido) */
	target?: "_blank" | "_self" | "_parent" | "_top";
	/** Rel do link (quando href é fornecido) */
	rel?: string;
}

// Props com valores padrão
const props = withDefaults(defineProps<Props>(), {
	variant: "solid",
	size: "md",
	color: "primary",
	icon: undefined,
	loading: false,
	disabled: false,
	type: "button",
	fullWidth: false,
	href: undefined,
	target: "_self",
	rel: undefined,
});

// Emits tipados
interface Emits {
	click: [event: MouseEvent];
}

const emit = defineEmits<Emits>();

// Função para lidar com cliques
const handleClick = (event: MouseEvent): void => {
	if (!props.loading && !props.disabled) {
		emit("click", event);
	}
};

// Determinar se deve renderizar como link ou botão
const isLink = computed(() => !!props.href);

// Atributos para links
const linkAttrs = computed(() => {
	if (!isLink.value) return {};

	return {
		href: props.href,
		target: props.target,
		rel: props.rel || (props.target === "_blank" ? "noopener noreferrer" : undefined),
	};
});

// Classes do ícone baseadas no tamanho
const iconClasses = computed(() => {
	const sizeClasses = {
		sm: "w-4 h-4",
		md: "w-5 h-5",
		lg: "w-6 h-6",
	};
	return sizeClasses[props.size];
});

// Classes computadas baseadas nas props
const buttonClasses = computed(() => {
	const baseClasses = [
		// Classes base
		"inline-flex items-center justify-center gap-2",
		"font-medium transition-all duration-200 ease-in-out",
		"focus-ring rounded-lg border",
		"disabled:opacity-50 disabled:cursor-not-allowed",
		"relative overflow-hidden",
	];

	// Classes de tamanho
	const sizeClasses = {
		sm: "px-3 py-1 text-sm min-h-8",
		md: "px-4 py-2 text-base min-h-10",
		lg: "px-6 text-base h-11",
	};

	// Classes de variante por cor
	const variantClasses = {
		solid: {
			primary:
				"bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] hover:bg-[var(--primary-hover)] active:scale-95",
			success:
				"bg-[var(--success)] text-[var(--success-foreground)] border-[var(--success)] hover:opacity-90 active:scale-95",
			warning:
				"bg-[var(--warning)] text-[var(--warning-foreground)] border-[var(--warning)] hover:opacity-90 active:scale-95",
			error:
				"bg-[var(--error)] text-[var(--error-foreground)] border-[var(--error)] hover:opacity-90 active:scale-95",
			neutral:
				"bg-[var(--text-primary)] text-[var(--text-inverse)] border-[var(--text-primary)] hover:opacity-90 active:scale-95",
		},
		outline: {
			primary:
				"bg-transparent text-[var(--primary)] border-[var(--primary)] hover:bg-[var(--primary-light)] active:scale-95",
			success:
				"bg-transparent text-[var(--success)] border-[var(--success)] hover:bg-[var(--success-light)] active:scale-95",
			warning:
				"bg-transparent text-[var(--warning)] border-[var(--warning)] hover:bg-[var(--warning-light)] active:scale-95",
			error:
				"bg-transparent text-[var(--error)] border-[var(--error)] hover:bg-[var(--error-light)] active:scale-95",
			neutral:
				"bg-transparent text-[var(--text-primary)] border-[var(--border-default)] hover:bg-[var(--bg-hover)] active:scale-95",
		},
		soft: {
			primary:
				"bg-[var(--primary-light)] text-[var(--primary)] border-transparent hover:bg-[var(--primary-light)] hover:opacity-80 active:scale-95",
			success:
				"bg-[var(--success-light)] text-[var(--success)] border-transparent hover:opacity-80 active:scale-95",
			warning:
				"bg-[var(--warning-light)] text-[var(--warning)] border-transparent hover:opacity-80 active:scale-95",
			error:
				"bg-[var(--error-light)] text-[var(--error)] border-transparent hover:opacity-80 active:scale-95",
			neutral:
				"bg-[var(--bg-muted)] text-[var(--text-primary)] border-transparent hover:bg-[var(--bg-hover)] active:scale-95",
		},
		ghost: {
			primary:
				"bg-transparent text-[var(--primary)] border-transparent hover:bg-[var(--primary-light)] active:scale-95",
			success:
				"bg-transparent text-[var(--success)] border-transparent hover:bg-[var(--success-light)] active:scale-95",
			warning:
				"bg-transparent text-[var(--warning)] border-transparent hover:bg-[var(--warning-light)] active:scale-95",
			error:
				"bg-transparent text-[var(--error)] border-transparent hover:bg-[var(--error-light)] active:scale-95",
			neutral:
				"bg-transparent text-[var(--text-primary)] border-transparent hover:bg-[var(--bg-hover)] active:scale-95",
		},
		link: {
			primary:
				"bg-transparent text-[var(--primary)] border-transparent hover:underline p-0 min-h-auto",
			success:
				"bg-transparent text-[var(--success)] border-transparent hover:underline p-0 min-h-auto",
			warning:
				"bg-transparent text-[var(--warning)] border-transparent hover:underline p-0 min-h-auto",
			error: "bg-transparent text-[var(--error)] border-transparent hover:underline p-0 min-h-auto",
			neutral:
				"bg-transparent text-[var(--text-primary)] border-transparent hover:underline p-0 min-h-auto",
		},
	};

	// Classes de largura total
	const widthClasses = props.fullWidth ? "w-full" : "";

	return [
		...baseClasses,
		sizeClasses[props.size],
		variantClasses[props.variant][props.color],
		widthClasses,
	]
		.filter(Boolean)
		.join(" ");
});
</script>

<template>
	<component
		:is="isLink ? 'a' : 'button'"
		:class="buttonClasses"
		:disabled="!isLink && disabled"
		:type="!isLink ? type : undefined"
		v-bind="isLink ? linkAttrs : $attrs"
		@click="handleClick"
	>
		<!-- Ícone à esquerda -->
		<span
			v-if="$slots.iconLeft"
			class="flex items-center justify-center"
			:class="{ 'opacity-0': loading }"
		>
			<slot name="iconLeft"></slot>
		</span>

		<!-- Ícone único central (quando não há texto) -->
		<span
			v-if="icon && !$slots.default"
			class="flex items-center justify-center"
			:class="{ 'opacity-0': loading }"
		>
			<Icon :name="icon" :class="iconClasses" />
		</span>

		<!-- Conteúdo principal -->
		<span
			v-if="$slots.default"
			class="flex items-center justify-center"
			:class="{ 'opacity-0': loading }"
		>
			<slot></slot>
		</span>

		<!-- Ícone à direita -->
		<span
			v-if="$slots.iconRight"
			class="flex items-center justify-center"
			:class="{ 'opacity-0': loading }"
		>
			<slot name="iconRight"></slot>
		</span>

		<!-- Loading spinner -->
		<span v-if="loading" class="absolute inset-0 flex items-center justify-center">
			<Icon name="lucide:loader-2" class="animate-spin h-4 w-4" />
		</span>
	</component>
</template>
