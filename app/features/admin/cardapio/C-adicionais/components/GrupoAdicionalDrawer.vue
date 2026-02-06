<script setup lang="ts">
/**
 * 📌 GrupoAdicionalDrawer
 *
 * Drawer unificado para criação e edição de grupos de adicionais.
 * Usa prop isEdicao para alternar entre modos.
 */

import type {
	GrupoAdicionalComputado,
	GrupoAdicionalUpdateData,
	GrupoAdicionalCreateData,
} from "../../../types/adicional";
import { useGruposAdicionaisActions } from "../composables/useGruposAdicionaisActions";
import { useToast } from "~/composables/ui/useToast";
import GrupoAdicionalForm from "./GrupoAdicionalForm.vue";

import type {
	CreateGrupoAdicionalFormData,
	UpdateGrupoAdicionalFormData,
} from "#shared/schemas/cardapio/grupo-adicional";

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
const handleFormSubmit = async (
	data: CreateGrupoAdicionalFormData | UpdateGrupoAdicionalFormData,
): Promise<void> => {
	let success = false;

	// Sanitização dos dados
	const payload = {
		...data,
		max_selecao: data.max_selecao || undefined,
	};

	if (props.isEdicao && props.grupo) {
		// Modo edição
		if (!data.nome || data.min_selecao === undefined || data.max_selecao === undefined) {
			toast.add({ title: "Erro", description: "Dados incompletos", color: "error" });
			return;
		}

		// Payload explícito para satisfazer a interface estrita
		const updatePayload: GrupoAdicionalUpdateData = {
			nome: data.nome,
			descricao: data.descricao,
			min_selecao: data.min_selecao,
			max_selecao: payload.max_selecao, // Já sanitizado no payload acima
			obrigatorio: data.obrigatorio ?? false,
			ativo: data.ativo ?? true,
		};

		success = await update(props.grupo.id, updatePayload);

		if (success) {
			toast.add({
				title: "Sucesso!",
				description: "Grupo de adicionais atualizado com sucesso",
				color: "success",
			});
		}
	} else {
		// Modo criação
		success = !!(await create(payload as GrupoAdicionalCreateData));

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
