<script setup lang="ts">
/**
 * 📌 UiSkeleton
 *
 * Componente de placeholder animado para loading states.
 * Utiliza animate-pulse do Tailwind para criar o efeito de carregamento.
 */

interface Props {
	class?: string;
}

const props = defineProps<Props>();
</script>

<template>
	<div class="animate-pulse rounded-md bg-[var(--bg-muted)]" :class="props.class"></div>
</template>
