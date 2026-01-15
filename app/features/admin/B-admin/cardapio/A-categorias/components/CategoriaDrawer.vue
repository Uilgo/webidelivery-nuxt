<script setup lang="ts">
/**
 * 📌 CategoriaDrawer
 *
 * Drawer principal para criação, edição e visualização de categorias.
 * Substitui o modal para melhor UX com formulários longos.
 */

import type {
	CategoriaComputada,
	CategoriaCreateData,
	CategoriaUpdateData,
} from "../../../types/categoria";
import { useCategoriasActions } from "../composables/useCategoriasActions";
import { useCategoriasFetch } from "../composables/useCategoriasFetch";
import { useToast } from "~/composables/ui/useToast";
import CategoriaForm from "./CategoriaForm.vue";

interface Props {
	/** Controla a visibilidade do drawer */
	modelValue: boolean;
	/** Indica se é edição (true) ou criação (false) */
	isEdicao: boolean;
	/** Categoria selecionada para edição/visualização */
	categoria?: CategoriaComputada | null;
}

interface Emits {
	"update:modelValue": [value: boolean];
	/** Evento disparado após sucesso na operação */
	success: [action: "create" | "update", categoria?: CategoriaComputada];
}

const props = withDefaults(defineProps<Props>(), {
	categoria: null,
});

const emit = defineEmits<Emits>();

// Composables
const { create, update, creating, updating, actionError } = useCategoriasActions();
const { refresh } = useCategoriasFetch();
const toast = useToast();

// Ref para o formulário
const formRef = ref<InstanceType<typeof CategoriaForm> | null>(null);

// Estados computados
const isOpen = computed({
	get: () => props.modelValue,
	set: (value) => emit("update:modelValue", value),
});

const isEditMode = computed(() => props.isEdicao);
const isCreateMode = computed(() => !props.isEdicao);

// Estado de loading geral
const isLoading = computed(() => creating.value || updating.value);

// Título do drawer baseado no modo
const drawerTitle = computed(() => {
	return props.isEdicao ? "Editar Categoria" : "Nova Categoria";
});

// Tamanho do drawer (sempre md para criação e edição)
const drawerSize = computed((): "md" => {
	return "md";
});

/**
 * Handler para submissão do formulário
 */
const handleSubmit = async (data: CategoriaCreateData | CategoriaUpdateData): Promise<void> => {
	try {
		if (isCreateMode.value) {
			// Criar nova categoria
			const categoriaId = await create(data as CategoriaCreateData);

			if (categoriaId) {
				toast.add({
					title: "Categoria criada",
					description: `A categoria "${data.nome}" foi criada com sucesso`,
					color: "success",
					duration: 4000,
				});

				// Refresh dos dados
				await refresh();

				// Emite evento de sucesso e fecha drawer
				emit("success", "create");
				handleClose();
			} else {
				// Erro já tratado no composable
				toast.add({
					title: "Erro ao criar categoria",
					description: actionError.value || "Ocorreu um erro inesperado",
					color: "error",
					duration: 5000,
				});
			}
		} else if (isEditMode.value && props.categoria) {
			// Atualizar categoria existente
			const success = await update(props.categoria.id, data as CategoriaUpdateData);

			if (success) {
				toast.add({
					title: "Categoria atualizada",
					description: `A categoria "${data.nome || props.categoria.nome}" foi atualizada com sucesso`,
					color: "success",
					duration: 4000,
				});

				// Refresh dos dados
				await refresh();

				// Emite evento de sucesso e fecha drawer
				emit("success", "update", props.categoria);
				handleClose();
			} else {
				// Erro já tratado no composable
				toast.add({
					title: "Erro ao atualizar categoria",
					description: actionError.value || "Ocorreu um erro inesperado",
					color: "error",
					duration: 5000,
				});
			}
		}
	} catch (error) {
		console.error("Erro no handleSubmit:", error);
		toast.add({
			title: "Erro inesperado",
			description: "Ocorreu um erro inesperado. Tente novamente.",
			color: "error",
			duration: 5000,
		});
	}
};

/**
 * Handler para cancelar/fechar drawer
 */
const handleClose = (): void => {
	isOpen.value = false;
};

/**
 * Handler para fechar drawer (evento do UiDrawer)
 */
const handleDrawerClose = (): void => {
	handleClose();
};

/**
 * Handler para submeter formulário através do botão do footer
 */
const handleFormSubmit = (): void => {
	// Trigger submit do formulário
	if (formRef.value) {
		formRef.value.handleSubmit();
	}
};

// Computed para validação do formulário (precisa ser exposto pelo form)
const isFormValid = computed(() => {
	return formRef.value?.isFormValid ?? false;
});
</script>

<template>
	<UiDrawer
		:key="`drawer-${isEdicao ? 'edit' : 'create'}-${categoria?.id || 'new'}`"
		v-model="isOpen"
		:title="drawerTitle"
		:size="drawerSize"
		:is-edicao="isEdicao"
		:loading="isLoading"
		:close-on-overlay="!isLoading"
		:close-on-escape="!isLoading"
		@close="handleDrawerClose"
	>
		<!-- Conteúdo do Drawer -->
		<CategoriaForm
			ref="formRef"
			:mode="isEdicao ? 'edit' : 'create'"
			:initial-data="categoria"
			:loading="isLoading"
			@submit="handleSubmit"
			@cancel="handleClose"
		/>

		<!-- Footer com botões de ação -->
		<template #footer>
			<div class="flex gap-3">
				<UiButton
					variant="ghost"
					color="neutral"
					:disabled="isLoading"
					class="flex-1"
					@click="handleClose"
				>
					Cancelar
				</UiButton>

				<UiButton
					variant="solid"
					color="primary"
					:disabled="isLoading || !isFormValid"
					:loading="isLoading"
					@click="handleFormSubmit"
				>
					<template #iconLeft>
						<Icon :name="isEditMode ? 'lucide:save' : 'lucide:plus'" />
					</template>
					{{ isEditMode ? "Atualizar" : "Criar" }} Categoria
				</UiButton>
			</div>
		</template>
	</UiDrawer>
</template>
