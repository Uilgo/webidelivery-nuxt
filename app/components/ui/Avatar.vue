<script setup lang="ts">
/**
 * 📌 Avatar Component
 *
 * Componente de avatar reutilizável com suporte a imagem, iniciais e ícone fallback.
 * Suporta diferentes tamanhos, formatos e indicadores de status.
 * Segue o design system definido no main.css.
 */

// Tipos para as props do componente
interface Props {
	/** URL da imagem do avatar */
	src?: string;
	/** Texto alternativo para a imagem */
	alt?: string;
	/** Nome para gerar iniciais automaticamente */
	name?: string;
	/** Iniciais customizadas (sobrescreve as geradas pelo nome) */
	initials?: string;
	/** Tamanho do avatar */
	size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
	/** Formato do avatar */
	shape?: "circle" | "square" | "rounded";
	/** Indicador de status */
	status?: "online" | "offline" | "away" | "busy" | "none";
	/** Posição do indicador de status */
	statusPosition?: "top-right" | "bottom-right" | "top-left" | "bottom-left";
	/** Avatar clicável */
	clickable?: boolean;
	/** Estado desabilitado */
	disabled?: boolean;
	/** Cor de fundo para iniciais */
	color?: "primary" | "success" | "warning" | "error" | "info" | "neutral";
}

// Props com valores padrão
const props = withDefaults(defineProps<Props>(), {
	src: "",
	alt: "",
	name: "",
	initials: "",
	size: "md",
	shape: "circle",
	status: "none",
	statusPosition: "bottom-right",
	clickable: false,
	disabled: false,
	color: "neutral",
});

// Emits tipados
interface Emits {
	click: [event: MouseEvent];
	imageError: [event: Event];
	imageLoad: [event: Event];
}

const emit = defineEmits<Emits>();

// Estados reativos
const imageError = ref(false);
const imageLoaded = ref(false);

// Computada para gerar iniciais automaticamente
const computedInitials = computed(() => {
	if (props.initials) return props.initials;
	if (!props.name) return "";

	return props.name
		.split(" ")
		.map((word) => word.charAt(0))
		.join("")
		.toUpperCase()
		.slice(0, 2);
});

// Computada para determinar o que mostrar
const showImage = computed(() => props.src && !imageError.value);
const showInitials = computed(() => !showImage.value && computedInitials.value);
const showIcon = computed(() => !showImage.value && !showInitials.value);

// Classes computadas para o avatar
const avatarClasses = computed(() => {
	const baseClasses = [
		"inline-flex items-center justify-center",
		"font-medium text-white",
		"overflow-hidden",
		"transition-all duration-200",
	];

	// Classes de tamanho
	const sizeClasses = {
		xs: "w-6 h-6 text-xs",
		sm: "w-8 h-8 text-sm",
		md: "w-10 h-10 text-base",
		lg: "w-12 h-12 text-lg",
		xl: "w-16 h-16 text-xl",
		"2xl": "w-20 h-20 text-2xl",
	};

	// Classes de formato
	const shapeClasses = {
		circle: "rounded-full",
		square: "rounded-none",
		rounded: "rounded-lg",
	};

	// Classes de cor (para iniciais)
	const colorClasses = {
		primary: "bg-[var(--primary)]",
		success: "bg-[var(--success)]",
		warning: "bg-[var(--warning)]",
		error: "bg-[var(--error)]",
		info: "bg-[var(--info)]",
		neutral: "bg-[var(--color-neutral-500)]",
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

	// Cor de fundo apenas se não for imagem
	const backgroundClasses = showImage.value ? [] : [colorClasses[props.color]];

	return [
		...baseClasses,
		sizeClasses[props.size],
		shapeClasses[props.shape],
		...backgroundClasses,
		...interactionClasses,
		...stateClasses,
	].join(" ");
});

// Classes computadas para a imagem
const imageClasses = computed(() => {
	return "w-full h-full object-cover";
});

// Classes computadas para o indicador de status
const statusClasses = computed(() => {
	if (props.status === "none") return "";

	const baseClasses = ["absolute w-3 h-3 rounded-full border-2 border-[var(--bg-surface)]"];

	// Classes de posição - posicionado próximo à borda do avatar
	const positionClasses = {
		"top-right": "top-0 right-0 transform translate-x-1/12 -translate-y-1/12",
		"bottom-right": "bottom-0 right-0 transform translate-x-1/12 translate-y-1/12",
		"top-left": "top-0 left-0 transform -translate-x-1/12 -translate-y-1/12",
		"bottom-left": "bottom-0 left-0 transform -translate-x-1/12 translate-y-1/12",
	};

	// Classes de cor baseadas no status
	const statusColorClasses = {
		online: "bg-[var(--success)]",
		offline: "bg-[var(--color-neutral-400)]",
		away: "bg-[var(--warning)]",
		busy: "bg-[var(--error)]",
		none: "",
	};

	return [
		...baseClasses,
		positionClasses[props.statusPosition],
		statusColorClasses[props.status],
	].join(" ");
});

// Classes computadas para o ícone fallback
const iconClasses = computed(() => {
	const sizeClasses = {
		xs: "w-3 h-3",
		sm: "w-4 h-4",
		md: "w-5 h-5",
		lg: "w-6 h-6",
		xl: "w-8 h-8",
		"2xl": "w-10 h-10",
	};

	return ["text-white/70", sizeClasses[props.size]].join(" ");
});

// Handlers
const handleClick = (event: MouseEvent): void => {
	if (props.disabled || !props.clickable) return;
	emit("click", event);
};

const handleImageError = (event: Event): void => {
	imageError.value = true;
	emit("imageError", event);
};

const handleImageLoad = (event: Event): void => {
	imageLoaded.value = true;
	emit("imageLoad", event);
};

// Watcher para resetar erro quando src muda
watch(
	() => props.src,
	() => {
		imageError.value = false;
		imageLoaded.value = false;
	},
);
</script>

<template>
	<div class="relative inline-block">
		<div :class="avatarClasses" @click="handleClick">
			<!-- Imagem -->
			<img
				v-if="showImage"
				:src="src"
				:alt="alt || name"
				:class="imageClasses"
				@error="handleImageError"
				@load="handleImageLoad"
			/>

			<!-- Iniciais -->
			<span v-else-if="showInitials" class="select-none">
				{{ computedInitials }}
			</span>

			<!-- Ícone fallback -->
			<Icon v-else-if="showIcon" name="lucide:user" :class="iconClasses" />
		</div>

		<!-- Indicador de status -->
		<span v-if="status !== 'none'" :class="statusClasses"></span>
	</div>
</template>

<style scoped>
/* CSS necessário para funcionalidade específica que não pode ser feita apenas com Tailwind */
</style>
