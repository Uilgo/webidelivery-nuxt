<script setup lang="ts">
/**
 * 📌 GrupoAdicionalDrawer
 *
 * Drawer unificado para criação e edição de grupos de adicionais.
 * Usa prop isEdicao para alternar entre modos.
 */

import type { GrupoAdicionalComputado } from "../../../types/adicional";
import { useGruposAdicionaisActions } from "../composables/useGruposAdicionaisActions";
import { useToast } from "~/composables/ui/useToast";
import GrupoAdicionalForm from "./GrupoAdicionalForm.vue";

// Props do componente
interface Props {
	modelValue: boolean;
	grupo?: GrupoAdicionalComputado | null;
	isEdicao?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	grupo: null,
	isEdicao: false,
});

// Emits tipados
interface Emits {
	"update:modelValue": [value: boolean];
	success: [];
}

const emit = defineEmits<Emits>();

// Composables
const { create, update, creating, updating, actionError } = useGruposAdicionaisActions();
const toast = useToast();

// Ref do formulário
const formRef = ref<InstanceType<typeof GrupoAdicionalForm> | null>(null);

// Computed para controlar o drawer
const isOpen = computed({
	get: () => props.modelValue,
	set: (value: boolean) => emit("update:modelValue", value),
});

// Título dinâmico
const titulo = computed(() => {
	return props.isEdicao ? "Editar Grupo de Adicionais" : "Novo Grupo de Adicionais";
});

// Loading state
const isLoading = computed(() => creating.value || updating.value);

// Handler do submit
const handleSubmit = async (): Promise<void> => {
	// Trigger validação do formulário
	if (!formRef.value) return;

	formRef.value.handleSubmit();
};

// Handler do formulário (chamado após validação)
const handleFormSubmit = async (data: {
	nome: string;
	descricao: string;
	min_selecao: number;
	max_selecao: number;
	obrigatorio: boolean;
	ativo: boolean;
}): Promise<void> => {
	let success = false;

	if (props.isEdicao && props.grupo) {
		// Modo edição
		success = await update(props.grupo.id, data);

		if (success) {
			toast.add({
				title: "Sucesso!",
				description: "Grupo de adicionais atualizado com sucesso",
				color: "success",
			});
		}
	} else {
		// Modo criação
		const id = await create(data);
		success = !!id;

		if (success) {
			toast.add({
				title: "Sucesso!",
				description: "Grupo de adicionais criado com sucesso",
				color: "success",
			});
		}
	}

	if (success) {
		isOpen.value = false;
		emit("success");
	} else if (actionError.value) {
		toast.add({
			title: "Erro",
			description: actionError.value,
			color: "error",
		});
	}
};

// Fechar drawer
const fecharDrawer = (): void => {
	if (!isLoading.value) {
		isOpen.value = false;
	}
};
</script>

<template>
	<UiDrawer v-model="isOpen" :title="titulo" :is-edicao="isEdicao" size="md">
		<!-- Slot padrão (não nomeado) -->
		<GrupoAdicionalForm
			ref="formRef"
			:grupo="grupo"
			:is-edicao="isEdicao"
			@submit="handleFormSubmit"
		/>

		<!-- Footer com botões -->
		<template #footer>
			<div class="flex items-center gap-3 w-full">
				<UiButton
					variant="ghost"
					size="lg"
					class="flex-1"
					:disabled="isLoading"
					@click="fecharDrawer"
				>
					Cancelar
				</UiButton>

				<UiButton
					variant="solid"
					size="lg"
					class="flex-1"
					:loading="isLoading"
					:disabled="isLoading"
					@click="handleSubmit"
				>
					{{ isEdicao ? "Atualizar" : "Criar" }}
				</UiButton>
			</div>
		</template>
	</UiDrawer>
</template>
