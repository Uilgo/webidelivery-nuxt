<script setup lang="ts">
/**
 * 📌 ViewModeToggle - Componente Toggle de Modo de Visualização
 *
 * Componente para alternar entre visualização em Cards e Lista.
 * Usa componentes UI para consistência visual.
 * O estado é gerenciado pelo componente pai que persiste no localStorage.
 */

interface Props {
	modelValue: "card" | "list";
	disabled?: boolean;
}

interface Emits {
	"update:modelValue": [value: "card" | "list"];
}

const props = withDefaults(defineProps<Props>(), {
	disabled: false,
});

const emit = defineEmits<Emits>();

/**
 * Opções de visualização
 */
const viewModeOptions = [
	{
		value: "card" as const,
		label: "Cards",
		icon: "lucide:layout-grid",
		description: "Visualização em cards",
	},
	{
		value: "list" as const,
		label: "Lista",
		icon: "lucide:list",
		description: "Visualização em lista",
	},
];

/**
 * Handler para mudança de modo
 */
const handleModeChange = (mode: "card" | "list"): void => {
	if (!props.disabled) {
		emit("update:modelValue", mode);
	}
};
</script>

<template>
	<div class="view-mode-toggle" role="group" aria-label="Modo de visualização">
		<div
			class="flex gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] p-1"
		>
			<UiButton
				v-for="option in viewModeOptions"
				:key="option.value"
				:variant="modelValue === option.value ? 'solid' : 'ghost'"
				:disabled="disabled"
				size="sm"
				:aria-label="option.description"
				:aria-pressed="modelValue === option.value"
				class="!px-2.5 !py-1.5 !min-h-[32px]"
				@click="handleModeChange(option.value)"
			>
				<Icon :name="option.icon" class="h-4 w-4" />
			</UiButton>
		</div>
	</div>
</template>
