<script setup lang="ts">
/**
 * 📌 ColorPicker
 *
 * Componente de seleção de cor moderno e intuitivo.
 * Combina preview visual, input de texto e color picker nativo.
 */

interface Props {
	modelValue: string;
	label?: string;
	placeholder?: string;
	disabled?: boolean;
}

interface Emits {
	"update:modelValue": [value: string];
}

const props = withDefaults(defineProps<Props>(), {
	label: "",
	placeholder: "#000000",
	disabled: false,
});

const emit = defineEmits<Emits>();

// ========================================
// ESTADO LOCAL
// ========================================

const inputValue = ref(props.modelValue || "#000000");
const colorInputRef = ref<HTMLInputElement | null>(null);

// ========================================
// COMPUTADAS
// ========================================

/**
 * Valor da cor sincronizado com o modelo
 */
const colorValue = computed({
	get: () => props.modelValue || "#000000",
	set: (value: string) => {
		inputValue.value = value;
		emit("update:modelValue", value);
	},
});

/**
 * Valida se o hex é válido
 */
const isValidHex = computed(() => {
	return /^#[0-9A-Fa-f]{6}$/.test(inputValue.value);
});

/**
 * Nome da cor em português (aproximado)
 */
const colorName = computed(() => {
	const hex = colorValue.value.toLowerCase();

	// Cores básicas
	const colorNames: Record<string, string> = {
		"#000000": "Preto",
		"#ffffff": "Branco",
		"#ff0000": "Vermelho",
		"#00ff00": "Verde",
		"#0000ff": "Azul",
		"#ffff00": "Amarelo",
		"#ff00ff": "Magenta",
		"#00ffff": "Ciano",
		"#808080": "Cinza",
		"#ffa500": "Laranja",
		"#800080": "Roxo",
		"#ffc0cb": "Rosa",
		"#a52a2a": "Marrom",
	};

	return colorNames[hex] || "Personalizado";
});

// ========================================
// MÉTODOS
// ========================================

/**
 * Abre o color picker nativo
 */
const openColorPicker = (): void => {
	if (!props.disabled && colorInputRef.value) {
		colorInputRef.value.click();
	}
};

/**
 * Handler para mudança no input de texto
 */
const handleTextInput = (event: Event): void => {
	const target = event.target as HTMLInputElement;
	let value = target.value.trim();

	// Adiciona # se não tiver
	if (value && !value.startsWith("#")) {
		value = `#${value}`;
	}

	inputValue.value = value;

	// Só emite se for válido
	if (isValidHex.value) {
		emit("update:modelValue", value);
	}
};

/**
 * Handler para mudança no color picker nativo
 */
const handleColorChange = (event: Event): void => {
	const target = event.target as HTMLInputElement;
	colorValue.value = target.value;
};

// ========================================
// WATCHERS
// ========================================

/**
 * Sincroniza input quando o modelo muda externamente
 */
watch(
	() => props.modelValue,
	(newValue) => {
		if (newValue && newValue !== inputValue.value) {
			inputValue.value = newValue;
		}
	},
);
</script>

<template>
	<div class="space-y-2">
		<!-- Label -->
		<label v-if="label" class="block text-sm font-medium text-[var(--text-primary)]">
			{{ label }}
		</label>

		<!-- Color Picker Container -->
		<div
			class="relative flex items-center gap-3 p-3 border border-[var(--border-default)] rounded-lg bg-[var(--input-bg)] transition-all duration-200"
			:class="{
				'opacity-50 cursor-not-allowed': disabled,
				'hover:border-[var(--primary)] focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/20':
					!disabled,
				'border-[var(--error)]': !isValidHex && inputValue.length > 0,
			}"
		>
			<!-- Color Preview (Clicável) -->
			<button
				type="button"
				class="relative w-12 h-12 rounded-lg border-2 border-[var(--border-default)] overflow-hidden transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] shrink-0"
				:style="{ backgroundColor: isValidHex ? colorValue : '#cccccc' }"
				:disabled="disabled"
				@click="openColorPicker"
			>
				<!-- Ícone de pipeta -->
				<div
					class="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/10 transition-colors duration-200"
				>
					<Icon
						name="lucide:pipette"
						class="w-5 h-5 text-white drop-shadow-md opacity-0 hover:opacity-100 transition-opacity duration-200"
					/>
				</div>
			</button>

			<!-- Input de Texto -->
			<div class="flex-1 space-y-1">
				<input
					v-model="inputValue"
					type="text"
					:placeholder="placeholder"
					:disabled="disabled"
					class="w-full bg-transparent text-[var(--text-primary)] font-mono text-sm focus:outline-none placeholder:text-[var(--text-muted)]"
					maxlength="7"
					@input="handleTextInput"
				/>

				<!-- Nome da Cor -->
				<div class="flex items-center gap-2 text-xs text-[var(--text-muted)]">
					<span>{{ colorName }}</span>
					<span v-if="!isValidHex && inputValue.length > 0" class="text-[var(--error)]">
						• Formato inválido
					</span>
				</div>
			</div>

			<!-- Color Input Nativo (Oculto) -->
			<input
				ref="colorInputRef"
				type="color"
				:value="colorValue"
				:disabled="disabled"
				class="sr-only"
				@input="handleColorChange"
			/>

			<!-- Indicador de Status -->
			<div class="shrink-0">
				<div
					v-if="isValidHex"
					class="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse"
					title="Cor válida"
				></div>
				<div
					v-else-if="inputValue.length > 0"
					class="w-2 h-2 rounded-full bg-[var(--error)]"
					title="Formato inválido"
				></div>
			</div>
		</div>
	</div>
</template>
