<script setup lang="ts">
/**
 * 📌 ProdutoForm
 *
 * Formulário unificado para criação e edição de produtos.
 * Usa VeeValidate + Zod para validação tipada e consistente.
 * Suporta variações, grupos de adicionais e upload de imagem.
 */

import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import {
	createProdutoSchema,
	updateProdutoSchema,
	type CreateProdutoFormData,
	type UpdateProdutoFormData,
} from "#shared/schemas/cardapio/produto";
import type { ProdutoComputado } from "../../../types/produto";
import type { CategoriaComputada } from "../../../types/categoria";
import { useCategoriasFetch } from "../../A-categorias/composables/useCategoriasFetch";
import { useGruposAdicionaisFetch } from "../../C-adicionais/composables/useGruposAdicionaisFetch";

// Props do componente
interface Props {
	produto?: ProdutoComputado | null;
	isEdicao: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	produto: null,
});

// Emits tipados
interface Emits {
	submit: [data: CreateProdutoFormData | UpdateProdutoFormData];
}

const emit = defineEmits<Emits>();

// Composables
const { categorias } = useCategoriasFetch();
const { gruposAdicionais } = useGruposAdicionaisFetch();

/**
 * Escolhe o schema baseado no modo
 */
const validationSchema = computed(() =>
	props.isEdicao ? toTypedSchema(updateProdutoSchema) : toTypedSchema(createProdutoSchema),
);

/**
 * Valores iniciais do formulário
 */
