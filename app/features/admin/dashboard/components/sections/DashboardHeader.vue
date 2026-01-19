<script setup lang="ts">
/**
 * 📊 DashboardHeader - Cabeçalho do Dashboard
 *
 * Exibe título, data atual e ações principais (Refresh e Relatório).
 */

interface Props {
	loading?: boolean;
}

interface Emits {
	(e: "refresh" | "report"): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

// Data formatada (ex: Domingo, 19 de Janeiro)
const currentDate = computed(() => {
	const date = new Date();
	return new Intl.DateTimeFormat("pt-BR", {
		weekday: "long",
		day: "numeric",
		month: "long",
	}).format(date);
});

// Capitaliza a primeira letra
const formattedDate = computed(() => {
	const str = currentDate.value;
	return str.charAt(0).toUpperCase() + str.slice(1);
});
</script>

<template>
	<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Dashboard</h1>
			<p class="text-sm text-[var(--text-muted)] mt-1">Visão geral de {{ formattedDate }}</p>
		</div>

		<div class="flex items-center gap-2">
			<UiButton
				variant="outline"
				size="sm"
				class="hidden sm:flex text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
				@click="emit('report')"
			>
				<template #iconLeft>
					<Icon name="lucide:printer" class="w-4 h-4" />
				</template>
				Relatório
			</UiButton>

			<UiButton
				:loading="loading"
				variant="ghost"
				size="sm"
				title="Atualizar dados"
				class="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
				@click="emit('refresh')"
			>
				<Icon name="lucide:refresh-cw" class="w-4 h-4" />
			</UiButton>
		</div>
	</div>
</template>
