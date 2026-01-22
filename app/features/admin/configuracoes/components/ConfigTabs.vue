<script setup lang="ts">
/**
 * 📌 ConfigTabs
 *
 * Componente de navegação de tabs para configurações.
 * Recebe tabs já filtradas por RBAC do componente pai.
 */

/**
 * Interface de Tab
 */
interface Tab {
	key: string;
	label: string;
	icon: string;
}

/**
 * Props
 */
interface Props {
	tabs: Tab[];
	defaultTab: string;
	modelValue?: string;
}

/**
 * Emits
 */
interface Emits {
	"update:modelValue": [value: string];
	"tab-change": [tabKey: string];
}

defineProps<Props>();
const emit = defineEmits<Emits>();

/**
 * Handler para mudança de tab
 */
const handleTabChange = (tabKey: string): void => {
	emit("update:modelValue", tabKey);
	emit("tab-change", tabKey);
};
</script>

<template>
	<UiTabs
		:tabs="tabs"
		:default-tab="defaultTab"
		:model-value="modelValue"
		@tab-change="handleTabChange"
	/>
</template>
