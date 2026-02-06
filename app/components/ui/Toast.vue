<script setup lang="ts">
/**
 * 📌 Toast Component
 *
 * Componente de notificação toast baseado no Nuxt UI.
 * Suporta título, descrição, ícones, avatares, ações e barra de progresso.
 * Segue o design system definido no main.css.
 */

// Tipos locais do componente
interface LocalButtonProps {
	variant?: "solid" | "outline" | "soft" | "ghost" | "link";
	size?: "sm" | "md" | "lg";
	color?: "primary" | "success" | "warning" | "error" | "neutral";
	icon?: string;
	loading?: boolean;
	disabled?: boolean;
	type?: "button" | "submit" | "reset";
	fullWidth?: boolean;
	label?: string;
	onClick?: (event: MouseEvent) => void;
}

interface LocalAvatarProps {
	src?: string;
	alt?: string;
	name?: string;
	initials?: string;
	size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
	shape?: "circle" | "square" | "rounded";
	status?: "online" | "offline" | "away" | "busy" | "none";
	statusPosition?: "top-right" | "bottom-right" | "top-left" | "bottom-left";
	clickable?: boolean;
}

// Tipos para as props do componente
interface Props {
	/** ID único do toast */
	id?: string | number;
	/** Título do toast */
	title?: string;
	/** Descrição do toast */
	description?: string;
	/** Ícone do toast */
	icon?: string;
	/** Avatar do toast */
	avatar?: LocalAvatarProps;
	/** Cor do toast baseada no design system */
	color?: "primary" | "success" | "warning" | "error" | "neutral";
	/** Orientação entre conteúdo e ações */
	orientation?: "vertical" | "horizontal";
	/** Botão de fechar customizável */
	close?: boolean | Omit<LocalButtonProps, "onClick">;
	/** Ícone do botão fechar */
	closeIcon?: string;
	/** Ações do toast */
	actions?: readonly LocalButtonProps[];
	/** Barra de progresso */
	progress?: boolean | { color?: string };
	/** Estado aberto/fechado */
	open?: boolean;
	/** Duração em ms antes de fechar automaticamente */
	duration?: number;
	/** Tipo para acessibilidade */
	type?: "foreground" | "background";
}

// Props com valores padrão
const props = withDefaults(defineProps<Props>(), {
	id: () => Date.now(),
	title: undefined,
	description: undefined,
	icon: undefined,
	avatar: undefined,
	color: "primary",
	orientation: "vertical",
	close: true,
	closeIcon: "lucide:x",
	actions: () => [],
	progress: true,
	open: true,
	duration: 5000,
	type: "foreground",
});

// Emits tipados
interface Emits {
	close: [];
	click: [];
	"update:open": [value: boolean];
}

const emit = defineEmits<Emits>();

// Estados reativos
const isVisible = ref(props.open);
const progressValue = ref(100);
const isPaused = ref(false);
const timeoutId = ref<NodeJS.Timeout>();
const intervalId = ref<NodeJS.Timeout>();

// Referência do elemento root
const toastRef = ref<HTMLElement>();

// ============================================
// COMPUTED
// ============================================

// Classes do toast baseadas nas props
const toastClasses = computed(() => {
	const baseClasses = [
		"relative group overflow-hidden bg-[var(--card-bg)] shadow-lg rounded-lg",
		"border border-[var(--border-default)] p-4 flex gap-3",
		"focus:outline-none transition-all duration-300 ease-in-out",
		"transform-gpu",
	];

	// Classes de cor
	const colorClasses = {
		primary: "focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
		success: "focus-visible:ring-2 focus-visible:ring-[var(--success)]",
		warning: "focus-visible:ring-2 focus-visible:ring-[var(--warning)]",
		error: "focus-visible:ring-2 focus-visible:ring-[var(--error)]",
		neutral: "focus-visible:ring-2 focus-visible:ring-[var(--border-default)]",
	};

	// Classes de orientação
	const orientationClasses = {
		horizontal: "items-center",
		vertical: "items-start",
	};

	// Classes de visibilidade
	const visibilityClasses = isVisible.value
		? "opacity-100 scale-100 translate-x-0"
		: "opacity-0 scale-95 translate-x-full pointer-events-none";

	return [
		...baseClasses,
		colorClasses[props.color],
		orientationClasses[props.orientation],
		visibilityClasses,
	].join(" ");
});

// Classes do ícone baseadas na cor
const iconClasses = computed(() => {
	const colorClasses = {
		primary: "text-[var(--primary)]",
		success: "text-[var(--success)]",
		warning: "text-[var(--warning)]",
		error: "text-[var(--error)]",
		neutral: "text-[var(--text-primary)]",
	};

	return ["w-5 h-5 flex-shrink-0", colorClasses[props.color]].join(" ");
});

// Classes das ações baseadas na orientação
const actionsClasses = computed(() => {
	const orientationClasses = {
		horizontal: "flex items-center gap-2 flex-shrink-0",
		vertical: "flex items-start gap-2 mt-3",
	};

	return orientationClasses[props.orientation];
});

// Cor da barra de progresso
const progressColor = computed(() => {
	if (typeof props.progress === "object" && props.progress.color) {
		return props.progress.color;
	}
	return props.color;
});

// ============================================
// METHODS
// ============================================

/**
 * Fechar o toast
 */
const closeToast = (): void => {
	isVisible.value = false;
	emit("update:open", false);

	// Aguardar animação antes de emitir close
	setTimeout(() => {
		emit("close");
	}, 300);
};

