<script setup lang="ts">
/**
 * 📌 Combobox Component
 *
 * Componente híbrido Input + Dropdown que permite:
 * - Digitação livre de valores não listados
 * - Seleção de sugestões do dropdown
 * - Busca/filtro em tempo real
 * - Feedback visual de estados (match, fallback, bloqueado)
 *
 * Baseado no InputMenu do Nuxt UI, adaptado para o design system do projeto.
 */

// Tipos para as opções do combobox
interface ComboboxOption {
	label: string;
	value: string | number;
	disabled?: boolean;
	description?: string;
	icon?: string;
	badge?: string; // Ex: "R$ 5,00" para mostrar taxa
}

// Tipos para as props do componente
interface Props {
	/** Valor do input (v-model) */
	modelValue?: string | number | null;
	/** Opções do dropdown */
	options?: ComboboxOption[];
	/** Placeholder do input */
	placeholder?: string;
	/** Tamanho do combobox */
	size?: "sm" | "md" | "lg";
	/** Estado desabilitado */
	disabled?: boolean;
	/** Campo obrigatório */
	required?: boolean;
	/** ID customizado */
	id?: string;
	/** Estado de loading */
	loading?: boolean;
	/** Texto quando não há opções */
	emptyText?: string;
	/** Texto quando não há resultados na busca */
	noResultsText?: string;
	/** Permitir limpar seleção */
	clearable?: boolean;
	/** Estado de erro (para styling) */
	error?: boolean;
	/** Ícone à esquerda */
	icon?: string;
	/** Abrir dropdown ao focar */
	openOnFocus?: boolean;
	/** Feedback visual do estado (success, warning, error) */
	feedbackState?: "success" | "warning" | "error" | null;
	/** Mensagem de feedback */
	feedbackMessage?: string;
}

// Props com valores padrão
const props = withDefaults(defineProps<Props>(), {
	modelValue: null,
	options: () => [],
	placeholder: "Digite ou selecione...",
	size: "md",
	disabled: false,
	required: false,
	id: undefined,
	loading: false,
	emptyText: "Nenhuma opção disponível",
	noResultsText: "Nenhum resultado encontrado",
	clearable: false,
	error: false,
	icon: undefined,
	openOnFocus: false,
	feedbackState: null,
	feedbackMessage: undefined,
});

// Emits tipados
interface Emits {
	"update:modelValue": [value: string | number | null];
	change: [value: string | number | null, option: ComboboxOption | null];
	focus: [event: FocusEvent];
	blur: [event: FocusEvent];
	search: [query: string];
}

const emit = defineEmits<Emits>();

// ============================================
// ESTADOS REATIVOS
// ============================================

const isOpen = ref(false);
const inputRef = ref<HTMLInputElement>();
const dropdownRef = ref<HTMLElement>();
const comboboxRef = ref<HTMLElement>();
const highlightedIndex = ref(-1);
const shouldOpenUpward = ref(false);
const dropdownPosition = ref({ top: 0, left: 0, width: 0 });

// Gerar ID único
const generatedId = useId();
const comboboxId = computed(() => props.id || generatedId);

// ============================================
// COMPUTED PROPERTIES
// ============================================

// Valor interno do input (sempre string para digitação)
const inputValue = computed({
	get: () => {
		if (props.modelValue === null || props.modelValue === undefined) return "";
		return String(props.modelValue);
	},
	set: (value: string) => {
		emit("update:modelValue", value || null);
		emit("search", value);
	},
});

// Opções filtradas pela busca
const filteredOptions = computed(() => {
	if (!inputValue.value.trim()) {
		return props.options;
	}

	const query = inputValue.value.toLowerCase().trim();
	return props.options.filter(
		(option) =>
			option.label.toLowerCase().includes(query) ||
			option.description?.toLowerCase().includes(query),
	);
});

// Verificar se o valor atual corresponde a uma opção
const matchedOption = computed(() => {
	return props.options.find(
		(opt) =>
			opt.value === props.modelValue ||
			opt.label.toLowerCase() === String(props.modelValue).toLowerCase(),
	);
});

