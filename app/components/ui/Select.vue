<script setup lang="ts">
/**
 * 📌 Select Component
 *
 * Componente de select simples e reutilizável com opções estáticas.
 * Suporta diferentes tamanhos, estados e validação.
 * Segue o design system definido no main.css.
 */

// Removido import do VueUse - implementação manual

// Tipos para as opções do select
interface SelectOption {
	label: string;
	value: string | number;
	disabled?: boolean;
}

// Tipos para as props do componente
interface Props {
	/** Valor selecionado (v-model) */
	modelValue?: string | number | null;
	/** Opções do select */
	options: SelectOption[];
	/** Label do campo */
	label?: string;
	/** Placeholder quando nenhuma opção está selecionada */
	placeholder?: string;
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
	/** Permitir limpar seleção */
	clearable?: boolean;
}

// Props com valores padrão
const props = withDefaults(defineProps<Props>(), {
	modelValue: null,
	label: undefined,
	placeholder: "Selecione uma opção",
	helpText: undefined,
	errorMessage: undefined,
	size: "md",
	disabled: false,
	required: false,
	id: undefined,
	clearable: false,
});

// Emits tipados
interface Emits {
	"update:modelValue": [value: string | number | null];
	change: [value: string | number | null, option: SelectOption | null];
	focus: [event: FocusEvent];
	blur: [event: FocusEvent];
}

const emit = defineEmits<Emits>();

// Estados reativos
const isOpen = ref(false);
const selectRef = ref<HTMLElement>();
const shouldOpenUpward = ref(false);

// Detectar se deve abrir para cima
const checkDropdownPosition = (): void => {
	if (!selectRef.value) return;

	const rect = selectRef.value.getBoundingClientRect();
	const viewportHeight = window.innerHeight;
	const dropdownHeight = 240; // Altura aproximada do dropdown (max-h-60 = 240px)
	const spaceBelow = viewportHeight - rect.bottom;
	const spaceAbove = rect.top;

	// Abrir para cima se não há espaço suficiente embaixo E há espaço suficiente em cima
	shouldOpenUpward.value = spaceBelow < dropdownHeight && spaceAbove > dropdownHeight;
};

// Gerar ID único usando useId() do Nuxt
const generatedSelectId = useId();

// ID único para o select
const selectId = computed(() => props.id || generatedSelectId);

// Opção selecionada atual
const selectedOption = computed(() => {
	if (props.modelValue === null || props.modelValue === undefined) return null;
	return props.options.find((option) => option.value === props.modelValue) || null;
});

// Texto a ser exibido no select
const displayText = computed(() => {
	if (selectedOption.value) {
		return selectedOption.value.label;
	}
	return props.placeholder;
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
		"max-h-60 overflow-y-auto",
		"transition-all duration-200",
		"z-[9999]",
	];

	const animationClasses = "opacity-100 scale-100";

	return [...baseClasses, animationClasses].join(" ");
});

// Funções de controle
const open = (): void => {
	if (props.disabled) return;
	checkDropdownPosition();
	isOpen.value = true;
};

const close = (): void => {
	isOpen.value = false;
};

const toggle = (): void => {
	if (isOpen.value) {
		close();
	} else {
		open();
	}
};

// Seleção de opção
const selectOption = (option: SelectOption): void => {
	if (option.disabled) return;

	emit("update:modelValue", option.value);
	emit("change", option.value, option);
	close();
};

// Limpar seleção
const clearSelection = (event: Event): void => {
	event.stopPropagation();
	emit("update:modelValue", null);
	emit("change", null, null);
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
			event.preventDefault();
			toggle();
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

// Implementação manual do click outside
const handleClickOutside = (event: Event): void => {
	if (!selectRef.value) return;

	const target = event.target as Node;
	if (!selectRef.value.contains(target) && isOpen.value) {
		close();
	}
};

// Atualizar posição ao redimensionar
const handleResize = (): void => {
	if (isOpen.value) {
		checkDropdownPosition();
	}
};

// Adicionar listeners
onMounted(() => {
	document.addEventListener("click", handleClickOutside);
	window.addEventListener("resize", handleResize);
	window.addEventListener("scroll", handleResize, true);
});

// Cleanup
onUnmounted(() => {
	document.removeEventListener("click", handleClickOutside);
	window.removeEventListener("resize", handleResize);
	window.removeEventListener("scroll", handleResize, true);
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
				<!-- Texto selecionado -->
				<span
					class="flex-1 truncate"
					:class="{
						'text-[var(--input-text)]': selectedOption,
						'text-[var(--input-placeholder)]': !selectedOption,
					}"
				>
					{{ displayText }}
				</span>

				<!-- Ícones à direita -->
				<div class="flex items-center gap-1 ml-2">
					<!-- Botão de limpar -->
					<button
						v-if="clearable && selectedOption && !disabled"
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

			<!-- Dropdown Options -->
			<div
				v-if="isOpen"
				:class="[dropdownClasses, shouldOpenUpward ? 'bottom-full mb-1' : 'top-full mt-1']"
				class="absolute left-0 right-0 z-[9999]"
			>
				<div
					v-for="option in options"
					:key="option.value"
					class="flex items-center p-1 m-1 text-sm cursor-pointer transition-colors duration-150 rounded-md"
					:class="{
						'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]':
							!option.disabled && option.value !== modelValue,
						'text-[var(--primary)] bg-[var(--primary-light)]': option.value === modelValue,
						'text-[var(--text-muted)] cursor-not-allowed opacity-50': option.disabled,
					}"
					@click="selectOption(option)"
				>
					{{ option.label }}

					<!-- Ícone de selecionado -->
					<Icon
						v-if="option.value === modelValue"
						name="lucide:check"
						class="w-4 h-4 ml-auto text-[var(--primary)]"
					/>
				</div>

				<!-- Estado vazio -->
				<div
					v-if="options.length === 0"
					class="px-3 py-2 text-sm text-[var(--text-muted)] text-center"
				>
					Nenhuma opção disponível
				</div>
			</div>
		</div>

		<!-- Mensagem de ajuda ou erro -->
		<div v-if="helpText || errorMessage" class="mt-1.5">
			<span v-if="errorMessage" class="text-sm text-[var(--error)]">{{ errorMessage }}</span>
			<span v-else-if="helpText" class="text-sm text-[var(--text-muted)]">{{ helpText }}</span>
		</div>
	</div>
</template>

<style scoped>
/* CSS necessário para funcionalidade específica que não pode ser feita apenas com Tailwind */
</style>
