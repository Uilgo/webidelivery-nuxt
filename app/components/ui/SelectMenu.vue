<script setup lang="ts">
/**
 * 📌 SelectMenu Component
 *
 * Componente de select avançado com busca, múltipla seleção e opções dinâmicas.
 * Inclui input de busca, loading states e funcionalidades avançadas.
 * Segue o design system definido no main.css.
 */

// Tipos para as opções do select
interface SelectMenuOption {
	label: string;
	value: string | number;
	disabled?: boolean;
	description?: string;
	icon?: string;
}

// Tipos para as props do componente
interface Props {
	/** Valor selecionado (v-model) */
	modelValue?: string | number | (string | number)[] | null;
	/** Opções do select */
	options: SelectMenuOption[];
	/** Label do campo */
	label?: string;
	/** Placeholder quando nenhuma opção está selecionada */
	placeholder?: string;
	/** Placeholder do input de busca */
	searchPlaceholder?: string;
	/** Texto de ajuda */
	helpText?: string;
	/** Mensagem de erro */
	errorMessage?: string;
	/** Tamanho do select */
	size?: "sm" | "md" | "lg";
	/** Estado desabilitado */
	disabled?: boolean;
	/** Campo obrigatório */
	required?: boolean;
	/** ID customizado para o select */
	id?: string;
	/** Permitir múltipla seleção */
	multiple?: boolean;
	/** Permitir busca */
	searchable?: boolean;
	/** Permitir limpar seleção */
	clearable?: boolean;
	/** Estado de loading */
	loading?: boolean;
	/** Texto quando não há opções */
	emptyText?: string;
	/** Texto quando não há resultados na busca */
	noResultsText?: string;
	/** Máximo de itens selecionados (apenas para multiple) */
	maxSelections?: number;
}

// Props com valores padrão
const props = withDefaults(defineProps<Props>(), {
	modelValue: null,
	label: undefined,
	placeholder: "Selecione uma opção",
	searchPlaceholder: "Buscar...",
	helpText: undefined,
	errorMessage: undefined,
	size: "md",
	disabled: false,
	required: false,
	id: undefined,
	multiple: false,
	searchable: true,
	clearable: false,
	loading: false,
	emptyText: "Nenhuma opção disponível",
	noResultsText: "Nenhum resultado encontrado",
	maxSelections: undefined,
});

// Emits tipados
interface Emits {
	"update:modelValue": [value: string | number | (string | number)[] | null];
	change: [
		value: string | number | (string | number)[] | null,
		option: SelectMenuOption | SelectMenuOption[] | null,
	];
	search: [query: string];
	focus: [event: FocusEvent];
	blur: [event: FocusEvent];
}

const emit = defineEmits<Emits>();

// Estados reativos
const isOpen = ref(false);
const searchQuery = ref("");
const selectRef = ref<HTMLElement>();
const searchInputRef = ref<HTMLInputElement>();
const shouldOpenUpward = ref(false);
const dropdownPosition = ref({ top: 0, left: 0, width: 0 });

// Detectar se deve abrir para cima e calcular posição
const checkDropdownPosition = (): void => {
	if (!selectRef.value) return;

	const rect = selectRef.value.getBoundingClientRect();
	const viewportHeight = window.innerHeight;
	const dropdownHeight = 320; // Altura aproximada do dropdown (max-h-80 = 320px)
	const spaceBelow = viewportHeight - rect.bottom;
	const spaceAbove = rect.top;

	// Abrir para cima se não há espaço suficiente embaixo E há espaço suficiente em cima
	shouldOpenUpward.value = spaceBelow < dropdownHeight && spaceAbove > dropdownHeight;

	// Calcular posição fixa para o dropdown (com margem)
	dropdownPosition.value = {
		top: shouldOpenUpward.value ? rect.top - 4 : rect.bottom + 4,
		left: rect.left,
		width: rect.width,
	};
};

