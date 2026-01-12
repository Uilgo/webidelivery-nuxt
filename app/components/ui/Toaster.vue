<script setup lang="ts">
/**
 * 📌 Toaster Component
 *
 * Container que gerencia e exibe múltiplos toasts.
 * Baseado no sistema do Nuxt UI com posicionamento configurável.
 */

import type { ToastItem } from "~/composables/ui/useToast";
import { useToast } from "~/composables/ui/useToast";

// Tipos para as props do componente
interface Props {
	/** Posição dos toasts na tela */
	position?:
		| "top-left"
		| "top-center"
		| "top-right"
		| "bottom-left"
		| "bottom-center"
		| "bottom-right";
	/** Duração padrão dos toasts em ms */
	duration?: number;
	/** Máximo de toasts exibidos simultaneamente */
	max?: number;
	/** Expandir toasts ao hover */
	expand?: boolean;
}

// Props com valores padrão
const props = withDefaults(defineProps<Props>(), {
	position: "top-right",
	duration: 5000,
	max: 5,
	expand: true,
});

// Composable de toast
const { toasts, remove } = useToast();

// ============================================
// COMPUTED
// ============================================

// Classes do container baseadas na posição
const containerClasses = computed(() => {
	const baseClasses = [
		"fixed z-[100] flex flex-col gap-2 p-4 pointer-events-none",
		"max-w-sm w-full",
	];

	// Classes de posicionamento
	const positionClasses = {
		"top-left": "top-0 left-0",
		"top-center": "top-0 left-1/2 -translate-x-1/2",
		"top-right": "top-0 right-0",
		"bottom-left": "bottom-0 left-0",
		"bottom-center": "bottom-0 left-1/2 -translate-x-1/2",
		"bottom-right": "bottom-0 right-0",
	};

	return [...baseClasses, positionClasses[props.position]].join(" ");
});

// Toasts visíveis limitados pelo max
const visibleToasts = computed(() => {
	return toasts.value.slice(0, props.max);
});

// Classes do toast baseadas na posição e expansão
const toastClasses = computed(() => {
	const baseClasses = ["pointer-events-auto"];

	// Ordem baseada na posição
	const isBottom = props.position.includes("bottom");
	if (isBottom) {
		baseClasses.push("order-last");
	}

	return baseClasses.join(" ");
});

// ============================================
// METHODS
// ============================================

/**
 * Handler para fechar toast
 */
const handleToastClose = (toast: ToastItem): void => {
	remove(toast.id);
};

/**
 * Handler para clique no toast
 */
const handleToastClick = (toast: ToastItem): void => {
	if (toast.onClick) {
		toast.onClick(toast);
	}
};

/**
 * Handler para mudança de estado aberto
 */
const handleToastUpdateOpen = (toast: ToastItem, open: boolean): void => {
	if (toast.onUpdateOpen) {
		toast.onUpdateOpen(open);
	}

	if (!open) {
		handleToastClose(toast);
	}
};
</script>

<template>
	<Teleport to="body">
		<div v-if="visibleToasts.length > 0" :class="containerClasses">
			<TransitionGroup
				name="toast"
				tag="div"
				class="flex flex-col gap-2"
				:class="{
					'flex-col-reverse': position.includes('bottom'),
				}"
			>
				<div v-for="toast in visibleToasts" :key="toast.id" :class="toastClasses">
					<UiToast
						v-bind="toast"
						:duration="toast.duration || duration"
						@close="handleToastClose(toast)"
						@click="handleToastClick(toast)"
						@update:open="handleToastUpdateOpen(toast, $event)"
					>
						<!-- Slots passthrough -->
						<template v-if="$slots.title" #title>
							<slot name="title" :toast="toast"></slot>
						</template>

						<template v-if="$slots.description" #description>
							<slot name="description" :toast="toast"></slot>
						</template>
					</UiToast>
				</div>
			</TransitionGroup>
		</div>
	</Teleport>
</template>

<style scoped>
/* Animações dos toasts */
.toast-enter-active,
.toast-leave-active {
	transition: all 0.3s ease-out;
}

.toast-enter-from {
	opacity: 0;
	transform: translateX(100%) scale(0.95);
}

.toast-leave-to {
	opacity: 0;
	transform: translateX(100%) scale(0.95);
}

/* Animações para posições à esquerda */
.toast-enter-from {
	transform: translateX(100%) scale(0.95);
}

.toast-leave-to {
	transform: translateX(100%) scale(0.95);
}

/* Ajustar animações baseadas na posição */
:deep(.top-left .toast-enter-from),
:deep(.bottom-left .toast-enter-from) {
	transform: translateX(-100%) scale(0.95);
}

:deep(.top-left .toast-leave-to),
:deep(.bottom-left .toast-leave-to) {
	transform: translateX(-100%) scale(0.95);
}

:deep(.top-center .toast-enter-from),
:deep(.bottom-center .toast-enter-from) {
	transform: translateY(-20px) scale(0.95);
}

:deep(.top-center .toast-leave-to),
:deep(.bottom-center .toast-leave-to) {
	transform: translateY(-20px) scale(0.95);
}
</style>
