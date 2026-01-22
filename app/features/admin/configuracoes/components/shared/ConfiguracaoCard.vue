<script setup lang="ts">
/**
 * 📌 ConfiguracaoCard
 *
 * Card reutilizável para seções de configuração.
 * Fornece estrutura consistente com cabeçalho, conteúdo e ações.
 */

interface Props {
	/** Título do card */
	title: string;
	/** Descrição opcional */
	description?: string;
	/** Ícone opcional */
	icon?: string;
	/** Mostrar botão de salvar */
	showSaveButton?: boolean;
	/** Mostrar botão de cancelar */
	showCancelButton?: boolean;
	/** Texto do botão de salvar */
	saveButtonText?: string;
	/** Estado de loading */
	loading?: boolean;
	/** Desabilitar botão de salvar */
	disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
	description: "",
	icon: "",
	showSaveButton: true,
	showCancelButton: false,
	saveButtonText: "Salvar Alterações",
	loading: false,
	disabled: false,
});

interface Emits {
	save: [];
	cancel: [];
}

defineEmits<Emits>();
</script>

<template>
	<UiCard class="p-6">
		<!-- Cabeçalho do Card -->
		<div class="flex items-start justify-between mb-6">
			<div class="flex-1">
				<div class="flex items-center gap-2 mb-1">
					<Icon v-if="icon" :name="icon" class="w-5 h-5 text-[var(--primary)]" />
					<h3 class="text-lg font-semibold text-[var(--text-primary)]">
						{{ title }}
					</h3>
				</div>
				<p v-if="description" class="text-sm text-[var(--text-muted)]">
					{{ description }}
				</p>
			</div>

			<!-- Slot para ações no cabeçalho -->
			<slot name="header-actions"></slot>
		</div>

		<!-- Conteúdo principal -->
		<div class="space-y-4">
			<slot></slot>
		</div>

		<!-- Rodapé com botões de ação -->
		<div
			v-if="$slots.actions || showSaveButton"
			class="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-[var(--border-muted)]"
		>
			<slot name="actions">
				<UiButton
					v-if="showCancelButton"
					variant="ghost"
					:disabled="loading"
					@click="$emit('cancel')"
				>
					Cancelar
				</UiButton>
				<UiButton
					v-if="showSaveButton"
					variant="solid"
					:loading="loading"
					:disabled="disabled"
					@click="$emit('save')"
				>
					{{ saveButtonText }}
				</UiButton>
			</slot>
		</div>
	</UiCard>
</template>