// Estilo computado para posicionamento do dropdown
const dropdownPositionStyle = computed(() => {
	// Pegar CSS variables do root para aplicar no dropdown (que está no body via Teleport)
	const rootStyles = getComputedStyle(document.documentElement);

	return {
		top: `${dropdownPosition.value.top}px`,
		left: `${dropdownPosition.value.left}px`,
		width: `${dropdownPosition.value.width}px`,
		"--card-bg": rootStyles.getPropertyValue("--card-bg"),
		"--text-primary": rootStyles.getPropertyValue("--text-primary"),
		"--text-secondary": rootStyles.getPropertyValue("--text-secondary"),
		"--text-muted": rootStyles.getPropertyValue("--text-muted"),
		"--border-default": rootStyles.getPropertyValue("--border-default"),
		"--border-muted": rootStyles.getPropertyValue("--border-muted"),
		"--bg-hover": rootStyles.getPropertyValue("--bg-hover"),
		"--primary": rootStyles.getPropertyValue("--primary"),
		"--primary-light": rootStyles.getPropertyValue("--primary-light"),
		"--input-bg": rootStyles.getPropertyValue("--input-bg"),
		"--input-border": rootStyles.getPropertyValue("--input-border"),
		"--input-border-focus": rootStyles.getPropertyValue("--input-border-focus"),
		"--input-text": rootStyles.getPropertyValue("--input-text"),
		"--input-placeholder": rootStyles.getPropertyValue("--input-placeholder"),
	};
});

// Gerar ID único usando useId() do Nuxt
const generatedSelectId = useId();

// ID único para o select
const selectId = computed(() => props.id || generatedSelectId);

// Normalizar valor para array (para facilitar lógica)
const normalizedValue = computed(() => {
	if (props.modelValue === null || props.modelValue === undefined) return [];
	return Array.isArray(props.modelValue) ? props.modelValue : [props.modelValue];
});

// Opções selecionadas
const selectedOptions = computed(() => {
	return props.options.filter((option) => normalizedValue.value.includes(option.value));
});

// Opções filtradas pela busca
const filteredOptions = computed(() => {
	if (!props.searchable || !searchQuery.value.trim()) {
		return props.options;
	}

	const query = searchQuery.value.toLowerCase().trim();
	return props.options.filter(
		(option) =>
			option.label.toLowerCase().includes(query) ||
			option.description?.toLowerCase().includes(query),
	);
});

// Texto a ser exibido no select
const displayText = computed(() => {
	if (selectedOptions.value.length === 0) {
		return props.placeholder;
	}

	if (props.multiple) {
		if (selectedOptions.value.length === 1) {
			return selectedOptions.value[0]?.label ?? props.placeholder;
		}
		return `${selectedOptions.value.length} itens selecionados`;
	}

	return selectedOptions.value[0]?.label ?? props.placeholder;
});

// Verificar se pode selecionar mais itens
const canSelectMore = computed(() => {
	if (!props.multiple) return true;
	if (!props.maxSelections) return true;
	return selectedOptions.value.length < props.maxSelections;
});

// Classes do container principal
const containerClasses = computed(() => {
	const baseClasses = [
		"relative",
		"flex items-center",
		"bg-[var(--input-bg)]",
		"border border-[var(--input-border)]",
		"rounded-lg",
		"transition-all duration-200",
		"cursor-pointer",
	];

	// Classes de tamanho
	const sizeClasses = {
		sm: "min-h-[32px] px-3 text-sm",
		md: "min-h-[40px] px-3 text-base",
		lg: "min-h-[48px] px-4 text-lg",
	};

	// Classes de estado
	const stateClasses = [];
	if (props.errorMessage) {
		stateClasses.push("border-[var(--error)]");
	} else if (isOpen.value) {
		stateClasses.push(
			"border-[var(--input-border-focus)]",
			"ring-2",
			"ring-[var(--input-border-focus)]",
			"ring-opacity-20",
		);
	} else {
		stateClasses.push("hover:border-[var(--border-strong)]");
	}

	if (props.disabled) {
		stateClasses.push("opacity-50", "cursor-not-allowed");
	}

	return [...baseClasses, sizeClasses[props.size], ...stateClasses].join(" ");
});