/**
 * Pausar o timer
 */
const pauseTimer = (): void => {
	isPaused.value = true;
	if (timeoutId.value) {
		clearTimeout(timeoutId.value);
	}
	if (intervalId.value) {
		clearInterval(intervalId.value);
	}
};

/**
 * Retomar o timer
 */
const resumeTimer = (): void => {
	if (!props.duration || props.duration <= 0) return;

	isPaused.value = false;
	const remainingTime = (progressValue.value / 100) * props.duration;

	// Timer para fechar
	timeoutId.value = setTimeout(() => {
		closeToast();
	}, remainingTime);

	// Timer para atualizar progresso
	const startTime = Date.now();
	intervalId.value = setInterval(() => {
		const elapsed = Date.now() - startTime;
		const remaining = Math.max(0, remainingTime - elapsed);
		progressValue.value = (remaining / props.duration) * 100;

		if (remaining <= 0) {
			clearInterval(intervalId.value!);
		}
	}, 50);
};

/**
 * Inicializar timer
 */
const initTimer = (): void => {
	if (!props.duration || props.duration <= 0) return;

	progressValue.value = 100;
	resumeTimer();
};

/**
 * Handler para clique no toast
 */
const handleClick = (): void => {
	emit("click");
};

/**
 * Handler para clique em ação
 */
const handleActionClick = (action: LocalButtonProps, event: MouseEvent): void => {
	if (action.onClick) {
		action.onClick(event);
	}
};

// ============================================
// LIFECYCLE
// ============================================

onMounted(() => {
	initTimer();
});

onUnmounted(() => {
	if (timeoutId.value) {
		clearTimeout(timeoutId.value);
	}
	if (intervalId.value) {
		clearInterval(intervalId.value);
	}
});

// Watchers
watch(
	() => props.open,
	(newValue) => {
		isVisible.value = newValue;
	},
);

watch(
	() => props.duration,
	() => {
		if (timeoutId.value) {
			clearTimeout(timeoutId.value);
		}
		if (intervalId.value) {
			clearInterval(intervalId.value);
		}
		initTimer();
	},
);
</script>

<template>
	<div
		ref="toastRef"
		:class="toastClasses"
		:role="type === 'foreground' ? 'alert' : 'status'"
		:aria-live="type === 'foreground' ? 'assertive' : 'polite'"
		:aria-atomic="true"
		tabindex="0"
		@click="handleClick"
		@mouseenter="pauseTimer"
		@mouseleave="resumeTimer"
		@focusin="pauseTimer"
		@focusout="resumeTimer"
	>
		<!-- Ícone ou Avatar -->
		<div v-if="icon || avatar" class="flex-shrink-0">
			<!-- Avatar -->
			<!-- <UiAvatar v-if="avatar" v-bind="avatar" size="md" /> -->
			<!-- TODO: Implementar UiAvatar -->
			<!-- Ícone -->
			<Icon v-if="icon" :name="icon" :class="iconClasses" />
		</div>

		<!-- Conteúdo principal -->
		<div class="flex-1 min-w-0">
			<!-- Título -->
			<div
				v-if="title || $slots.title"
				class="text-sm font-medium text-[var(--text-primary)] leading-5"
			>
				<slot name="title">{{ title }}</slot>
			</div>

			<!-- Descrição -->
			<div
				v-if="description || $slots.description"
				class="text-sm text-[var(--text-secondary)] leading-5"
				:class="{ 'mt-1': title || $slots.title }"
			>
				<slot name="description">{{ description }}</slot>
			</div>

			<!-- Ações (orientação vertical) -->
			<div v-if="actions.length > 0 && orientation === 'vertical'" :class="actionsClasses">
				<UiButton
					v-for="(action, index) in actions"
					:key="index"
					v-bind="action"
					size="sm"
					@click="handleActionClick(action, $event)"
				>
					{{ action.label }}
				</UiButton>
			</div>
		</div>

		<!-- Ações (orientação horizontal) -->
		<div v-if="actions.length > 0 && orientation === 'horizontal'" :class="actionsClasses">
			<UiButton
				v-for="(action, index) in actions"
				:key="index"
				v-bind="action"
				size="sm"
				@click="handleActionClick(action, $event)"
			>
				{{ action.label }}
			</UiButton>
		</div>

		<!-- Botão de fechar -->
		<div v-if="close" class="flex-shrink-0">
			<UiButton
				v-if="typeof close === 'object'"
				v-bind="close"
				size="sm"
				variant="ghost"
				:icon="closeIcon"
				@click.stop="closeToast"
			/>
			<UiButton
				v-else
				size="sm"
				variant="ghost"
				color="neutral"
				:icon="closeIcon"
				class="!p-1 !min-h-[24px] !w-[24px]"
				@click.stop="closeToast"
			/>
		</div>

		<!-- Barra de progresso -->
		<div
			v-if="progress && duration && duration > 0"
			class="absolute inset-x-0 bottom-0 h-1 bg-[var(--bg-muted)] overflow-hidden"
		>
			<div
				class="h-full transition-all duration-100 ease-linear"
				:class="{
					'bg-[var(--primary)]': progressColor === 'primary',
					'bg-[var(--success)]': progressColor === 'success',
					'bg-[var(--warning)]': progressColor === 'warning',
					'bg-[var(--error)]': progressColor === 'error',
					'bg-[var(--text-primary)]': progressColor === 'neutral',
				}"
				:style="{ width: `${progressValue}%` }"
			></div>
		</div>
	</div>
</template>