// Classes do container do input
const containerClasses = computed(() => {
	const baseClasses = [
		"flex items-center",
		"bg-[var(--input-bg)]",
		"border border-[var(--input-border)]",
		"rounded-lg",
		"transition-all duration-200",
	];

	// Classes de tamanho
	const sizeClasses = {
		sm: "min-h-[32px] px-3",
		md: "min-h-[40px] px-3",
		lg: "min-h-[48px] px-4",
	};

	// Classes de estado
	const stateClasses = [];

	// Estados de feedback visual
	if (props.feedbackState === "success") {
		stateClasses.push(
			"border-[var(--success)]",
			"focus-within:border-[var(--success)]",
			"focus-within:ring-2 focus-within:ring-[var(--success)] focus-within:ring-opacity-20",
		);
	} else if (props.feedbackState === "warning") {
		stateClasses.push(
			"border-[var(--warning)]",
			"focus-within:border-[var(--warning)]",
			"focus-within:ring-2 focus-within:ring-[var(--warning)] focus-within:ring-opacity-20",
		);
	} else if (props.feedbackState === "error" || props.error) {
		stateClasses.push(
			"border-[var(--error)]",
			"focus-within:border-[var(--error)]",
			"focus-within:ring-2 focus-within:ring-[var(--error)] focus-within:ring-opacity-20",
		);
	} else if (isOpen.value) {
		stateClasses.push(
			"border-[var(--input-border-focus)]",
			"ring-2 ring-[var(--input-border-focus)] ring-opacity-20",
		);
	} else {
		stateClasses.push("focus-within:border-[var(--input-border-focus)]");
	}

	if (props.disabled) {
		stateClasses.push("opacity-50", "cursor-not-allowed");
	}

	return [...baseClasses, sizeClasses[props.size], ...stateClasses].join(" ");
});

// Classes do input
const inputClasses = computed(() => {
	const baseClasses = [
		"flex-1",
		"bg-transparent",
		"border-0",
		"outline-none",
		"text-[var(--input-text)]",
		"placeholder:text-[var(--input-placeholder)]",
		"disabled:cursor-not-allowed",
	];

	const sizeClasses = {
		sm: "text-sm",
		md: "text-base",
		lg: "text-lg",
	};

	return [...baseClasses, sizeClasses[props.size]].join(" ");
});

// Classes do dropdown
const dropdownClasses = computed(() => {
	return [
		"bg-[var(--card-bg)]",
		"border border-[var(--border-default)]",
		"rounded-lg",
		"shadow-xl",
		"transition-all duration-200",
		"z-[9999]",
		"max-h-60",
		"overflow-y-auto",
		"py-1",
	].join(" ");
});

// ============================================
// FUNÇÕES DE CONTROLE
// ============================================

// Calcular posição do dropdown
const checkDropdownPosition = (): void => {
	if (!comboboxRef.value) return;

	const rect = comboboxRef.value.getBoundingClientRect();
	const viewportHeight = window.innerHeight;
	const dropdownHeight = 240; // max-h-60 = 240px
	const spaceBelow = viewportHeight - rect.bottom;
	const spaceAbove = rect.top;

	shouldOpenUpward.value = spaceBelow < dropdownHeight && spaceAbove > dropdownHeight;

	dropdownPosition.value = {
		top: shouldOpenUpward.value ? rect.top - 4 : rect.bottom + 4,
		left: rect.left,
		width: rect.width,
	};
};

// Estilo computado para posicionamento do dropdown
const dropdownPositionStyle = computed(() => {
	return {
		top: `${dropdownPosition.value.top}px`,
		left: `${dropdownPosition.value.left}px`,
		width: `${dropdownPosition.value.width}px`,
	};
});

// Abrir dropdown
const open = (): void => {
	if (props.disabled || props.loading) return;
	checkDropdownPosition();
	isOpen.value = true;
	highlightedIndex.value = -1;

	nextTick(() => {
		checkDropdownPosition();
	});
};

// Fechar dropdown
const close = (): void => {
	isOpen.value = false;
	highlightedIndex.value = -1;
};

// Selecionar opção
const selectOption = (option: ComboboxOption): void => {
	if (option.disabled) return;

	inputValue.value = option.label;
	emit("update:modelValue", option.value);
	emit("change", option.value, option);
	close();

	// Manter foco no input
	nextTick(() => {
		inputRef.value?.focus();
	});
};

// Limpar seleção
const clearSelection = (event?: Event): void => {
	if (event) {
		event.preventDefault();
		event.stopPropagation();
	}

	inputValue.value = "";
	emit("update:modelValue", ""); // Emitir string vazia ao invés de null
	emit("change", "", null); // Emitir string vazia ao invés de null

	// Focar no input após limpar
	nextTick(() => {
		inputRef.value?.focus();
	});
};

// ============================================
// EVENT HANDLERS
// ============================================

