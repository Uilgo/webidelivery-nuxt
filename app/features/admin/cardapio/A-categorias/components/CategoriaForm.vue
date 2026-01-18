<script setup lang="ts">
/**
 * 📌 CategoriaForm
 *
 * Formulário reutilizável para criação e edição de categorias.
 * Usa VeeValidate + Zod para validação tipada e consistente.
 */

import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import {
	createCategoriaSchema,
	updateCategoriaSchema,
	type CreateCategoriaFormData,
	type UpdateCategoriaFormData,
} from "#shared/schemas/cardapio/categoria";
import type { CategoriaComputada } from "../../../types/categoria";

interface Props {
	/** Modo do formulário - determina campos e validações */
	mode: "create" | "edit" | "view";
	/** Dados iniciais para edição */
	initialData?: CategoriaComputada | null;
	/** Estado de carregamento */
	loading?: boolean;
}

interface Emits {
	/** Dados válidos do formulário */
	submit: [data: CreateCategoriaFormData | UpdateCategoriaFormData];
	/** Cancelar operação */
	cancel: [];
}

const props = withDefaults(defineProps<Props>(), {
	initialData: null,
	loading: false,
});

const emit = defineEmits<Emits>();

/**
 * Computed para determinar se é modo de visualização
 */
const isViewMode = computed(() => props.mode === "view");
const isEditMode = computed(() => props.mode === "edit");

/**
 * Escolhe o schema baseado no modo
 */
const validationSchema = computed(() =>
	props.mode === "edit"
		? toTypedSchema(updateCategoriaSchema)
		: toTypedSchema(createCategoriaSchema),
);

/**
 * Valores iniciais do formulário
 */
const getInitialValues = () => {
	if (props.initialData) {
		return {
			nome: props.initialData.nome || "",
			descricao: props.initialData.descricao || "",
			imagem_url: props.initialData.imagem_url || "",
			ativo: props.initialData.ativo ?? true,
		};
	}

	return {
		nome: "",
		descricao: "",
		imagem_url: "",
		ativo: true,
	};
};

/**
 * Configura VeeValidate
 */
const { handleSubmit, errors, defineField, resetForm, meta } = useForm({
	validationSchema,
	initialValues: getInitialValues(),
});

/**
 * Define campos com validação automática
 */
const [nome, nomeAttrs] = defineField("nome");
const [descricao, descricaoAttrs] = defineField("descricao", { validateOnModelUpdate: false });
const [imagem_url, imagemUrlAttrs] = defineField("imagem_url", { validateOnModelUpdate: false });
const [ativo] = defineField("ativo");

/**
 * Computed para validação geral do formulário
 */
const isFormValid = computed(() => meta.value.valid);

/**
 * Submit com validação automática
 */
const onSubmit = handleSubmit((values) => {
	emit("submit", values);
});

/**
 * Watch para resetar form quando initialData mudar
 */
watch(
	() => props.initialData,
	(newData) => {
		if (newData) {
			resetForm({
				values: {
					nome: newData.nome,
					descricao: newData.descricao || "",
					imagem_url: newData.imagem_url || "",
					ativo: newData.ativo,
				},
			});
		}
	},
);

/**
 * Watch para resetar quando modo mudar
 */
watch(
	() => props.mode,
	() => {
		resetForm({ values: getInitialValues() });
	},
);

/**
 * Expõe métodos para componente pai
 */
defineExpose({
	handleSubmit: onSubmit,
	isFormValid,
});
</script>

<template>
	<form class="space-y-6" @submit.prevent="onSubmit">
		<!-- Nome -->
		<UiFormField
			label="Nome da Categoria"
			:error="errors.nome"
			help="Nome que aparecerá no cardápio (3-100 caracteres)"
			required
		>
			<UiInput
				v-model="nome"
				v-bind="nomeAttrs"
				placeholder="Ex: Pizzas, Bebidas, Sobremesas..."
				:disabled="isViewMode || loading"
				:error="!!errors.nome"
				maxlength="100"
			/>
		</UiFormField>

		<!-- Descrição -->
		<UiFormField
			label="Descrição"
			:error="errors.descricao"
			help="Descrição opcional da categoria (máximo 500 caracteres)"
		>
			<UiTextarea
				:model-value="descricao ?? ''"
				v-bind="descricaoAttrs"
				placeholder="Descrição opcional da categoria..."
				:disabled="isViewMode || loading"
				:rows="3"
				:max-length="500"
				:show-counter="true"
				:resize="false"
				@update:model-value="descricao = $event"
			/>
		</UiFormField>

		<!-- Upload de Imagem -->
		<UiFormField
			label="Imagem da Categoria"
			:error="errors.imagem_url"
			help="Faça upload ou insira URL de uma imagem para representar a categoria"
		>
			<UiPictureUpload
				:model-value="imagem_url ?? ''"
				v-bind="imagemUrlAttrs"
				:disabled="isViewMode || loading"
				hint="Categoria"
				:max-size="512"
				:max-size-k-b="100"
				@update:model-value="imagem_url = $event"
			/>
		</UiFormField>

		<!-- Status Ativo (apenas no modo edição) -->
		<UiFormField
			v-if="isEditMode"
			label="Status da Categoria"
			help="Categorias inativas não aparecem no cardápio público"
		>
			<UiCheckbox v-model="ativo" label="Categoria ativa" :disabled="loading" color="primary" />
		</UiFormField>
	</form>
</template>