// Classes do dropdown
const dropdownClasses = computed(() => {
	const baseClasses = [
		"bg-[var(--card-bg)]",
		"border border-[var(--border-default)]",
		"rounded-lg",
		"shadow-xl",
		"transition-all duration-200",
		"z-[9999]",
	];

	return baseClasses.join(" ");
});

// Funções de controle
const open = (): void => {
	if (props.disabled) return;
	checkDropdownPosition();
	isOpen.value = true;

	// Atualizar posição ao abrir
	nextTick(() => {
		checkDropdownPosition();
		if (props.searchable && searchInputRef.value) {
			searchInputRef.value.focus();
		}
	});
};

const close = (): void => {
	isOpen.value = false;
	searchQuery.value = "";
};

const toggle = (): void => {
	if (isOpen.value) {
		close();
	} else {
		open();
	}
};

// Seleção de opção
const selectOption = (option: SelectMenuOption): void => {
	if (option.disabled) return;

	let newValue: string | number | (string | number)[] | null;

	if (props.multiple) {
		const currentValues = [...normalizedValue.value];
		const index = currentValues.indexOf(option.value);

		if (index > -1) {
			// Remover se já está selecionado
			currentValues.splice(index, 1);
		} else if (canSelectMore.value) {
			// Adicionar se não está selecionado e pode selecionar mais
			currentValues.push(option.value);
		}

		newValue = currentValues.length > 0 ? currentValues : null;
		const selectedOpts = props.options.filter((opt) => currentValues.includes(opt.value));
		emit("change", newValue, selectedOpts);
	} else {
		newValue = option.value;
		emit("change", newValue, option);
		close();
	}

	emit("update:modelValue", newValue);
};

// Limpar seleção
const clearSelection = (event: Event): void => {
	event.stopPropagation();
	const newValue = props.multiple ? null : null;
	emit("update:modelValue", newValue);
	emit("change", newValue, null);
};

// Remover item específico (apenas para multiple)
const removeOption = (option: SelectMenuOption, event: Event): void => {
	event.stopPropagation();
	if (!props.multiple) return;

	const currentValues = normalizedValue.value.filter((value) => value !== option.value);
	const newValue = currentValues.length > 0 ? currentValues : null;
	const selectedOpts = props.options.filter((opt) => currentValues.includes(opt.value));

	emit("update:modelValue", newValue);
	emit("change", newValue, selectedOpts);
};

// Busca
const handleSearch = (event: Event): void => {
	const target = event.target as HTMLInputElement;
	searchQuery.value = target.value;
	emit("search", target.value);
};

// Manipulação de eventos
const handleFocus = (event: FocusEvent): void => {
	emit("focus", event);
};

const handleBlur = (event: FocusEvent): void => {
	emit("blur", event);
};

const handleKeydown = (event: KeyboardEvent): void => {
	if (props.disabled) return;

	switch (event.key) {
		case "Enter":
		case " ":
			if (!isOpen.value) {
				event.preventDefault();
				toggle();
			}
			break;
		case "Escape":
			if (isOpen.value) {
				event.preventDefault();
				close();
			}
			break;
		case "ArrowDown":
			event.preventDefault();
			if (!isOpen.value) {
				open();
			}
			break;
		case "ArrowUp":
			event.preventDefault();
			if (!isOpen.value) {
				open();
			}
			break;
	}
};

// Handler para click outside
const handleClickOutside = (event: MouseEvent): void => {
	if (!isOpen.value) return;

	const target = event.target as Node;
	const isClickInsideSelect = selectRef.value?.contains(target);

	// Verificar se o clique foi dentro do dropdown (que pode estar fora do selectRef devido ao z-index)
	const dropdownElement = selectRef.value?.querySelector('[role="listbox"]');
	const isClickInsideDropdown = dropdownElement?.contains(target);

	if (!isClickInsideSelect && !isClickInsideDropdown) {
		close();
	}
};

