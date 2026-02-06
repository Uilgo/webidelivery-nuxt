<script setup lang="ts">
/**
 * 📌 AdicionalDeleteModal
 *
 * Modal de confirmação para exclusão de adicionais.
 * Padrão consistente com outros modais de exclusão.
 */

import type { AdicionalComputado } from "../../../types/adicional";
import { useAdicionaisActions } from "../composables/useAdicionaisActions";
import { useAdicionaisFetch } from "../composables/useAdicionaisFetch";
import { useToast } from "~/composables/ui/useToast";

// Props do componente
interface Props {
	modelValue: boolean;
	adicional?: AdicionalComputado | null;
}

const props = withDefaults(defineProps<Props>(), {
	adicional: null,
});

// Emits tipados
interface Emits {
	"update:modelValue": [value: boolean];
	success: [];
}

const emit = defineEmits<Emits>();

// Composables
const { remove, deleting, actionError } = useAdicionaisActions();
const { refresh } = useAdicionaisFetch();
const toast = useToast();

// Computed para controlar o modal
const isOpen = computed({
	get: () => props.modelValue,
	set: (value: boolean) => emit("update:modelValue", value),
});

// Handler da exclusão
const handleDelete = async (): Promise<void> => {
	if (!props.adicional) return;

	const success = await remove(props.adicional.id);

	if (success) {
		toast.add({
			title: "Sucesso!",
			description: "Adicional excluído com sucesso",
			color: "success",
		});

		// Refresh dos dados passando o grupo_id
		if (props.adicional.grupo_id) {
			await refresh(props.adicional.grupo_id);
		}

		isOpen.value = false;
		emit("success");
	} else if (actionError.value) {
		toast.add({
			title: "Erro ao excluir",
			description: actionError.value,
			color: "error",
		});
	}
};

// Fechar modal
const fecharModal = (): void => {
	if (!deleting.value) {
		isOpen.value = false;
	}
};
</script>

<template>
	<UiModal v-model="isOpen" title="Excluir Adicional" size="sm">
		<div class="space-y-4">
			<p class="text-sm text-[var(--text-secondary)]">
				Tem certeza que deseja excluir o adicional
				<span class="font-semibold text-[var(--text-primary)]">{{ adicional?.nome }}</span
				>?
			</p>

			<div
				v-if="adicional?.grupo_nome"
				class="p-4 bg-[var(--bg-muted)] border border-[var(--border-muted)] rounded-lg"
			>
				<div class="flex items-center gap-2">
					<Icon name="lucide:tag" class="w-4 h-4 text-[var(--text-muted)]" />
					<div class="flex-1 min-w-0">
						<p class="text-xs text-[var(--text-muted)]">Grupo</p>
						<p class="text-sm font-medium text-[var(--text-primary)]">
							{{ adicional.grupo_nome }}
						</p>
					</div>
				</div>
			</div>

			<p class="text-xs text-[var(--text-muted)]">Esta ação não pode ser desfeita.</p>
		</div>

		<template #footer>
			<div class="flex gap-3">
				<UiButton
					variant="ghost"
					color="neutral"
					:disabled="deleting"
					class="flex-1"
					@click="fecharModal"
				>
					Cancelar
				</UiButton>

				<UiButton
					variant="solid"
					color="error"
					:disabled="deleting"
					:loading="deleting"
					@click="handleDelete"
				>
					<template #iconLeft>
						<Icon name="lucide:trash-2" />
					</template>
					Excluir
				</UiButton>
			</div>
		</template>
	</UiModal>
</template>
