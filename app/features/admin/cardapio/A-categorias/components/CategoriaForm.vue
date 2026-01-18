<script setup lang="ts">
/**
 * 📌 CategoriaForm
 *
 * Formulário reutilizável para criação e edição de categorias.
 * Inclui validação em tempo real e inserção de imagem via URL.
 * Usa os componentes UI do design system do projeto.
 */

import type {
	CategoriaComputada,
	CategoriaCreateData,
	CategoriaUpdateData,
} from "../../../types/categoria";

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
	submit: [data: CategoriaCreateData | CategoriaUpdateData];
	/** Cancelar operação */
	cancel: [];
}

const props = withDefaults(defineProps<Props>(), {
	initialData: null,
	loading: false,
});

const emit = defineEmits<Emits>();

// Estado do formulário
const formData = reactive({
	nome: "",
	descricao: "",
	imagem_url: "",
	ativo: true,
});

// Estados de validação
const errors = reactive({
	nome: "",
	descricao: "",
	imagem_url: "",
});

// Computed para determinar se é modo de visualização
const isViewMode = computed(() => props.mode === "view");
const isEditMode = computed(() => props.mode === "edit");

// Computed para validação geral
const isFormValid = computed(() => {
	return (
		formData.nome.trim().length >= 3 &&
		formData.nome.trim().length <= 100 &&
		formData.descricao.length <= 500 &&
		!errors.nome &&
		!errors.descricao &&
		!errors.imagem_url
	);
});

/**
 * Inicializa o formulário com dados existentes (modo edição)
 */
const initializeForm = (): void => {
	if (props.initialData) {
		formData.nome = props.initialData.nome;
		formData.descricao = props.initialData.descricao || "";
		formData.imagem_url = props.initialData.imagem_url || "";
		formData.ativo = props.initialData.ativo;
	} else {
		// Reset para modo criação
		formData.nome = "";
		formData.descricao = "";
		formData.imagem_url = "";
		formData.ativo = true;
	}

	// Limpa erros
	clearErrors();
};

/**
 * Limpa todos os erros de validação
 */
const clearErrors = (): void => {
	errors.nome = "";
	errors.descricao = "";
	errors.imagem_url = "";
};

/**
 * Valida campo nome
 */
const validateNome = (): void => {
	const nome = formData.nome.trim();

	if (!nome) {
		errors.nome = "Nome é obrigatório";
	} else if (nome.length < 3) {
		errors.nome = "Nome deve ter pelo menos 3 caracteres";
	} else if (nome.length > 100) {
		errors.nome = "Nome deve ter no máximo 100 caracteres";
	} else {
		errors.nome = "";
	}
};

/**
 * Valida campo descrição
 */
const validateDescricao = (): void => {
	if (formData.descricao.length > 500) {
		errors.descricao = "Descrição deve ter no máximo 500 caracteres";
	} else {
		errors.descricao = "";
	}
};

/**
 * Handler para mudança na URL da imagem
 */
const handleImageUrlChange = (url: string): void => {
	formData.imagem_url = url;
	errors.imagem_url = ""; // Limpa erro quando URL muda
};

/**
 * Submete o formulário
 */
const handleSubmit = async (): Promise<void> => {
	if (isViewMode.value) return;

	// Valida todos os campos
	validateNome();
	validateDescricao();

	if (!isFormValid.value) return;

	try {
		// Prepara dados para submissão
		const submitData = {
			nome: formData.nome.trim(),
			descricao: formData.descricao.trim() || undefined,
			imagem_url: formData.imagem_url.trim() || undefined,
			...(isEditMode.value && { ativo: formData.ativo }),
		};

		emit("submit", submitData);
	} catch (error) {
		console.error("Erro ao submeter formulário:", error);
	}
};

// Watchers para validação em tempo real
watch(() => formData.nome, validateNome);
watch(() => formData.descricao, validateDescricao);

// Inicializa formulário quando dados mudam
watch(() => props.initialData, initializeForm, { immediate: true });
watch(() => props.mode, initializeForm);

// Expõe métodos para componente pai
defineExpose({
	handleSubmit,
	isFormValid,
});
</script>

<template>
	<form class="space-y-6" @submit.prevent="handleSubmit">
		<!-- Nome -->
		<UiFormField
			label="Nome da Categoria"
			:error="errors.nome"
			help="Nome que aparecerá no cardápio (3-100 caracteres)"
			required
		>
			<UiInput
				v-model="formData.nome"
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
				v-model="formData.descricao"
				placeholder="Descrição opcional da categoria..."
				:disabled="isViewMode || loading"
				:error="errors.descricao"
				:rows="3"
				:max-length="500"
				:show-counter="true"
				:resize="false"
			/>
		</UiFormField>

		<!-- Upload de Imagem -->
		<UiFormField
			label="Imagem da Categoria"
			:error="errors.imagem_url"
			help="Faça upload ou insira URL de uma imagem para representar a categoria"
		>
			<UiPictureUpload
				:model-value="formData.imagem_url"
				:disabled="isViewMode || loading"
				:error="errors.imagem_url"
				hint="Categoria"
				:max-size="512"
				:max-size-k-b="100"
				@update:model-value="handleImageUrlChange"
			/>
		</UiFormField>

		<!-- Status Ativo (apenas no modo edição) -->
		<UiFormField
			v-if="isEditMode"
			label="Status da Categoria"
			help="Categorias inativas não aparecem no cardápio público"
		>
			<UiCheckbox
				v-model="formData.ativo"
				label="Categoria ativa"
				:disabled="loading"
				color="primary"
			/>
		</UiFormField>
	</form>
</template>
