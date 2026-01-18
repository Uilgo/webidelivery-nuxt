<script setup lang="ts">
/**
 * 📌 ComboDrawer
 *
 * Drawer unificado para criação e edição de combos.
 * Usa prop isEdicao para determinar o modo (true = edição, false = criação).
 */

import type { Combo } from "../../../types/combo";
import { useCombosActions } from "../composables/useCombosActions";
import { useToast } from "~/composables/ui/useToast";
import ComboForm from "./ComboForm.vue";

// Props do componente
interface Props {
	modelValue: boolean;
	isEdicao: boolean;
	combo?: Combo | null;
}

const props = withDefaults(defineProps<Props>(), {
	combo: null,
});

// Emits tipados
interface Emits {
	"update:modelValue": [value: boolean];
	success: [action: "create" | "update", combo?: Combo];
}

const emit = defineEmits<Emits>();

// Composables
const { createCombo, updateCombo } = useCombosActions();
const { add: showToast } = useToast();

// Loading state
const isLoading = ref(false);

// Ref para o formulário
const comboFormRef = ref();

// Título dinâmico baseado no modo
const titulo = computed(() => {
	return props.isEdicao ? "Editar Combo" : "Criar Combo";
});

// Handler para fechar o drawer
const fecharDrawer = (): void => {
	emit("update:modelValue", false);
};

// Handler para submit do formulário
const handleSubmit = async (dadosFormulario: unknown): Promise<void> => {
	isLoading.value = true;

	try {
		const formData = dadosFormulario as {
			nome: string;
			descricao: string;
			imagem_url: string;
			preco_combo: number;
			preco_original: number;
			destaque: boolean;
			ativo: boolean;
			data_inicio: string;
			data_fim: string;
			produtos: Array<{ produto_id: string; quantidade: number }>;
		};

		if (props.isEdicao && props.combo) {
			// Atualizar combo existente
			const success = await updateCombo(props.combo.id, formData);
			if (success) {
				emit("success", "update", props.combo);
				fecharDrawer();
			}
		} else {
			// Criar novo combo (RPC busca estabelecimento_id automaticamente)
			const comboId = await createCombo(formData);

			if (comboId) {
				emit("success", "create");
				fecharDrawer();
			}
		}
	} catch (error: unknown) {
		console.error("Erro ao salvar combo:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Ocorreu um erro inesperado. Tente novamente.";
		showToast({
			title: "Erro ao salvar combo",
			description: errorMessage,
			color: "error",
		});
	} finally {
		isLoading.value = false;
	}
};
</script>

<template>
	<UiDrawer
		:model-value="modelValue"
		:title="titulo"
		:is-edicao="isEdicao"
		size="lg"
		@update:model-value="emit('update:modelValue', $event)"
	>
		<!-- Conteúdo do drawer -->
		<ComboForm ref="comboFormRef" :combo="combo" :is-edicao="isEdicao" @submit="handleSubmit" />

		<!-- Footer com botões -->
		<template #footer>
			<div class="flex items-center gap-3">
				<!-- Botão Cancelar -->
				<UiButton
					type="button"
					variant="ghost"
					:disabled="isLoading"
					class="flex-1"
					@click="fecharDrawer"
				>
					Cancelar
				</UiButton>

				<!-- Botão Salvar/Atualizar -->
				<UiButton
					type="button"
					:loading="isLoading"
					:disabled="isLoading"
					class="flex-1"
					@click="() => comboFormRef?.handleSubmit()"
				>
					{{ isEdicao ? "Atualizar" : "Salvar" }}
				</UiButton>
			</div>
		</template>
	</UiDrawer>
</template>
