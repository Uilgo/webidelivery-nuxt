<script setup lang="ts">
/**
 * 🍞 Breadcrumb Component
 *
 * Componente de navegação breadcrumb para mostrar a hierarquia de páginas.
 * Suporta itens clicáveis e não-clicáveis.
 */

interface BreadcrumbItem {
	label: string;
	to?: string;
	icon?: string;
}

interface Props {
	items: BreadcrumbItem[];
	separator?: string;
}

const _props = withDefaults(defineProps<Props>(), {
	separator: "/",
});
</script>

<template>
	<nav class="flex items-center space-x-2 text-sm">
		<template v-for="(item, index) in items" :key="index">
			<!-- Item clicável -->
			<NuxtLink
				v-if="item.to && index < items.length - 1"
				:to="item.to"
				class="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
			>
				<Icon v-if="item.icon" :name="item.icon" class="w-4 h-4" />
				<span>{{ item.label }}</span>
			</NuxtLink>

			<!-- Item atual (não clicável) -->
			<span v-else class="flex items-center gap-1.5 text-[var(--text-secondary)] font-medium">
				<Icon v-if="item.icon" :name="item.icon" class="w-4 h-4" />
				<span>{{ item.label }}</span>
			</span>

			<!-- Separador -->
			<span v-if="index < items.length - 1" class="text-[var(--text-muted)] select-none">
				{{ _props.separator }}
			</span>
		</template>
	</nav>
</template>
