<script setup lang="ts">
/**
 * 📌 Switch Component
 *
 * Componente de switch (toggle) reutilizável com label, estados e animações.
 * Suporta diferentes tamanhos, cores e funcionalidades de acessibilidade.
 * Segue o design system definido no main.css.
 */

// Tipos para as props do componente
interface Props {
	/** Valor do switch (v-model) */
	modelValue: boolean;
	/** Label do switch */
	label?: string;
	/** Texto de ajuda */
	help?: string;
	/** Campo obrigatório */
	required?: boolean;
	/** Estado desabilitado */
	disabled?: boolean;
	/** Tamanho do switch */
	size?: "sm" | "md" | "lg";
	/** Cor do switch quando ativo */
	color?: "primary" | "success" | "warning" | "error";
}

// Props com valores padrão
const props = withDefaults(defineProps<Props>(), {
	label: "",
	help: "",
	required: false,
	disabled: false,
	size: "md",
	color: "primary",
});

// Emits tipados
interface Emits {
	"update:modelValue": [value: boolean];
	change: [value: boolean];
}

const emit = defineEmits<Emits>();

// IDs únicos para acessibilidade
const switchId = useId();
const labelId = useId();
const helpId = useId();

// Classes computadas para o switch
const switchClasses = computed(() => {
	const baseClasses = [
		"relative inline-flex items-center",
		"border-2 border-transparent",
		"rounded-full",
		"transition-all duration-200 ease-in-out",
		"focus-ring",
		"cursor-pointer",
	];

	// Classes de tamanho
	const sizeClasses = {
		sm: "w-8 h-5",
		md: "w-11 h-6",
		lg: "w-14 h-8",
	};

	// Classes de cor baseadas no estado
	const colorClasses = {
		primary: props.modelValue ? "bg-[var(--primary)]" : "bg-[var(--border-default)]",
		success: props.modelValue ? "bg-[var(--success)]" : "bg-[var(--border-default)]",
		warning: props.modelValue ? "bg-[var(--warning)]" : "bg-[var(--border-default)]",
		error: props.modelValue ? "bg-[var(--error)]" : "bg-[var(--border-default)]",
	};

	// Classes de estado
	const stateClasses = [];
	if (props.disabled) {
		stateClasses.push("opacity-50", "cursor-not-allowed");
	} else if (!props.modelValue) {
		stateClasses.push("hover:bg-[var(--border-strong)]");
	}

	return [...baseClasses, sizeClasses[props.size], colorClasses[props.color], ...stateClasses].join(
		" ",
	);
});

// Classes computadas para o thumb (bolinha)
const thumbClasses = computed(() => {
	const baseClasses = [
		"inline-block",
		"bg-white",
		"rounded-full",
		"shadow-sm",
		"transition-transform duration-200 ease-in-out",
		"transform",
	];

	// Classes de tamanho e posição
	const sizeClasses = {
		sm: {
			size: "w-3 h-3",
			translate: props.modelValue ? "translate-x-3" : "translate-x-0.5",
		},
		md: {
			size: "w-4 h-4",
			translate: props.modelValue ? "translate-x-5" : "translate-x-1",
		},
		lg: {
			size: "w-6 h-6",
			translate: props.modelValue ? "translate-x-6" : "translate-x-1",
		},
	};

	const currentSize = sizeClasses[props.size];

	return [...baseClasses, currentSize.size, currentSize.translate].join(" ");
});

// Classes computadas para o label
const labelClasses = computed(() => {
	const baseClasses = ["text-sm font-medium cursor-pointer"];
	const colorClasses = props.disabled ? "text-[var(--text-muted)]" : "text-[var(--text-primary)]";

	return [...baseClasses, colorClasses].join(" ");
});

// Função para alternar o estado
const toggle = (): void => {
	if (props.disabled) return;

	const newValue = !props.modelValue;
	emit("update:modelValue", newValue);
	emit("change", newValue);
};

// Handler para navegação por teclado
const handleKeydown = (event: KeyboardEvent): void => {
	if (props.disabled) return;

	// Space ou Enter para alternar
	if (event.key === " " || event.key === "Enter") {
		event.preventDefault();
		toggle();
	}
};
</script>

<template>
	<div class="flex items-center gap-3">
		<!-- Switch -->
		<button
			:id="switchId"
			type="button"
			role="switch"
			:aria-checked="modelValue"
			:aria-labelledby="label ? labelId : undefined"
			:aria-describedby="help ? helpId : undefined"
			:disabled="disabled"
			:class="switchClasses"
			@click="toggle"
			@keydown="handleKeydown"
		>
			<!-- Thumb (bolinha) -->
			<span :class="thumbClasses"></span>
		</button>

		<!-- Label e descrição -->
		<div v-if="label || help" class="flex-1">
			<label v-if="label" :id="labelId" :for="switchId" :class="labelClasses">
				{{ label }}
				<span v-if="required" class="text-[var(--error)] ml-1">*</span>
			</label>
			<p v-if="help" :id="helpId" class="text-sm text-[var(--text-muted)] mt-1">
				{{ help }}
			</p>
		</div>
	</div>
</template>

<style scoped>
/* CSS necessário para funcionalidade específica que não pode ser feita apenas com Tailwind */
</style>
