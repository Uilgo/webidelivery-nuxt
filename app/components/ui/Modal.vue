<script setup lang="ts">
/**
 * 📌 Modal Component
 *
 * Componente de modal reutilizável com overlay, animações e controle de foco.
 * Suporta diferentes tamanhos, posições e comportamentos de fechamento.
 * Segue o design system definido no main.css.
 */

// Tipos para as props do componente
interface Props {
	/** Controla a visibilidade do modal */
	modelValue: boolean;
	/** Título do modal */
	title?: string;
	/** Indica se o modal é para edição (true) ou criação (false) */
	isEdicao?: boolean;
	/** Tamanho do modal */
	size?: "sm" | "md" | "lg" | "xl" | "full";
	/** Posição vertical do modal */
	position?: "center" | "top" | "bottom";
	/** Permitir fechar clicando no overlay */
	closeOnOverlay?: boolean;
	/** Permitir fechar com tecla Escape */
	closeOnEscape?: boolean;
	/** Mostrar botão X de fechar */
	showCloseButton?: boolean;
	/** Remover padding do conteúdo */
	noPadding?: boolean;
	/** Scroll interno quando conteúdo é muito grande */
	scrollable?: boolean;
}

// Props com valores padrão
const props = withDefaults(defineProps<Props>(), {
	title: "",
	isEdicao: false,
	size: "md",
	position: "center",
	closeOnOverlay: true,
	closeOnEscape: true,
	showCloseButton: true,
	noPadding: false,
	scrollable: true,
});

// Emits tipados
interface Emits {
	"update:modelValue": [value: boolean];
	open: [];
	close: [];
}

const emit = defineEmits<Emits>();

// IDs únicos para acessibilidade
const titleId = useId();
const descriptionId = useId();

// Função para fechar o modal
const close = (): void => {
	emit("update:modelValue", false);
	emit("close");
};

// Handler para clique no overlay
const handleOverlayClick = (): void => {
	if (props.closeOnOverlay) {
		close();
	}
};

// Handler para tecla Escape
const handleKeydown = (event: KeyboardEvent): void => {
	if (event.key === "Escape" && props.closeOnEscape && props.modelValue) {
		close();
	}
};

// Classes computadas para o modal
const modalClasses = computed(() => {
	const baseClasses = [
		"fixed z-50",
		"bg-[var(--bg-surface)]",
		"border border-[var(--border-default)]",
		"rounded-lg",
		"shadow-xl",
		"max-h-[90vh]",
		"w-full",
		"mx-4",
	];

	// Classes de tamanho
	const sizeClasses = {
		sm: "max-w-sm",
		md: "max-w-md",
		lg: "max-w-lg",
		xl: "max-w-2xl",
		full: "max-w-[95vw] max-h-[95vh]",
	};

	// Classes de posição
	const positionClasses = {
		center: "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
		top: "top-8 left-1/2 transform -translate-x-1/2",
		bottom: "bottom-8 left-1/2 transform -translate-x-1/2",
	};

	// Classes de scroll
	const scrollClasses = props.scrollable ? ["overflow-hidden", "flex", "flex-col"] : [];

	return [
		...baseClasses,
		sizeClasses[props.size],
		positionClasses[props.position],
		...scrollClasses,
	].join(" ");
});

// Classes computadas para o header
const headerClasses = computed(() => {
	const baseClasses = ["px-6 py-4", "border-b border-[var(--border-muted)]", "flex-shrink-0"];
	return baseClasses.join(" ");
});

// Classes computadas para o conteúdo
const contentClasses = computed(() => {
	const baseClasses = [];

	if (!props.noPadding) {
		baseClasses.push("px-6 py-4");
	}

	if (props.scrollable) {
		baseClasses.push("flex-1", "overflow-y-auto", "custom-scrollbar");
	}

	return baseClasses.join(" ");
});

// Classes computadas para o footer
const footerClasses = computed(() => {
	const baseClasses = [
		"px-6 py-4",
		"border-t border-[var(--border-muted)]",
		"flex-shrink-0",
		"bg-[var(--bg-muted)]",
		"rounded-b-lg",
	];
	return baseClasses.join(" ");
});

// Watchers para controle de scroll do body
watch(
	() => props.modelValue,
	(isOpen) => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
			emit("open");
		} else {
			document.body.style.overflow = "";
		}
	},
);

// Lifecycle hooks
onMounted(() => {
	document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
	document.removeEventListener("keydown", handleKeydown);
	// Garantir que o scroll seja restaurado
	document.body.style.overflow = "";
});
</script>

<template>
	<!-- Overlay -->
	<Teleport to="body">
		<Transition
			name="modal-overlay"
			enter-active-class="transition-opacity duration-200 ease-out"
			enter-from-class="opacity-0"
			enter-to-class="opacity-100"
			leave-active-class="transition-opacity duration-150 ease-in"
			leave-from-class="opacity-100"
			leave-to-class="opacity-0"
		>
			<div
				v-if="modelValue"
				class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
				@click="handleOverlayClick"
			></div>
		</Transition>

		<!-- Modal -->
		<Transition
			name="modal-content"
			enter-active-class="transition-all duration-200 ease-out"
			enter-from-class="opacity-0 scale-95"
			enter-to-class="opacity-100 scale-100"
			leave-active-class="transition-all duration-150 ease-in"
			leave-from-class="opacity-100 scale-100"
			leave-to-class="opacity-0 scale-95"
		>
			<div
				v-if="modelValue"
				:class="modalClasses"
				role="dialog"
				:aria-labelledby="titleId"
				:aria-describedby="descriptionId"
				aria-modal="true"
				@click.stop
			>
				<!-- Header -->
				<div v-if="$slots.header || title || showCloseButton" :class="headerClasses">
					<div class="flex items-center justify-between">
						<!-- Título ou slot header -->
						<div class="flex-1">
							<slot name="header">
								<h2 v-if="title" :id="titleId" class="text-heading-4 text-[var(--text-primary)]">
									{{ title }}
								</h2>
							</slot>
						</div>

						<!-- Botão de fechar -->
						<button
							v-if="showCloseButton"
							type="button"
							class="ml-4 p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors duration-200 focus-ring"
							@click="close"
						>
							<Icon name="lucide:x" class="w-5 h-5" />
						</button>
					</div>
				</div>

				<!-- Conteúdo -->
				<div :class="contentClasses">
					<slot :close="close" :is-edicao="isEdicao"></slot>
				</div>

				<!-- Footer -->
				<div v-if="$slots.footer" :class="footerClasses">
					<slot name="footer" :close="close" :is-edicao="isEdicao"></slot>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<style scoped>
/* CSS necessário para funcionalidade específica que não pode ser feita apenas com Tailwind */
</style>
