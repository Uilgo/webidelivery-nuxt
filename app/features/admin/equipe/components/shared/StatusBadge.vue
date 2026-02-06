<script setup lang="ts">
/**
 * 📌 StatusBadge
 *
 * Badge para exibir status de membro (ativo/inativo).
 * Usa cores consistentes com o design system.
 */

interface Props {
	ativo: boolean;
}

const props = defineProps<Props>();

// Computed properties para cor e texto
const badgeProps = computed(() => {
	if (props.ativo) {
		return {
			classes: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
			icon: "lucide:check-circle",
			text: "Ativo",
		};
	} else {
		return {
			classes: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
			icon: "lucide:x-circle",
			text: "Inativo",
		};
	}
});
</script>

<template>
	<span
		class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
		:class="badgeProps.classes"
	>
		<Icon :name="badgeProps.icon" class="w-3.5 h-3.5" />
		{{ badgeProps.text }}
	</span>
</template>
