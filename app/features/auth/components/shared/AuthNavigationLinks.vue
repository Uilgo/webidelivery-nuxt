<!--
📌 AuthNavigationLinks
Componente reutilizável para links de navegação em formulários de auth.
Suporta diferentes contextos (login, signup, forgot, super-admin).
-->

<script setup lang="ts">
interface LinkConfig {
	text: string;
	to: string;
	description?: string;
}

interface Props {
	primaryLink?: LinkConfig;
	secondaryLink?: LinkConfig;
	tertiaryLink?: LinkConfig;
	showDivider?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	primaryLink: undefined,
	secondaryLink: undefined,
	tertiaryLink: undefined,
	showDivider: false,
});
</script>

<template>
	<div class="space-y-3 text-center">
		<!-- Link primário -->
		<div v-if="props.primaryLink" class="text-[var(--text-secondary)] text-sm">
			<span v-if="props.primaryLink.description">{{ props.primaryLink.description }}</span>
			<NuxtLink
				:to="props.primaryLink.to"
				class="text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium transition-colors duration-200"
				:class="props.primaryLink.description ? 'ml-1' : 'block'"
			>
				{{ props.primaryLink.text }}
			</NuxtLink>
		</div>

		<!-- Link secundário -->
		<div v-if="props.secondaryLink" class="text-[var(--text-secondary)] text-sm">
			<span v-if="props.secondaryLink.description">{{ props.secondaryLink.description }}</span>
			<NuxtLink
				:to="props.secondaryLink.to"
				class="text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium transition-colors duration-200"
				:class="props.secondaryLink.description ? 'ml-1' : 'block'"
			>
				{{ props.secondaryLink.text }}
			</NuxtLink>
		</div>

		<!-- Divisor -->
		<div
			v-if="props.showDivider && props.tertiaryLink"
			class="pt-2 border-t border-[var(--border-light)]"
		></div>

		<!-- Link terciário (geralmente menor/muted) -->
		<div v-if="props.tertiaryLink" class="text-[var(--text-muted)] text-xs">
			<NuxtLink
				:to="props.tertiaryLink.to"
				class="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors duration-200"
			>
				{{ props.tertiaryLink.text }}
			</NuxtLink>
		</div>
	</div>
</template>
