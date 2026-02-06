<script setup lang="ts">
/**
 * 📌 AdicionalDrawer
 *
 * Drawer unificado para criação e edição de adicionais.
 * Usa prop isEdicao para alternar entre modos.
 */

import type {
	AdicionalComputado,
	AdicionalUpdateData,
	AdicionalCreateData,
} from "../../../types/adicional";
import { useAdicionaisActions } from "../composables/useAdicionaisActions";
import { useToast } from "~/composables/ui/useToast";
import AdicionalForm from "./AdicionalForm.vue";
import type {
	CreateAdicionalFormData,
	UpdateAdicionalFormData,
} from "#shared/schemas/cardapio/adicional";

// Props do componente
interface Props {
	modelValue: boolean;
	adicional?: AdicionalComputado | null;
	isEdicao?: boolean;
	grupoIdPadrao?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
	adicional: null,
	isEdicao: false,
	grupoIdPadrao: null,
});

// Emits tipados
interface Emits {
	"update:modelValue": [value: boolean];
	success: [];
}

const emit = defineEmits<Emits>();

// Composables
const { create, update, creating, updating, actionError } = useAdicionaisActions();
const toast = useToast();

// Ref do formulário
const formRef = ref<InstanceType<typeof AdicionalForm> | null>(null);

// Computed para controlar o drawer
const isOpen = computed({
	get: () => props.modelValue,
	set: (value: boolean) => emit("update:modelValue", value),
});

// Título dinâmico
const titulo = computed(() => {
	return props.isEdicao ? "Editar Adicional" : "Novo Adicional";
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
	data: CreateAdicionalFormData | UpdateAdicionalFormData,
): Promise<void> => {
	let success = false;

	if (props.isEdicao && props.adicional) {
		// Modo edição: validar campos obrigatórios para update
		if (!data.nome || data.preco === undefined) {
			toast.add({ title: "Erro", description: "Dados incompletos", color: "error" });
			return;
		}

		// Payload explícito usando interface do backend
		const payload: AdicionalUpdateData = {
			...data,
			nome: data.nome!,
			preco: data.preco!,
		};
		success = await update(props.adicional.id, payload);

		if (success) {
			toast.add({
				title: "Sucesso!",
				description: "Adicional atualizado com sucesso",
				color: "success",
			});
		}
	} else {
		// Modo criação
		const payload = {
			...data,
			nome: data.nome!,
			preco: data.preco!,
			grupo_id: "grupo_id" in data ? (data.grupo_id as string) : props.grupoIdPadrao || undefined,
		};

		if (!payload.grupo_id) {
			toast.add({
				title: "Erro",
				description: "Grupo de adicionais não identificado",
				color: "error",
			});
			return;
		}

		// Cast payload para backend type
		success = !!(await create(payload as AdicionalCreateData));

		if (success) {
			toast.add({
				title: "Sucesso!",
				description: "Adicional criado com sucesso",
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
		<AdicionalForm
			ref="formRef"
			:adicional="adicional"
			:is-edicao="isEdicao"
			:grupo-id-padrao="grupoIdPadrao"
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