// Lifecycle hooks
onMounted(() => {
	document.addEventListener("click", handleClickOutside, true);
});

// Atualizar posição ao redimensionar
const handleResize = (): void => {
	if (isOpen.value) {
		checkDropdownPosition();
	}
};

// Adicionar listener de resize
onMounted(() => {
	window.addEventListener("resize", handleResize);
	window.addEventListener("scroll", handleResize, true);
});

// Cleanup
onUnmounted(() => {
	document.removeEventListener("click", handleClickOutside, true);
	window.removeEventListener("resize", handleResize);
	window.removeEventListener("scroll", handleResize, true);
});

// Expor métodos públicos
defineExpose({
	open,
	close,
	toggle,
	isOpen: readonly(isOpen),
	clearSearch: () => {
		searchQuery.value = "";
	},
});
</script>

<template>
	<div :class="['w-full', { 'opacity-75': disabled }]">
		<!-- Label -->
		<label
			v-if="label"
			:for="selectId"
			class="block text-sm font-medium text-[var(--text-primary)] mb-1.5"
		>
			{{ label }}
			<span v-if="required" class="text-[var(--error)] ml-1">*</span>
		</label>

		<!-- Select Container -->
		<div class="relative">
			<div
				:id="selectId"
				ref="selectRef"
				:class="containerClasses"
				tabindex="0"
				role="combobox"
				:aria-expanded="isOpen"
				:aria-haspopup="true"
				:aria-disabled="disabled"
				@click="toggle"
				@focus="handleFocus"
				@blur="handleBlur"
				@keydown="handleKeydown"
			>
				<!-- Conteúdo selecionado -->
				<div class="flex-1 flex items-center gap-1 min-w-0">
					<!-- Tags para múltipla seleção -->
					<template v-if="multiple && selectedOptions.length > 0">
						<div
							v-for="option in selectedOptions.slice(0, 3)"
							:key="option.value"
							class="inline-flex items-center gap-1 px-2 py-1 text-xs bg-[var(--primary-light)] text-[var(--primary)] rounded-md"
						>
							<Icon v-if="option.icon" :name="option.icon" class="w-3 h-3" />
							<span class="truncate max-w-[100px]">{{ option.label }}</span>
							<button
								type="button"
								class="flex items-center justify-center hover:bg-[var(--primary)] hover:text-white rounded-full transition-colors duration-150"
								@click="removeOption(option, $event)"
							>
								<Icon name="lucide:x" class="w-3 h-3" />
							</button>
						</div>

						<!-- Indicador de mais itens -->
						<span
							v-if="selectedOptions.length > 3"
							class="text-xs text-[var(--text-muted)] px-2 py-1 bg-[var(--bg-muted)] rounded-md"
						>
							+{{ selectedOptions.length - 3 }}
						</span>
					</template>

					<!-- Texto para seleção única ou placeholder -->
					<span
						v-else
						class="truncate"
						:class="{
							'text-[var(--input-text)]': selectedOptions.length > 0,
							'text-[var(--input-placeholder)]': selectedOptions.length === 0,
						}"
					>
						{{ displayText }}
					</span>
				</div>

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
						v-else-if="clearable && selectedOptions.length > 0 && !disabled"
						type="button"
						class="flex items-center justify-center p-1 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors duration-200 rounded"
						@click="clearSelection"
					>
						<Icon name="lucide:x" class="w-4 h-4" />
					</button>

					<!-- Seta do dropdown -->
					<Icon
						name="lucide:chevron-down"
						class="w-4 h-4 text-[var(--text-muted)] transition-transform duration-200"
						:class="{ 'rotate-180': isOpen }"
					/>
				</div>
			</div>

			<!-- Dropdown Content - Teleport para body para evitar overflow -->
			<Teleport to="body">
				<div
					v-if="isOpen"
					:class="[dropdownClasses, 'select-menu-dropdown']"
					:style="dropdownPositionStyle"
					class="fixed z-[9999]"
				>
					<!-- Input de busca -->
					<div
						v-if="searchable"
						class="p-2 border-b border-[var(--border-muted)] bg-[var(--card-bg)]"
					>
						<div class="relative">
							<Icon
								name="lucide:search"
								class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]"
							/>
							<input
								ref="searchInputRef"
								v-model="searchQuery"
								type="text"
								:placeholder="searchPlaceholder"
								class="w-full pl-9 pr-3 py-2 text-sm text-[var(--input-text)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md focus:border-[var(--input-border-focus)] focus:ring-2 focus:ring-[var(--input-border-focus)] focus:ring-opacity-20 outline-none transition-all duration-200 placeholder-[var(--input-placeholder)]"
								@input="handleSearch"
								@click.stop
							/>
						</div>
					</div>

					<!-- Lista de opções -->
					<div class="max-h-60 overflow-y-auto py-2 bg-[var(--card-bg)]">
						<!-- Loading state -->
						<div
							v-if="loading"
							class="flex items-center justify-center py-8 text-[var(--text-muted)]"
						>
							<Icon name="lucide:loader-2" class="w-5 h-5 animate-spin mr-2" />
							Carregando...
						</div>

						<!-- Opções -->
						<template v-else-if="filteredOptions.length > 0">
							<div
								v-for="option in filteredOptions"
								:key="option.value"
								class="flex items-center px-3 py-2 cursor-pointer transition-colors duration-150 rounded-md mx-1 my-1"
								:class="{
									'text-[var(--text-primary)] bg-transparent hover:bg-[var(--bg-hover)]':
										!option.disabled && !normalizedValue.includes(option.value),
									'text-[var(--primary)] bg-[var(--primary-light)]': normalizedValue.includes(
										option.value,
									),
									'text-[var(--text-muted)] cursor-not-allowed opacity-50 bg-transparent':
										option.disabled,
									'cursor-not-allowed opacity-50 bg-transparent':
										!canSelectMore && !normalizedValue.includes(option.value) && multiple,
								}"
								@click="selectOption(option)"
							>
								<!-- Ícone da opção -->
								<Icon v-if="option.icon" :name="option.icon" class="w-4 h-4 mr-2 flex-shrink-0" />

								<!-- Conteúdo da opção -->
								<div class="flex-1 min-w-0">
									<div class="text-sm font-medium truncate">{{ option.label }}</div>
									<div v-if="option.description" class="text-xs text-[var(--text-muted)] truncate">
										{{ option.description }}
									</div>
								</div>

								<!-- Checkbox para múltipla seleção -->
								<div v-if="multiple" class="ml-2 flex-shrink-0">
									<div
										class="w-4 h-4 border-2 rounded flex items-center justify-center transition-colors duration-150"
										:class="{
											'border-[var(--primary)] bg-[var(--primary)]': normalizedValue.includes(
												option.value,
											),
											'border-[var(--border-default)]': !normalizedValue.includes(option.value),
										}"
									>
										<Icon
											v-if="normalizedValue.includes(option.value)"
											name="lucide:check"
											class="w-3 h-3 text-white"
										/>
									</div>
								</div>

								<!-- Ícone de selecionado para seleção única -->
								<Icon
									v-else-if="normalizedValue.includes(option.value)"
									name="lucide:check"
									class="w-4 h-4 ml-2 text-[var(--primary)] flex-shrink-0"
								/>
							</div>
						</template>

						<!-- Estado sem resultados -->
						<div
							v-else-if="searchQuery.trim()"
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
				</div>
			</Teleport>

			<!-- Mensagem de ajuda ou erro -->
			<div v-if="helpText || errorMessage" class="mt-1.5">
				<span v-if="errorMessage" class="text-sm text-[var(--error)]">{{ errorMessage }}</span>
				<span v-else-if="helpText" class="text-sm text-[var(--text-muted)]">{{ helpText }}</span>
			</div>
		</div>
	</div>
</template>

<style scoped>
/* CSS necessário para funcionalidade específica que não pode ser feita apenas com Tailwind */
</style>
