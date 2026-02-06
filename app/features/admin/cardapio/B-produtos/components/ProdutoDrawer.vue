<script setup lang="ts">
/**
 * 📌 ProdutoDrawer
 *
 * Drawer unificado para criação e edição de produtos.
 * Usa prop isEdicao para determinar o modo (true = edição, false = criação).
 */

import type { ProdutoComputado } from "../../../types/produto";
import { useProdutosActions } from "../composables/useProdutosActions";
import { useToast } from "~/composables/ui/useToast";
import ProdutoForm from "./ProdutoForm.vue";

// Props do componente
interface Props {
	modelValue: boolean;
	isEdicao: boolean;
	produto?: ProdutoComputado | null;
}

const props = withDefaults(defineProps<Props>(), {
	produto: null,
});

// Emits tipados
interface Emits {
	"update:modelValue": [value: boolean];
	success: [action: "create" | "update", produto?: ProdutoComputado];
}

const emit = defineEmits<Emits>();

// Composables
const { create: createProduto, update: updateProduto, creating, updating } = useProdutosActions();
const { add: showToast } = useToast();

// Loading state combinado
const isLoading = computed(() => creating.value || updating.value);

// Ref para o formulário
const produtoFormRef = ref();

// Título dinâmico baseado no modo
const titulo = computed(() => {
	return props.isEdicao ? "Editar Produto" : "Criar Produto";
});

// Handler para fechar o drawer
const fecharDrawer = (): void => {
	emit("update:modelValue", false);
};

// Handler para submit do formulário
const handleSubmit = async (dadosFormulario: unknown): Promise<void> => {
	try {
		const formData = dadosFormulario as {
			nome: string;
			descricao: string;
			categoria_id: string;
			imagem_url: string;
			ativo: boolean;
			destaque: boolean;
			em_promocao: boolean;
			variacoes: Array<{
				nome: string;
				preco: number;
				preco_promocional: number | null;
			}>;
			grupos_adicionais_ids: string[];
		};

		if (props.isEdicao && props.produto) {
			// Atualizar produto existente
			const success = await updateProduto(props.produto.id, formData);
			if (success) {
				showToast({
					title: "Produto atualizado!",
					description: `${formData.nome} foi atualizado com sucesso.`,
				});
				emit("success", "update", props.produto);
			} else {
				throw new Error("Falha ao atualizar produto");
			}
		} else {
			// Criar novo produto
			const produtoId = await createProduto(formData);
			if (produtoId) {
				showToast({
					title: "Produto criado!",
					description: `${formData.nome} foi criado com sucesso.`,
				});
				emit("success", "create");
			} else {
				throw new Error("Falha ao criar produto");
			}
		}

		// Fechar drawer após sucesso
		fecharDrawer();
	} catch (error: unknown) {
		console.error("Erro ao salvar produto:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Ocorreu um erro inesperado. Tente novamente.";
		showToast({
			title: "Erro ao salvar produto",
			description: errorMessage,
			color: "error",
		});
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
		<ProdutoForm
			ref="produtoFormRef"
			:produto="produto"
			:is-edicao="isEdicao"
			@submit="handleSubmit"
		/>

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
					@click="() => produtoFormRef?.handleSubmit()"
				>
					{{ isEdicao ? "Atualizar" : "Salvar" }}
				</UiButton>
			</div>
		</template>
	</UiDrawer>
</template>
