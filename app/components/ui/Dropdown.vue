<script setup lang="ts">
/**
 * 📌 Dropdown Component
 *
 * Componente de dropdown reutilizável com trigger customizável e posicionamento automático.
 * Suporta diferentes tamanhos, posições e estados.
 * Segue o design system definido no main.css.
 */

// Tipos para as props do componente
interface Props {
	/** Posição do dropdown em relação ao trigger */
	placement?: "bottom-start" | "bottom-end" | "top-start" | "top-end" | "left" | "right";
	/** Tamanho do dropdown */
	size?: "sm" | "md" | "lg";
	/** Estado desabilitado */
	disabled?: boolean;
	/** Fechar ao clicar fora */
	closeOnClickOutside?: boolean;
	/** Fechar ao pressionar Escape */
	closeOnEscape?: boolean;
	/** Offset do dropdown em relação ao trigger */
	offset?: number;
}

// Props com valores padrão
const props = withDefaults(defineProps<Props>(), {
	placement: "bottom-start",
	size: "md",
	disabled: false,
	closeOnClickOutside: true,
	closeOnEscape: true,
	offset: 4,
});

// Emits tipados
interface Emits {
	open: [];
	close: [];
	toggle: [isOpen: boolean];
}

const emit = defineEmits<Emits>();

// Estados reativos
const isOpen = ref(false);
const triggerRef = ref<HTMLElement>();
const dropdownRef = ref<HTMLElement>();

// Controle de abertura/fechamento
const open = (): void => {
	if (props.disabled) return;
	isOpen.value = true;
	emit("open");
	emit("toggle", true);
};

const close = (): void => {
	isOpen.value = false;
	emit("close");
	emit("toggle", false);
};

const toggle = (): void => {
	if (isOpen.value) {
		close();
	} else {
		open();
	}
};

// Classes computadas para o dropdown
const dropdownClasses = computed(() => {
	const baseClasses = [
		"absolute z-[99999]",
		"bg-[var(--bg-surface)]",
		"border border-[var(--border-default)]",
		"rounded-lg",
		"shadow-lg",
		"transition-all duration-200",
		"origin-top",
	];

	// Classes de tamanho
	const sizeClasses = {
		sm: "p-0.5",
		md: "p-1",
		lg: "p-1",
	};

	// Classes de posicionamento
	const placementClasses = {
		"bottom-start": "top-full left-0",
		"bottom-end": "top-full right-0",
		"top-start": "bottom-full left-0",
		"top-end": "bottom-full right-0",
		left: "right-full top-0",
		right: "left-full top-0",
	};

	// Classes de animação baseadas no estado
	const animationClasses = isOpen.value
		? "opacity-100 scale-100 translate-y-0"
		: "opacity-0 scale-95 -translate-y-1 pointer-events-none";

	return [
		...baseClasses,
		sizeClasses[props.size],
		placementClasses[props.placement],
		animationClasses,
	].join(" ");
});

// Estilo computado para o offset e largura
const dropdownStyle = computed(() => {
	const offsetMap = {
		"bottom-start": { marginTop: `${props.offset}px` },
		"bottom-end": { marginTop: `${props.offset}px` },
		"top-start": { marginBottom: `${props.offset}px` },
		"top-end": { marginBottom: `${props.offset}px` },
		left: { marginRight: `${props.offset}px` },
		right: { marginLeft: `${props.offset}px` },
	};
	return offsetMap[props.placement];
});

// Handler para click outside
const handleClickOutside = (event: MouseEvent): void => {
	if (!props.closeOnClickOutside || !isOpen.value) return;

	const target = event.target as Node;
	const isClickInsideDropdown = dropdownRef.value?.contains(target);
	const isClickInsideTrigger = triggerRef.value?.contains(target);

	if (!isClickInsideDropdown && !isClickInsideTrigger) {
		close();
	}
};

// Listener para tecla Escape
const handleKeydown = (event: KeyboardEvent): void => {
	if (event.key === "Escape" && props.closeOnEscape && isOpen.value) {
		close();
	}
};

// Lifecycle hooks
onMounted(() => {
	if (props.closeOnClickOutside) {
		document.addEventListener("click", handleClickOutside);
	}
	if (props.closeOnEscape) {
		document.addEventListener("keydown", handleKeydown);
	}
});

onUnmounted(() => {
	if (props.closeOnClickOutside) {
		document.removeEventListener("click", handleClickOutside);
	}
	if (props.closeOnEscape) {
		document.removeEventListener("keydown", handleKeydown);
	}
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
		<div ref="triggerRef" :class="{ 'cursor-not-allowed opacity-50': disabled }">
			<slot name="trigger" :is-open="isOpen" :toggle="toggle" :open="open" :close="close">
				<!-- Trigger padrão se não fornecido -->
				<button
					type="button"
					class="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg hover:bg-[var(--bg-hover)] focus-ring transition-colors duration-200"
					:disabled="disabled"
					@click="toggle"
				>
					Dropdown
					<Icon
						name="lucide:chevron-down"
						class="w-4 h-4 transition-transform duration-200"
						:class="{ 'rotate-180': isOpen }"
					/>
				</button>
			</slot>
		</div>

		<!-- Dropdown Content -->
		<div ref="dropdownRef" :class="dropdownClasses" :style="dropdownStyle">
			<slot :is-open="isOpen" :close="close">
				<!-- Conteúdo padrão se não fornecido -->
				<div class="px-3 py-2 text-sm text-[var(--text-secondary)]">Conteúdo do dropdown</div>
			</slot>
		</div>
	</div>
</template>

<style scoped>
/* CSS necessário para funcionalidade específica que não pode ser feita apenas com Tailwind */
</style>
