<script setup lang="ts">
/**
 * 📌 Popover Component
 *
 * Componente de popover reutilizável com posicionamento automático e trigger customizável.
 * Suporta diferentes posições, comportamentos de fechamento e animações.
 * Segue o design system definido no main.css.
 */

// Tipos para as props do componente
interface Props {
	/** Controla a visibilidade do popover */
	modelValue?: boolean;
	/** Posição do popover em relação ao trigger */
	placement?:
		| "top"
		| "bottom"
		| "left"
		| "right"
		| "top-start"
		| "top-end"
		| "bottom-start"
		| "bottom-end";
	/** Trigger que abre o popover */
	trigger?: "click" | "hover" | "focus" | "manual";
	/** Delay para abrir (apenas com hover) */
	openDelay?: number;
	/** Delay para fechar (apenas com hover) */
	closeDelay?: number;
	/** Fechar ao clicar fora */
	closeOnClickOutside?: boolean;
	/** Fechar ao pressionar Escape */
	closeOnEscape?: boolean;
	/** Offset do popover em relação ao trigger */
	offset?: number;
	/** Estado desabilitado */
	disabled?: boolean;
	/** Mostrar seta apontando para o trigger */
	arrow?: boolean;
}

// Props com valores padrão
const props = withDefaults(defineProps<Props>(), {
	modelValue: false,
	placement: "bottom",
	trigger: "click",
	openDelay: 0,
	closeDelay: 100,
	closeOnClickOutside: true,
	closeOnEscape: true,
	offset: 8,
	disabled: false,
	arrow: true,
});

// Emits tipados
interface Emits {
	"update:modelValue": [value: boolean];
	open: [];
	close: [];
}

const emit = defineEmits<Emits>();

// Refs
const triggerRef = ref<HTMLElement>();
const popoverRef = ref<HTMLElement>();

// Estados reativos
const isOpen = ref(props.modelValue);
const openTimeout = ref<ReturnType<typeof setTimeout>>();
const closeTimeout = ref<ReturnType<typeof setTimeout>>();

// Controle de abertura/fechamento
const open = (): void => {
	if (props.disabled) return;

	if (closeTimeout.value) {
		clearTimeout(closeTimeout.value);
		closeTimeout.value = undefined;
	}

	if (props.openDelay > 0) {
		openTimeout.value = setTimeout(() => {
			isOpen.value = true;
			emit("update:modelValue", true);
			emit("open");
		}, props.openDelay);
	} else {
		isOpen.value = true;
		emit("update:modelValue", true);
		emit("open");
	}
};

const close = (): void => {
	if (openTimeout.value) {
		clearTimeout(openTimeout.value);
		openTimeout.value = undefined;
	}

	if (props.closeDelay > 0) {
		closeTimeout.value = setTimeout(() => {
			isOpen.value = false;
			emit("update:modelValue", false);
			emit("close");
		}, props.closeDelay);
	} else {
		isOpen.value = false;
		emit("update:modelValue", false);
		emit("close");
	}
};

const toggle = (): void => {
	if (isOpen.value) {
		close();
	} else {
		open();
	}
};

// Classes computadas para o popover
const popoverClasses = computed(() => {
	const baseClasses = [
		"absolute z-50",
		"bg-[var(--bg-surface)]",
		"border border-[var(--border-default)]",
		"rounded-lg",
		"shadow-lg",
		"transition-all duration-200",
		"origin-top",
		"min-w-[200px]",
	];

	// Classes de posicionamento
	const placementClasses = {
		top: "bottom-full left-1/2 transform -translate-x-1/2",
		bottom: "top-full left-1/2 transform -translate-x-1/2",
		left: "right-full top-1/2 transform -translate-y-1/2",
		right: "left-full top-1/2 transform -translate-y-1/2",
		"top-start": "bottom-full left-0",
		"top-end": "bottom-full right-0",
		"bottom-start": "top-full left-0",
		"bottom-end": "top-full right-0",
	};

	// Classes de animação baseadas no estado
	const animationClasses = isOpen.value
		? "opacity-100 scale-100 translate-y-0"
		: "opacity-0 scale-95 -translate-y-1 pointer-events-none";

	return [...baseClasses, placementClasses[props.placement], animationClasses].join(" ");
});

// Estilo computado para o offset
const popoverStyle = computed(() => {
	const offsetMap = {
		top: { marginBottom: `${props.offset}px` },
		bottom: { marginTop: `${props.offset}px` },
		left: { marginRight: `${props.offset}px` },
		right: { marginLeft: `${props.offset}px` },
		"top-start": { marginBottom: `${props.offset}px` },
		"top-end": { marginBottom: `${props.offset}px` },
		"bottom-start": { marginTop: `${props.offset}px` },
		"bottom-end": { marginTop: `${props.offset}px` },
	};
	return offsetMap[props.placement];
});

