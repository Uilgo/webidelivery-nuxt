<script setup lang="ts">
/**
 * 📌 EmptyState Component
 *
 * Componente de estado vazio reutilizável para quando não há dados para exibir.
 * Suporta diferentes variantes, ícones, imagens e ações.
 * Segue o design system definido no main.css.
 */

// Tipos para as props do componente
interface Props {
	/** Título do estado vazio */
	title?: string;
	/** Descrição do estado vazio */
	description?: string;
	/** Ícone a ser exibido */
	icon?: string;
	/** URL da imagem a ser exibida (substitui o ícone) */
	image?: string;
	/** Texto alternativo para a imagem */
	imageAlt?: string;
	/** Tamanho do componente */
	size?: "sm" | "md" | "lg";
	/** Variante visual */
	variant?: "default" | "search" | "error" | "loading";
	/** Texto do botão de ação principal */
	actionText?: string;
	/** Texto do botão de ação secundária */
	secondaryActionText?: string;
	/** Estado de carregamento */
	loading?: boolean;
}

// Props com valores padrão
const props = withDefaults(defineProps<Props>(), {
	title: "",
	description: "",
	icon: "",
	image: "",
	imageAlt: "",
	size: "md",
	variant: "default",
	actionText: "",
	secondaryActionText: "",
	loading: false,
});

// Emits tipados
interface Emits {
	action: [];
	secondaryAction: [];
}

const emit = defineEmits<Emits>();

// Ícones padrão baseados na variante
const defaultIcons = {
	default: "lucide:inbox",
	search: "lucide:search",
	error: "lucide:alert-circle",
	loading: "lucide:loader-2",
};

// Computada para o ícone a ser exibido
const displayIcon = computed(() => {
	if (props.icon) return props.icon;
	return defaultIcons[props.variant];
});

// Classes computadas para o container
const containerClasses = computed(() => {
	const baseClasses = ["flex flex-col items-center justify-center text-center", "py-12"];

	// Classes de tamanho
	const sizeClasses = {
		sm: "px-4 max-w-sm",
		md: "px-6 max-w-md",
		lg: "px-8 max-w-lg",
	};

	return [...baseClasses, sizeClasses[props.size]].join(" ");
});

// Classes computadas para o ícone/imagem
const iconClasses = computed(() => {
	const baseClasses = ["mb-4"];

	// Classes de tamanho
	const sizeClasses = {
		sm: "w-12 h-12",
		md: "w-16 h-16",
		lg: "w-20 h-20",
	};

	// Classes de cor baseadas na variante
	const colorClasses = {
		default: "text-[var(--text-muted)]",
		search: "text-[var(--text-muted)]",
		error: "text-[var(--error)]",
		loading: "text-[var(--primary)]",
	};

	// Classes de animação
	const animationClasses = [];
	if (props.variant === "loading" || props.loading) {
		animationClasses.push("animate-spin");
	}

	return [
		...baseClasses,
		sizeClasses[props.size],
		colorClasses[props.variant],
		...animationClasses,
	].join(" ");
});

// Classes computadas para a imagem
const imageClasses = computed(() => {
	const baseClasses = ["mb-4 object-contain"];

	// Classes de tamanho
	const sizeClasses = {
		sm: "w-24 h-24",
		md: "w-32 h-32",
		lg: "w-40 h-40",
	};

	return [...baseClasses, sizeClasses[props.size]].join(" ");
});

// Classes computadas para o título
const titleClasses = computed(() => {
	const baseClasses = ["font-semibold text-[var(--text-primary)] mb-2"];

	// Classes de tamanho
	const sizeClasses = {
		sm: "text-lg",
		md: "text-xl",
		lg: "text-2xl",
	};

	return [...baseClasses, sizeClasses[props.size]].join(" ");
});

// Classes computadas para a descrição
const descriptionClasses = computed(() => {
	const baseClasses = ["text-[var(--text-muted)] mb-6"];

	// Classes de tamanho
	const sizeClasses = {
		sm: "text-sm",
		md: "text-base",
		lg: "text-lg",
	};

	return [...baseClasses, sizeClasses[props.size]].join(" ");
});

// Handlers para as ações
const handleAction = (): void => {
	emit("action");
};

const handleSecondaryAction = (): void => {
	emit("secondaryAction");
};
</script>

<template>
	<div :class="containerClasses">
		<!-- Imagem ou Ícone -->
		<div class="mb-4">
			<img v-if="image" :src="image" :alt="imageAlt" :class="imageClasses" />
			<Icon v-else :name="displayIcon" :class="iconClasses" />
		</div>

		<!-- Título -->
		<h3 v-if="title" :class="titleClasses">
			{{ title }}
		</h3>

		<!-- Descrição -->
		<p v-if="description" :class="descriptionClasses">
			{{ description }}
		</p>

		<!-- Slot para conteúdo customizado -->
		<div v-if="$slots.default" class="mb-6">
			<slot></slot>
		</div>

		<!-- Ações -->
		<div
			v-if="actionText || secondaryActionText || $slots.actions"
			class="flex flex-col sm:flex-row gap-3"
		>
			<slot name="actions">
				<!-- Ação principal -->
				<UiButton v-if="actionText" variant="solid" :loading="loading" @click="handleAction">
					{{ actionText }}
				</UiButton>

				<!-- Ação secundária -->
				<UiButton
					v-if="secondaryActionText"
					variant="outline"
					:disabled="loading"
					@click="handleSecondaryAction"
				>
					{{ secondaryActionText }}
				</UiButton>
			</slot>
		</div>
	</div>
</template>

<style scoped>
/* CSS necessário para funcionalidade específica que não pode ser feita apenas com Tailwind */
</style>
