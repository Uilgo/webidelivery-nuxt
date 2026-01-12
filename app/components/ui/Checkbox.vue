<script setup lang="ts">
/**
 * 📌 Checkbox Component
 *
 * Componente de checkbox reutilizável com suporte a estados indeterminados,
 * diferentes cores e tamanhos. Funciona tanto para valores boolean quanto arrays.
 * Segue o design system definido no main.css.
 */

import { computed } from "vue";

// Tipos para as props do componente
interface Props {
	/** Valor do checkbox (v-model) - pode ser boolean ou array */
	modelValue?: boolean | unknown[];
	/** Valor específico quando usado em modo array */
	value?: unknown;
	/** Label do checkbox */
	label?: string;
	/** Texto de ajuda */
	help?: string;
	/** Tamanho do checkbox */
	size?: "sm" | "md" | "lg";
	/** Cor do checkbox quando ativo */
	color?: "primary" | "success" | "warning" | "error";
	/** Estado desabilitado */
	disabled?: boolean;
	/** Campo obrigatório */
	required?: boolean;
	/** Estado indeterminado */
	indeterminate?: boolean;
}

// Props com valores padrão
const props = withDefaults(defineProps<Props>(), {
	modelValue: false,
	value: undefined,
	label: undefined,
	help: undefined,
	size: "md",
	color: "primary",
	disabled: false,
	required: false,
	indeterminate: false,
});

// Emits tipados
interface Emits {
	"update:modelValue": [value: boolean | unknown[]];
	change: [checked: boolean, value?: unknown];
}

const emit = defineEmits<Emits>();

// IDs únicos para acessibilidade
const checkboxId = useId();
const helpId = useId();

// Computada para determinar se está marcado
const isChecked = computed(() => {
	if (Array.isArray(props.modelValue)) {
		return props.value !== undefined && props.modelValue.includes(props.value);
	}
	return Boolean(props.modelValue);
});

// Classes computadas para o checkbox
const checkboxClasses = computed(() => {
	const baseClasses = [
		"peer sr-only", // Esconder o input nativo, mas manter acessibilidade
	];

	return baseClasses.join(" ");
});

// Classes computadas para o container do ícone
const iconContainerClasses = computed(() => {
	const baseClasses = [
		"flex items-center justify-center",
		"border-2",
		"rounded",
		"transition-all duration-200",
		"cursor-pointer",
	];

	// Classes de tamanho
	const sizeClasses = {
		sm: "w-4 h-4",
		md: "w-5 h-5",
		lg: "w-6 h-6",
	};

	// Classes de cor baseadas no estado
	let colorClasses: string[] = [];
	if (isChecked.value || props.indeterminate) {
		const activeColors = {
			primary: ["bg-[var(--primary)]", "border-[var(--primary)]"],
			success: ["bg-[var(--success)]", "border-[var(--success)]"],
			warning: ["bg-[var(--warning)]", "border-[var(--warning)]"],
			error: ["bg-[var(--error)]", "border-[var(--error)]"],
		};
		colorClasses = activeColors[props.color];
	} else {
		colorClasses = [
			"bg-[var(--input-bg)]",
			"border-[var(--input-border)]",
			"hover:border-[var(--input-border-focus)]",
		];
	}

	// Classes de estado
	const stateClasses = [];
	if (props.disabled) {
		stateClasses.push("opacity-50", "cursor-not-allowed");
	}

	return [...baseClasses, sizeClasses[props.size], ...colorClasses, ...stateClasses].join(" ");
});

// Classes computadas para o ícone
const iconClasses = computed(() => {
	const baseClasses = ["text-white"];

	// Classes de tamanho
	const sizeClasses = {
		sm: "w-3 h-3",
		md: "w-4 h-4",
		lg: "w-5 h-5",
	};

	return [...baseClasses, sizeClasses[props.size]].join(" ");
});

// Classes computadas para o label
const labelClasses = computed(() => {
	const baseClasses = ["text-sm font-medium cursor-pointer select-none"];
	const colorClasses = props.disabled ? "text-[var(--text-muted)]" : "text-[var(--text-primary)]";

	return [...baseClasses, colorClasses].join(" ");
});

// Handler para mudança de estado
const handleChange = (event: Event): void => {
	if (props.disabled) return;

	const target = event.target as HTMLInputElement;
	const checked = target.checked;

	if (Array.isArray(props.modelValue)) {
		// Modo array - adicionar/remover valor
		const newValue = [...props.modelValue];
		if (checked && props.value !== undefined) {
			if (!newValue.includes(props.value)) {
				newValue.push(props.value);
			}
		} else if (props.value !== undefined) {
			const index = newValue.indexOf(props.value);
			if (index > -1) {
				newValue.splice(index, 1);
			}
		}
		emit("update:modelValue", newValue);
	} else {
		// Modo boolean
		emit("update:modelValue", checked);
	}

	emit("change", checked, props.value);
};

// Handler para clique no ícone
const handleIconClick = (): void => {
	if (props.disabled) return;

	// Simular clique no input nativo
	const inputElement = document.getElementById(checkboxId) as HTMLInputElement;
	if (inputElement) {
		inputElement.click();
	}
};
</script>

<template>
	<div class="flex items-center gap-3">
		<!-- Checkbox -->
		<div class="flex-shrink-0">
			<input
				:id="checkboxId"
				type="checkbox"
				:checked="isChecked"
				:indeterminate="indeterminate"
				:disabled="disabled"
				:required="required"
				:value="value"
				:class="checkboxClasses"
				:aria-describedby="help ? helpId : undefined"
				@change="handleChange"
			/>

			<!-- Ícone customizado -->
			<div :class="iconContainerClasses" @click="handleIconClick">
				<Icon v-if="indeterminate" name="lucide:minus" :class="iconClasses" />
				<Icon v-else-if="isChecked" name="lucide:check" :class="iconClasses" />
			</div>
		</div>

		<!-- Label e descrição -->
		<div v-if="label || help" class="flex-1 min-w-0">
			<label v-if="label" :for="checkboxId" :class="labelClasses">
				{{ label }}
				<span v-if="required" class="text-[var(--error)] ml-1">*</span>
			</label>
			<p v-if="help" :id="helpId" class="text-sm text-[var(--text-muted)] mt-0.5">
				{{ help }}
			</p>
		</div>
	</div>
</template>

<style scoped>
/* CSS necessário para funcionalidade específica que não pode ser feita apenas com Tailwind */
</style>
