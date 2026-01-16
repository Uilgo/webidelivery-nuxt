<script setup lang="ts">
/**
 * 📌 UiDrawer
 *
 * Componente de drawer modal que desliza da direita.
 * Ideal para formulários, criação e edição de itens.
 * Permite scroll natural na área de conteúdo sem problemas de UX.
 */

interface Props {
	/** Controla a visibilidade do drawer */
	modelValue: boolean;
	/** Título do drawer */
	title?: string;
	/** Indica se o drawer é para edição (true) ou criação (false) */
	isEdicao?: boolean;
	/** Tamanho do drawer */
	size?: "sm" | "md" | "lg" | "xl";
	/** Estado de carregamento */
	loading?: boolean;
	/** Permitir fechar clicando no overlay */
	closeOnOverlay?: boolean;
	/** Permitir fechar com tecla Escape */
	closeOnEscape?: boolean;
	/** Mostrar botão X de fechar */
	showCloseButton?: boolean;
}

interface Emits {
	"update:modelValue": [value: boolean];
	open: [];
	close: [];
}

const props = withDefaults(defineProps<Props>(), {
	title: "",
	isEdicao: false,
	size: "md",
	loading: false,
	closeOnOverlay: true,
	closeOnEscape: true,
	showCloseButton: true,
});

const emit = defineEmits<Emits>();

// IDs únicos para acessibilidade
const titleId = useId();
const descriptionId = useId();

// Função para fechar o drawer
const close = (): void => {
	emit("update:modelValue", false);
	emit("close");
};

// Handler para clique no overlay
const handleOverlayClick = (): void => {
	if (props.closeOnOverlay && !props.loading) {
		close();
	}
};

// Handler para tecla Escape
const handleKeydown = (event: KeyboardEvent): void => {
	if (event.key === "Escape" && props.closeOnEscape && props.modelValue && !props.loading) {
		close();
	}
};

// Classes computadas para o drawer
const drawerClasses = computed(() => {
	const baseClasses = [
		"fixed top-0 right-0 h-full z-[100]",
		"bg-[var(--bg-surface)]",
		"border-l border-[var(--border-default)]",
		"shadow-2xl",
		"flex flex-col",
		"transform transition-transform duration-300 ease-in-out",
	];

	// Classes de tamanho
	const sizeClasses = {
		sm: "w-80",
		md: "w-96",
		lg: "w-[40rem]", // 640px - Maior para produtos
		xl: "w-[48rem]", // 768px
	};

	// Classes responsivas
	const responsiveClasses = [
		"max-w-[90vw]", // Máximo 90% da viewport em telas pequenas
		"sm:max-w-none", // Remove limitação em telas maiores
	];

	return [...baseClasses, sizeClasses[props.size], ...responsiveClasses].join(" ");
});

// Classes computadas para o header
const headerClasses = computed(() => {
	const baseClasses = [
		"px-6 py-4",
		"border-b border-[var(--border-muted)]",
		"flex-shrink-0",
		"bg-[var(--bg-surface)]",
	];
	return baseClasses.join(" ");
});

// Classes computadas para o conteúdo
const contentClasses = computed(() => {
	const baseClasses = ["flex-1", "overflow-y-auto", "custom-scrollbar", "px-6 py-4"];
	return baseClasses.join(" ");
});

// Classes computadas para o footer
const footerClasses = computed(() => {
	const baseClasses = [
		"px-6 py-4",
		"border-t border-[var(--border-muted)]",
		"flex-shrink-0",
		"bg-[var(--bg-surface)]",
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

// Estado para controlar hidratação SSR-friendly
const isMounted = ref(false);

// Lifecycle hooks
onMounted(() => {
	document.addEventListener("keydown", handleKeydown);
	// Pequeno delay para garantir que a hidratação esteja completa
	nextTick(() => {
		isMounted.value = true;
	});
});

onUnmounted(() => {
	document.removeEventListener("keydown", handleKeydown);
	// Garantir que o scroll seja restaurado
	document.body.style.overflow = "";
});
</script>

<template>
	<!-- Overlay e Drawer - só renderiza quando necessário E após hidratação -->
	<Teleport v-if="isMounted && modelValue" to="body">
		<!-- Overlay -->
		<Transition
			name="drawer-overlay"
			enter-active-class="transition-opacity duration-300 ease-out"
			enter-from-class="opacity-0"
			enter-to-class="opacity-100"
			leave-active-class="transition-opacity duration-200 ease-in"
			leave-from-class="opacity-100"
			leave-to-class="opacity-0"
		>
			<div
				v-if="modelValue"
				class="fixed inset-0 z-[90] bg-black/30 backdrop-blur-[2px]"
				@click="handleOverlayClick"
			></div>
		</Transition>

		<!-- Drawer -->
		<Transition
			name="drawer-slide"
			enter-active-class="transition-transform duration-300 ease-out"
			enter-from-class="translate-x-full"
			enter-to-class="translate-x-0"
			leave-active-class="transition-transform duration-200 ease-in"
			leave-from-class="translate-x-0"
			leave-to-class="translate-x-full"
		>
			<div
				v-if="modelValue"
				:class="drawerClasses"
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
						<div class="flex-1 min-w-0">
							<slot name="header">
								<h2
									v-if="title"
									:id="titleId"
									class="text-heading-4 text-[var(--text-primary)] truncate"
								>
									{{ title }}
								</h2>
							</slot>
						</div>

						<!-- Botão de fechar -->
						<button
							v-if="showCloseButton"
							type="button"
							:disabled="loading"
							class="ml-4 p-2 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors duration-200 focus-ring disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
							@click="close"
						>
							<Icon name="lucide:x" class="w-5 h-5" />
						</button>
					</div>
				</div>

				<!-- Conteúdo com scroll -->
				<div :class="contentClasses">
					<slot :close="close" :loading="loading" :is-edicao="isEdicao"></slot>
				</div>

				<!-- Footer -->
				<div v-if="$slots.footer" :class="footerClasses">
					<slot name="footer" :close="close" :loading="loading" :is-edicao="isEdicao"></slot>
				</div>

				<!-- Loading overlay -->
				<div
					v-if="loading"
					class="absolute inset-0 bg-[var(--bg-surface)]/80 backdrop-blur-sm flex items-center justify-center z-10"
				>
					<div class="flex flex-col items-center space-y-3">
						<Icon name="lucide:loader-2" class="w-8 h-8 animate-spin text-[var(--primary)]" />
						<p class="text-sm text-[var(--text-muted)]">Carregando...</p>
					</div>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<style scoped>
/* Scrollbar customizada para o conteúdo */
.custom-scrollbar {
	scrollbar-width: thin;
	scrollbar-color: var(--border-muted) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
	width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
	background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
	background-color: var(--border-muted);
	border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
	background-color: var(--border-default);
}
</style>
