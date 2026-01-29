<script setup lang="ts">
/**
 * 📌 BottomSheet
 *
 * Componente de Bottom Sheet para mobile.
 * Painel que desliza de baixo para cima, cobrindo parte da tela.
 * Usado apenas em dispositivos móveis (< 640px).
 */

// Desabilita herança automática de atributos para controlar onde aplicá-los
defineOptions({
	inheritAttrs: false,
});

interface Props {
	modelValue: boolean;
	title?: string;
	snapPoints?: number[]; // Pontos de snap em % da altura da tela
	defaultSnap?: number; // Índice do snap point inicial
	showHandle?: boolean;
	closeOnClickOutside?: boolean;
}

interface Emits {
	(e: "update:modelValue", value: boolean): void;
	(e: "close"): void;
}

const props = withDefaults(defineProps<Props>(), {
	title: undefined,
	snapPoints: () => [90], // 90% da altura por padrão
	defaultSnap: 0,
	showHandle: true,
	closeOnClickOutside: true,
});

const emit = defineEmits<Emits>();

// Estado interno
const isOpen = computed({
	get: () => props.modelValue,
	set: (value: boolean) => emit("update:modelValue", value),
});

const sheetRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const startY = ref(0);
const currentY = ref(0);
const currentSnapIndex = ref(props.defaultSnap);

/**
 * Altura atual do sheet baseado no snap point
 */
const sheetHeight = computed(() => {
	return `${props.snapPoints[currentSnapIndex.value]}%`;
});

/**
 * Fecha o bottom sheet
 */
const close = () => {
	isOpen.value = false;
	emit("close");
};

/**
 * Inicia o drag
 */
const handleTouchStart = (e: TouchEvent) => {
	if (!props.showHandle) return;

	const touch = e.touches[0];
	if (!touch) return;

	isDragging.value = true;
	startY.value = touch.clientY;
	currentY.value = startY.value;
};

/**
 * Durante o drag
 */
const handleTouchMove = (e: TouchEvent) => {
	if (!isDragging.value) return;

	const touch = e.touches[0];
	if (!touch) return;

	const sheet = sheetRef.value;
	if (!sheet) return;

	currentY.value = touch.clientY;
	const deltaY = currentY.value - startY.value;

	// Só permite arrastar para baixo
	if (deltaY > 0) {
		sheet.style.transform = `translateY(${deltaY}px)`;
	}
};

/**
 * Finaliza o drag
 */
const handleTouchEnd = () => {
	if (!isDragging.value) return;
	isDragging.value = false;

	const deltaY = currentY.value - startY.value;

	// Se arrastou mais de 100px para baixo, fecha
	if (deltaY > 100) {
		close();
	}

	// Reset transform
	const sheet = sheetRef.value;
	if (sheet) {
		sheet.style.transform = "";
	}
};

/**
 * Clique no overlay
 */
const handleOverlayClick = () => {
	if (props.closeOnClickOutside) {
		close();
	}
};

/**
 * Previne scroll do body quando aberto
 */
watch(isOpen, (open) => {
	if (open) {
		document.body.style.overflow = "hidden";
	} else {
		document.body.style.overflow = "";
	}
});

// Cleanup ao desmontar
onUnmounted(() => {
	document.body.style.overflow = "";
});
</script>

<template>
	<Teleport to="body">
		<Transition
			enter-active-class="transition-opacity duration-300"
			enter-from-class="opacity-0"
			enter-to-class="opacity-100"
			leave-active-class="transition-opacity duration-200"
			leave-from-class="opacity-100"
			leave-to-class="opacity-0"
		>
			<div
				v-if="isOpen"
				class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
				@click="handleOverlayClick"
			></div>
		</Transition>

		<Transition
			enter-active-class="transition-transform duration-300 ease-out"
			enter-from-class="translate-y-full"
			enter-to-class="translate-y-0"
			leave-active-class="transition-transform duration-200 ease-in"
			leave-from-class="translate-y-0"
			leave-to-class="translate-y-full"
		>
			<div
				v-if="isOpen"
				ref="sheetRef"
				:class="[
					$attrs.class,
					'fixed bottom-0 left-0 right-0 z-50 bg-[var(--cardapio-background)] rounded-t-3xl shadow-2xl flex flex-col',
				]"
				:style="{ height: sheetHeight }"
				@touchstart="handleTouchStart"
				@touchmove="handleTouchMove"
				@touchend="handleTouchEnd"
			>
				<!-- Handle (barra de arrasto) -->
				<div v-if="showHandle" class="flex justify-center py-3 cursor-grab active:cursor-grabbing">
					<div class="w-12 h-1.5 bg-[var(--cardapio-text-muted)] opacity-30 rounded-full"></div>
				</div>

				<!-- Header -->
				<div v-if="title || $slots.header" class="shrink-0">
					<slot name="header">
						<div class="px-4 py-3 border-b border-[var(--cardapio-border)]">
							<h2 class="text-lg font-semibold text-[var(--cardapio-text)]">
								{{ title }}
							</h2>
						</div>
					</slot>
				</div>

				<!-- Content -->
				<div ref="contentRef" class="flex-1 overflow-y-auto overscroll-contain">
					<slot></slot>
				</div>

				<!-- Footer -->
				<div v-if="$slots.footer" class="border-t border-[var(--cardapio-border)]">
					<slot name="footer" :close="close"></slot>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>