const getInitialValues = () => {
	if (props.produto && props.isEdicao) {
		return {
			nome: props.produto.nome || "",
			descricao: props.produto.descricao || "",
			categoria_id: props.produto.categoria_id || "",
			imagem_url: props.produto.imagem_url || "",
			ativo: props.produto.ativo ?? true,
			destaque: props.produto.destaque ?? false,
			em_promocao: props.produto.em_promocao ?? false,
		};
	}

	return {
		nome: "",
		descricao: "",
		categoria_id: "",
		imagem_url: "",
		variacoes: [
			{
				nome: "Padrão",
				preco: 0,
				preco_promocional: null,
			},
		],
		grupos_adicionais_ids: [],
		ativo: true,
		destaque: false,
		em_promocao: false,
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
const [categoria_id, categoriaIdAttrs] = defineField("categoria_id");
const [imagem_url, imagemUrlAttrs] = defineField("imagem_url", { validateOnModelUpdate: false });
const [ativo] = defineField("ativo");
const [destaque] = defineField("destaque");
const [em_promocao] = defineField("em_promocao");

// Campos que só existem no modo criação - usar ref simples no modo edição
const grupos_adicionais_ids = ref<string[]>([]);

/**
 * Field Array para variações (apenas no modo criação)
 */
const variacoes = ref<Array<{ nome: string; preco: number; preco_promocional: number | null }>>([]);
const adicionarVariacao = (value: {
	nome: string;
	preco: number;
	preco_promocional: number | null;
}) => {
	variacoes.value.push(value);
};
const removerVariacao = (index: number) => {
	variacoes.value.splice(index, 1);
};

// Opções para o select de categorias
const categoriaOptions = computed(() => {
	return categorias.value.map((categoria: CategoriaComputada) => ({
		value: categoria.id,
		label: categoria.nome,
	}));
});

/**
 * Submit com validação automática
 */
const onSubmit = handleSubmit((formValues) => {
	// No modo criação, adicionar variacoes e grupos_adicionais_ids manualmente
	if (!props.isEdicao) {
		const variacoesValidas = variacoes.value.filter(
			(v: { nome: string; preco: number }) => v.nome.trim() && v.preco > 0,
		);
		const dataComVariacoes = {
			...formValues,
			variacoes: variacoesValidas,
			grupos_adicionais_ids: grupos_adicionais_ids.value,
		};
		emit("submit", dataComVariacoes as CreateProdutoFormData);
	} else {
		emit("submit", formValues);
	}
});

/**
 * Watch para resetar form quando produto mudar
 */
watch(
	() => props.produto,
	(newData) => {
		if (newData && props.isEdicao) {
			resetForm({
				values: {
					nome: newData.nome || "",
					descricao: newData.descricao || "",
					categoria_id: newData.categoria_id || "",
					imagem_url: newData.imagem_url || "",
					ativo: newData.ativo ?? true,
					destaque: newData.destaque ?? false,
					em_promocao: newData.em_promocao ?? false,
				},
			});
		} else if (newData && !props.isEdicao) {
			// No modo criação, atualizar variacoes e grupos manualmente
			if (newData.variacoes && newData.variacoes.length > 0) {
				variacoes.value = newData.variacoes.map((v) => ({
					nome: v.nome,
					preco: Number(v.preco),
					preco_promocional: v.preco_promocional ? Number(v.preco_promocional) : null,
				}));
			}
			if (newData.grupos_adicionais && newData.grupos_adicionais.length > 0) {
				grupos_adicionais_ids.value = newData.grupos_adicionais.map((g) => g.grupo_adicional_id);
			}
		}
	},
);

/**
 * Expor método handleSubmit para o componente pai
 */
defineExpose({
	handleSubmit: onSubmit,
	isFormValid: computed(() => meta.value.valid),
});
</script>

<template>
	<form class="space-y-6" @submit.prevent="onSubmit">
		<!-- Seção Básica -->
		<div class="space-y-5">
			<h3
				class="text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border-muted)] pb-3"
			>
				Informações Básicas
			</h3>

			<!-- Nome -->
			<UiFormField
				label="Nome do Produto"
				:error="errors.nome"
				help="Nome que aparecerá no cardápio"
				required
			>
				<UiInput
					v-model="nome"
					v-bind="nomeAttrs"
					placeholder="Ex: Pizza Margherita"
					:error="!!errors.nome"
					maxlength="100"
				/>
			</UiFormField>

			<!-- Categoria -->
			<UiSelectMenu
				v-model="categoria_id"
				v-bind="categoriaIdAttrs"
				:options="categoriaOptions"
				label="Categoria *"
				placeholder="Selecione uma categoria"
				:error-message="errors.categoria_id"
				:required="true"
				searchable
			/>

			<!-- Descrição -->
			<UiFormField label="Descrição" :error="errors.descricao">
				<UiTextarea
					:model-value="descricao ?? ''"
					v-bind="descricaoAttrs"
					placeholder="Descreva os ingredientes e características do produto..."
					:rows="3"
					:max-length="1000"
					@update:model-value="descricao = $event"
				/>
			</UiFormField>

			<!-- Upload de Imagem -->
			<UiFormField label="Imagem do Produto" :error="errors.imagem_url">
				<UiPictureUpload
					:model-value="imagem_url ?? ''"
					v-bind="imagemUrlAttrs"
					placeholder="Adicione uma imagem do produto"
					@update:model-value="imagem_url = $event"
				/>
			</UiFormField>
		</div>

		<!-- Seção Configurações -->
		<div class="p-6 bg-[var(--card-bg)] border border-[var(--border-default)] rounded-lg">
			<h3 class="text-base font-semibold text-[var(--text-primary)] mb-4">Configurações</h3>

			<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
				<!-- Ativo -->
				<div class="p-4 bg-[var(--bg-muted)] rounded-lg">
					<label for="ativo" class="block text-sm font-medium text-[var(--text-primary)] mb-3">
						Produto Ativo
					</label>
					<div class="flex items-center justify-between">
						<p class="text-xs text-[var(--text-muted)]">Visível no cardápio</p>
						<UiSwitch
							id="ativo"
							:model-value="ativo ?? true"
							@update:model-value="ativo = $event"
						/>
					</div>
				</div>

				<!-- Destaque -->
				<div class="p-4 bg-[var(--bg-muted)] rounded-lg">
					<label for="destaque" class="block text-sm font-medium text-[var(--text-primary)] mb-3">
						Em Destaque
					</label>
					<div class="flex items-center justify-between">
						<p class="text-xs text-[var(--text-muted)]">Aparece em destaque</p>
						<UiSwitch
							id="destaque"
							:model-value="destaque ?? false"
							@update:model-value="destaque = $event"
						/>
					</div>
				</div>

				<!-- Promoção -->
				<div class="p-4 bg-[var(--bg-muted)] rounded-lg">
					<label
						for="em_promocao"
						class="block text-sm font-medium text-[var(--text-primary)] mb-3"
					>
						Em Promoção
					</label>
					<div class="flex items-center justify-between">
						<p class="text-xs text-[var(--text-muted)]">Preço promocional</p>
						<UiSwitch
							id="em_promocao"
							:model-value="em_promocao ?? false"
							@update:model-value="em_promocao = $event"
						/>
					</div>
				</div>
			</div>
		</div>

		<!-- Seção Variações (apenas no modo criação) -->
		<div
			v-if="!isEdicao"
			class="p-6 bg-[var(--card-bg)] border border-[var(--border-default)] rounded-lg"
		>
			<div class="flex items-center justify-between mb-4">
				<h3 class="text-base font-semibold text-[var(--text-primary)]">Variações e Preços</h3>
				<UiButton
					type="button"
					variant="outline"
					size="sm"
					@click="adicionarVariacao({ nome: '', preco: 0, preco_promocional: null })"
				>
					<Icon name="lucide:plus" class="w-4 h-4 mr-1.5" />
					Adicionar
				</UiButton>
			</div>

			<!-- Container com scroll -->
			<div class="max-h-[400px] overflow-y-auto overflow-x-hidden custom-scrollbar pr-1">
				<div class="space-y-3">
					<div
						v-for="(variacao, index) in variacoes"
						:key="index"
						class="p-4 bg-[var(--bg-muted)] rounded-lg border border-[var(--border-muted)]"
					>
						<div class="flex items-end gap-3">
							<!-- Nome da Variação -->
							<div class="flex-1 min-w-0">
								<label class="block text-xs font-medium text-[var(--text-primary)] mb-1.5">
									Nome da Variação *
								</label>
								<UiInput
									v-model="variacao.nome"
									placeholder="Ex: Pequena, Média, Grande"
									required
								/>
							</div>

							<!-- Preço -->
							<div class="w-32">
								<label class="block text-xs font-medium text-[var(--text-primary)] mb-1.5">
									Preço *
								</label>
								<UiCurrencyInput
									:model-value="variacao.preco"
									placeholder="0,00"
									size="sm"
									required
									@update:model-value="variacao.preco = $event"
								/>
							</div>

							<!-- Preço Promocional -->
							<div v-if="em_promocao" class="w-32">
								<label class="block text-xs font-medium text-[var(--text-primary)] mb-1.5">
									Preço Promo
								</label>
								<UiCurrencyInput
									:model-value="variacao.preco_promocional ?? 0"
									placeholder="0,00"
									size="sm"
									@update:model-value="variacao.preco_promocional = $event || null"
								/>
							</div>

							<!-- Botão Remover -->
							<UiButton
								type="button"
								variant="ghost"
								size="sm"
								:disabled="variacoes.length === 1"
								class="flex items-center justify-center h-10 w-10 flex-shrink-0"
								@click="removerVariacao(index)"
							>
								<Icon name="lucide:trash-2" class="w-4 h-4" />
							</UiButton>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Seção Adicionais -->
		<div class="p-6 bg-[var(--card-bg)] border border-[var(--border-default)] rounded-lg">
			<h3 class="text-base font-semibold text-[var(--text-primary)] mb-2">Grupos de Adicionais</h3>
			<p class="text-xs text-[var(--text-muted)] mb-4">
				Selecione os grupos de adicionais disponíveis para este produto
			</p>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
				<UiCheckbox
					v-for="grupo in gruposAdicionais"
					:key="grupo.id"
					:model-value="grupos_adicionais_ids"
					:value="grupo.id"
					:label="grupo.nome"
					class="p-3.5 bg-[var(--bg-muted)] rounded-lg border border-[var(--border-muted)] hover:border-[var(--border-strong)] transition-colors duration-200"
					@update:model-value="grupos_adicionais_ids = $event as string[]"
				/>
			</div>
		</div>
	</form>
</template>

<style scoped>
/* Scrollbar customizada para a seção de variações */
.custom-scrollbar {
	scrollbar-width: thin;
	scrollbar-color: var(--border-muted) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
	width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
	background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
	background-color: var(--border-muted);
	border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
	background-color: var(--border-default);
}
</style>
