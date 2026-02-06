<script setup lang="ts">
/**
 * 📌 PedidoSectionTitle
 *
 * Título de seção com ícone (Tailwind + Design System Adaptativo).
 */

interface Props {
	icon: string;
	title: string;
}

const props = defineProps<Props>();
</script>

<template>
	<h2 class="flex items-center gap-3 text-lg md:text-xl font-bold text-[var(--cardapio-text)] mb-5">
		<Icon :name="icon" class="w-5 h-5 md:w-6 md:h-6 text-[var(--cardapio-primary)]" />
		<span>{{ title }}</span>
	</h2>
</template>