const handleInput = (event: Event): void => {
	const target = event.target as HTMLInputElement;
	inputValue.value = target.value;

	// Abrir dropdown ao digitar
	if (!isOpen.value && target.value.trim()) {
		open();
	}

	// Fechar se limpar o input
	if (!target.value.trim() && isOpen.value) {
		close();
	}
};

const handleFocus = (event: FocusEvent): void => {
	emit("focus", event);

	if (props.openOnFocus) {
		open();
	}
};

const handleBlur = (event: FocusEvent): void => {
	// Delay para permitir clique nas opções
	setTimeout(() => {
		const relatedTarget = event.relatedTarget as Node;
		const isClickInsideDropdown = dropdownRef.value?.contains(relatedTarget);

		if (!isClickInsideDropdown) {
			close();
			emit("blur", event);
		}
	}, 150);
};

const handleKeydown = (event: KeyboardEvent): void => {
	if (props.disabled) return;

	switch (event.key) {
		case "ArrowDown":
			event.preventDefault();
			if (!isOpen.value) {
				open();
			} else if (highlightedIndex.value < filteredOptions.value.length - 1) {
				highlightedIndex.value++;
			}
			break;

		case "ArrowUp":
			event.preventDefault();
			if (highlightedIndex.value > 0) {
				highlightedIndex.value--;
			}
			break;

		case "Enter":
			event.preventDefault();
			if (isOpen.value && highlightedIndex.value >= 0) {
				const option = filteredOptions.value[highlightedIndex.value];
				if (option && !option.disabled) {
					selectOption(option);
				}
			}
			break;

		case "Escape":
			if (isOpen.value) {
				event.preventDefault();
				close();
			}
			break;

		case "Tab":
			if (isOpen.value) {
				close();
			}
			break;
	}
};

// Handler para click outside
const handleClickOutside = (event: MouseEvent): void => {
	if (!isOpen.value) return;

	const target = event.target as Node;
	const isClickInsideCombobox = comboboxRef.value?.contains(target);
	const isClickInsideDropdown = dropdownRef.value?.contains(target);

	if (!isClickInsideCombobox && !isClickInsideDropdown) {
		close();
	}
};

// Handler para resize/scroll
const handleResize = (): void => {
	if (isOpen.value) {
		checkDropdownPosition();
	}
};

// ============================================
// LIFECYCLE HOOKS
// ============================================

onMounted(() => {
	document.addEventListener("click", handleClickOutside, true);
	window.addEventListener("resize", handleResize);
	window.addEventListener("scroll", handleResize, true);
});

onUnmounted(() => {
	document.removeEventListener("click", handleClickOutside, true);
	window.removeEventListener("resize", handleResize);
	window.removeEventListener("scroll", handleResize, true);
});

// ============================================
// MÉTODOS PÚBLICOS
// ============================================

const focus = (): void => {
	inputRef.value?.focus();
};

defineExpose({
	focus,
	open,
	close,
	isOpen: readonly(isOpen),
	inputRef,
});
</script>