// Classes computadas para a seta
const arrowClasses = computed(() => {
	if (!props.arrow) return "";

	const baseClasses = [
		"absolute w-2 h-2 bg-[var(--bg-surface)] border-[var(--border-default)]",
		"transform rotate-45",
	];

	// Posicionamento da seta baseado na posição do popover
	const arrowPositions = {
		top: "top-full left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-r border-b",
		bottom: "bottom-full left-1/2 transform -translate-x-1/2 translate-y-1/2 border-l border-t",
		left: "left-full top-1/2 transform -translate-y-1/2 -translate-x-1/2 border-t border-r",
		right: "right-full top-1/2 transform -translate-y-1/2 translate-x-1/2 border-b border-l",
		"top-start": "top-full left-4 transform -translate-y-1/2 border-r border-b",
		"top-end": "top-full right-4 transform -translate-y-1/2 border-r border-b",
		"bottom-start": "bottom-full left-4 transform translate-y-1/2 border-l border-t",
		"bottom-end": "bottom-full right-4 transform translate-y-1/2 border-l border-t",
	};

	return [...baseClasses, arrowPositions[props.placement]].join(" ");
});

// Handler para click outside
const handleClickOutside = (event: MouseEvent): void => {
	if (!props.closeOnClickOutside || !isOpen.value) return;

	const target = event.target as Node;
	const isClickInsidePopover = popoverRef.value?.contains(target);
	const isClickInsideTrigger = triggerRef.value?.contains(target);

	if (!isClickInsidePopover && !isClickInsideTrigger) {
		close();
	}
};

// Handler para tecla Escape
const handleKeydown = (event: KeyboardEvent): void => {
	if (event.key === "Escape" && props.closeOnEscape && isOpen.value) {
		close();
	}
};

// Handlers para diferentes triggers
const handleTriggerClick = (): void => {
	if (props.trigger === "click") {
		toggle();
	}
};

const handleTriggerMouseEnter = (): void => {
	if (props.trigger === "hover") {
		open();
	}
};

const handleTriggerMouseLeave = (): void => {
	if (props.trigger === "hover") {
		close();
	}
};

const handlePopoverMouseEnter = (): void => {
	if (props.trigger === "hover") {
		// Cancelar o fechamento se o mouse entrar no popover
		if (closeTimeout.value) {
			clearTimeout(closeTimeout.value);
			closeTimeout.value = undefined;
		}
	}
};

const handlePopoverMouseLeave = (): void => {
	if (props.trigger === "hover") {
		close();
	}
};

const handleTriggerFocus = (): void => {
	if (props.trigger === "focus") {
		open();
	}
};

const handleTriggerBlur = (): void => {
	if (props.trigger === "focus") {
		close();
	}
};

// Watcher para sincronizar com modelValue
watch(
	() => props.modelValue,
	(newValue) => {
		isOpen.value = newValue;
	},
);

// Lifecycle hooks
onMounted(() => {
	document.addEventListener("click", handleClickOutside);
	document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
	document.removeEventListener("click", handleClickOutside);
	document.removeEventListener("keydown", handleKeydown);

	// Limpar timeouts
	if (openTimeout.value) clearTimeout(openTimeout.value);
	if (closeTimeout.value) clearTimeout(closeTimeout.value);
});

// Expor métodos públicos
defineExpose({
	open,
	close,
	toggle,
	isOpen: readonly(isOpen),
});
</script>

<template>
	<div class="relative inline-block">
		<!-- Trigger -->
		<div
			ref="triggerRef"
			:class="{ 'cursor-not-allowed opacity-50': disabled }"
			@click="handleTriggerClick"
			@mouseenter="handleTriggerMouseEnter"
			@mouseleave="handleTriggerMouseLeave"
			@focus="handleTriggerFocus"
			@blur="handleTriggerBlur"
		>
			<slot name="trigger" :is-open="isOpen" :toggle="toggle" :open="open" :close="close">
				<!-- Trigger padrão se não fornecido -->
				<button
					type="button"
					class="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg hover:bg-[var(--bg-hover)] focus-ring transition-colors duration-200"
					:disabled="disabled"
				>
					Popover
				</button>
			</slot>
		</div>

		<!-- Popover Content -->
		<div
			ref="popoverRef"
			:class="popoverClasses"
			:style="popoverStyle"
			@mouseenter="handlePopoverMouseEnter"
			@mouseleave="handlePopoverMouseLeave"
		>
			<!-- Seta -->
			<div v-if="arrow" :class="arrowClasses"></div>

			<!-- Conteúdo -->
			<slot :is-open="isOpen" :close="close"></slot>
		</div>
	</div>
</template>

<style scoped>
/* CSS necessário para funcionalidade específica que não pode ser feita apenas com Tailwind */
</style>