<template>
	<div ref="comboboxRef" class="relative w-full">
		<!-- Container do input -->
		<div :class="containerClasses">
			<!-- Ícone à esquerda -->
			<div
				v-if="icon"
				class="flex items-center justify-center text-[var(--text-muted)] pointer-events-none mr-2"
			>
				<Icon :name="icon" class="w-5 h-5" />
			</div>

			<!-- Campo de input -->
			<input
				:id="comboboxId"
				ref="inputRef"
				type="text"
				:value="inputValue"
				:placeholder="placeholder"
				:disabled="disabled"
				:required="required"
				:class="inputClasses"
				role="combobox"
				:aria-expanded="isOpen"
				:aria-controls="`${comboboxId}-listbox`"
				:aria-activedescendant="
					highlightedIndex >= 0 ? `${comboboxId}-option-${highlightedIndex}` : undefined
				"
				autocomplete="off"
				@input="handleInput"
				@focus="handleFocus"
				@blur="handleBlur"
				@keydown="handleKeydown"
			/>

			<!-- Ícones à direita -->
			<div class="flex items-center gap-1 ml-2 flex-shrink-0">
				<!-- Loading -->
				<Icon
					v-if="loading"
					name="lucide:loader-2"
					class="w-4 h-4 text-[var(--text-muted)] animate-spin"
				/>

				<!-- Botão de limpar -->
				<button
					v-else-if="clearable && inputValue && !disabled"
					type="button"
					class="flex items-center justify-center p-1 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors duration-200 rounded hover:bg-[var(--bg-hover)] pointer-events-auto cursor-pointer z-10"
					tabindex="-1"
					aria-label="Limpar campo"
					@click.prevent.stop="clearSelection"
					@mousedown.prevent.stop
				>
					<Icon name="lucide:x" class="w-4 h-4 pointer-events-none" />
				</button>

				<!-- Seta do dropdown -->
				<Icon
					name="lucide:chevron-down"
					class="w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 pointer-events-none"
					:class="{ 'rotate-180': isOpen }"
				/>
			</div>
		</div>

		<!-- Mensagem de feedback -->
		<div v-if="feedbackMessage" class="mt-1.5">
			<span
				class="text-sm"
				:class="{
					'text-[var(--success)]': feedbackState === 'success',
					'text-[var(--warning)]': feedbackState === 'warning',
					'text-[var(--error)]': feedbackState === 'error' || error,
					'text-[var(--text-muted)]': !feedbackState && !error,
				}"
			>
				{{ feedbackMessage }}
			</span>
		</div>

		<!-- Dropdown Content - Teleport para body -->
		<Teleport to="body">
			<div
				v-if="isOpen"
				:id="`${comboboxId}-listbox`"
				ref="dropdownRef"
				:class="[dropdownClasses, 'combobox-dropdown', 'cardapio-theme-bridge']"
				:style="dropdownPositionStyle"
				class="fixed"
				role="listbox"
			>
				<!-- Loading state -->
				<div v-if="loading" class="flex items-center justify-center py-8 text-[var(--text-muted)]">
					<Icon name="lucide:loader-2" class="w-5 h-5 animate-spin mr-2" />
					Carregando...
				</div>

				<!-- Opções -->
				<template v-else-if="filteredOptions.length > 0">
					<div
						v-for="(option, index) in filteredOptions"
						:id="`${comboboxId}-option-${index}`"
						:key="option.value"
						class="flex items-center justify-between px-3 py-2 cursor-pointer transition-colors duration-150 rounded-md mx-1 my-0.5"
						:class="{
							'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]':
								!option.disabled && index !== highlightedIndex,
							'text-[var(--text-primary)] bg-[var(--bg-hover)]': index === highlightedIndex,
							'text-[var(--text-muted)] cursor-not-allowed opacity-50': option.disabled,
						}"
						role="option"
						:aria-selected="matchedOption?.value === option.value"
						@click="selectOption(option)"
						@mouseenter="highlightedIndex = index"
					>
						<!-- Conteúdo da opção -->
						<div class="flex items-center gap-2 flex-1 min-w-0">
							<!-- Ícone da opção -->
							<Icon v-if="option.icon" :name="option.icon" class="w-4 h-4 flex-shrink-0" />

							<!-- Label e descrição -->
							<div class="flex-1 min-w-0">
								<div class="text-sm font-medium truncate">{{ option.label }}</div>
								<div v-if="option.description" class="text-xs text-[var(--text-muted)] truncate">
									{{ option.description }}
								</div>
							</div>
						</div>

						<!-- Badge (ex: taxa) -->
						<div v-if="option.badge" class="ml-2 flex-shrink-0">
							<span
								class="text-xs font-medium px-2 py-0.5 rounded-md bg-[var(--primary-light)] text-[var(--primary)]"
							>
								{{ option.badge }}
							</span>
						</div>

						<!-- Ícone de selecionado -->
						<Icon
							v-if="matchedOption?.value === option.value"
							name="lucide:check"
							class="w-4 h-4 ml-2 text-[var(--primary)] flex-shrink-0"
						/>
					</div>
				</template>

				<!-- Estado sem resultados -->
				<div
					v-else-if="inputValue.trim()"
					class="px-3 py-8 text-sm text-[var(--text-muted)] text-center"
				>
					<Icon name="lucide:search-x" class="w-8 h-8 mx-auto mb-2 opacity-50" />
					{{ noResultsText }}
				</div>

				<!-- Estado vazio -->
				<div v-else class="px-3 py-8 text-sm text-[var(--text-muted)] text-center">
					<Icon name="lucide:inbox" class="w-8 h-8 mx-auto mb-2 opacity-50" />
					{{ emptyText }}
				</div>
			</div>
		</Teleport>
	</div>
</template>

<style scoped>
/* CSS necessário para funcionalidade específica que não pode ser feita apenas com Tailwind */

/* Garantir que o dropdown tenha z-index correto */
.combobox-dropdown {
	z-index: 9999;
}

/* Scroll suave no dropdown */
.combobox-dropdown {
	scroll-behavior: smooth;
}

/* Highlight da opção selecionada via teclado */
.combobox-dropdown [role="option"][aria-selected="true"] {
	font-weight: 500;
}
</style>
