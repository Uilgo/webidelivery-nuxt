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
import PromocaoFields from "../../../cardapio/components/shared/PromocaoFields.vue";

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

// Campos de promoção
const em_promocao = ref(false);
const promocao_tipo = ref<"percentual" | "valor_fixo">("percentual");
const promocao_valor = ref<number>(0);
const promocao_inicio = ref<string | null>(null);
const promocao_fim = ref<string | null>(null);

// Campos de divisão de sabores (não estão no schema VeeValidate, usar ref simples)
const permite_divisao_sabores = ref<boolean>(false);
const max_sabores_divisao = ref<number>(2);

/**
 * Computed para validação geral do formulário
 */
const isFormValid = computed(() => meta.value.valid);

/**
 * Submit com validação automática
 */
const onSubmit = handleSubmit((values) => {
	// Preparar dados de promoção se estiver ativo
	const dadosPromocao = em_promocao.value
		? {
				em_promocao: true,
				promocao_tipo: promocao_tipo.value,
				promocao_valor: promocao_valor.value,
				promocao_inicio: promocao_inicio.value,
				promocao_fim: promocao_fim.value,
			}
		: {
				em_promocao: false,
				promocao_tipo: null,
				promocao_valor: null,
				promocao_inicio: null,
				promocao_fim: null,
			};

	// Adicionar campos de divisão de sabores
	const dadosDivisaoSabores = {
		permite_divisao_sabores: permite_divisao_sabores.value,
		max_sabores_divisao: max_sabores_divisao.value,
	};

	emit("submit", { ...values, ...dadosPromocao, ...dadosDivisaoSabores });
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

			// Atualizar campos de promoção
			em_promocao.value = newData.em_promocao ?? false;
			if (newData.em_promocao) {
				promocao_tipo.value =
					(newData.promocao_tipo as "percentual" | "valor_fixo") || "percentual";
				promocao_valor.value = newData.promocao_valor || 0;
				promocao_inicio.value = newData.promocao_inicio || null;
				promocao_fim.value = newData.promocao_fim || null;
			}

			// Atualizar campos de divisão de sabores
			permite_divisao_sabores.value = newData.permite_divisao_sabores ?? false;
			max_sabores_divisao.value = newData.max_sabores_divisao ?? 2;
		}
	},
	{ immediate: true }, // ✅ IMPORTANTE: executar imediatamente na montagem
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

		<!-- Promoção -->
		<div class="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 space-y-4">
			<!-- Header com Toggle -->
			<div class="flex items-center justify-between">
				<div class="flex-1">
					<h3 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
						Categoria em Promoção
					</h3>
					<p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
						Aplicar desconto em todos os produtos desta categoria
					</p>
				</div>
				<UiSwitch v-model="em_promocao" :disabled="loading" />
			</div>

			<!-- Campos de Promoção (aparecem quando toggle está ativo) -->
			<div v-if="em_promocao" class="pt-2 border-t border-neutral-200 dark:border-neutral-800">
				<PromocaoFields
					:model-value="{
						tipo: promocao_tipo,
						valor: promocao_valor,
						inicio: promocao_inicio,
						fim: promocao_fim,
					}"
					@update:model-value="
						(value) => {
							promocao_tipo = value.tipo;
							promocao_valor = value.valor;
							promocao_inicio = value.inicio;
							promocao_fim = value.fim;
						}
					"
				/>
			</div>
		</div>

		<!-- Card Informativo sobre Promoção em Categoria -->
		<div
			class="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
		>
			<div class="flex gap-3">
				<Icon
					name="lucide:info"
					class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
				/>
				<div class="space-y-2">
					<h4 class="text-sm font-medium text-blue-900 dark:text-blue-100">
						Por que criar promoção em categoria?
					</h4>
					<p class="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
						Ao ativar promoção em uma categoria, <strong>todos os produtos</strong> dela receberão o
						desconto automaticamente. Isso é ideal para:
					</p>
					<ul class="text-xs text-blue-700 dark:text-blue-300 space-y-1 ml-4 list-disc">
						<li><strong>Campanhas sazonais:</strong> "Todas as bebidas com 20% OFF no verão"</li>
						<li>
							<strong>Liquidação de estoque:</strong> Descontos em toda categoria de sobremesas
						</li>
						<li>
							<strong>Economia de tempo:</strong> Aplica desconto em dezenas de produtos de uma vez
						</li>
						<li>
							<strong>Consistência:</strong> Garante que todos os itens da categoria tenham o mesmo
							desconto
						</li>
					</ul>
					<p class="text-xs text-blue-600 dark:text-blue-400 italic mt-2">
						💡 Dica: Promoções em categoria são aplicadas automaticamente a produtos novos
						adicionados nela.
					</p>
				</div>
			</div>
		</div>

		<!-- Divisão de Sabores -->
		<div class="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 space-y-4">
			<!-- Header com Toggle -->
			<div class="flex items-center justify-between">
				<div class="flex-1">
					<h3 class="text-sm font-medium text-neutral-900 dark:text-neutral-100">
						Permite dividir sabores?
					</h3>
					<p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
						Ideal para pizzas e produtos similares. Todos os produtos desta categoria herdarão essa
						configuração.
					</p>
				</div>
				<UiSwitch v-model="permite_divisao_sabores" :disabled="loading" />
			</div>

			<!-- Quantidade de sabores (só aparece se ativado) -->
			<div
				v-if="permite_divisao_sabores"
				class="pt-2 border-t border-neutral-200 dark:border-neutral-800"
			>
				<label class="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-3">
					Quantos sabores podem ser divididos?
				</label>
				<div class="flex gap-2">
					<UiButton
						type="button"
						:variant="max_sabores_divisao === 2 ? 'solid' : 'outline'"
						size="sm"
						:disabled="loading"
						@click="max_sabores_divisao = 2"
					>
						2 sabores
					</UiButton>
					<UiButton
						type="button"
						:variant="max_sabores_divisao === 3 ? 'solid' : 'outline'"
						size="sm"
						:disabled="loading"
						@click="max_sabores_divisao = 3"
					>
						3 sabores
					</UiButton>
					<UiButton
						type="button"
						:variant="max_sabores_divisao === 4 ? 'solid' : 'outline'"
						size="sm"
						:disabled="loading"
						@click="max_sabores_divisao = 4"
					>
						4 sabores
					</UiButton>
				</div>
			</div>
		</div>

		<!-- Card Informativo sobre Divisão de Sabores -->
		<div
			class="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4"
		>
			<div class="flex gap-3">
				<Icon
					name="lucide:info"
					class="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5"
				/>
				<div class="space-y-2">
					<h4 class="text-sm font-medium text-purple-900 dark:text-purple-100">
						Como funciona a divisão de sabores?
					</h4>
					<p class="text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
						Ao ativar divisão de sabores na categoria, <strong>todos os produtos</strong> dela
						permitirão que o cliente escolha múltiplos sabores. Exemplos:
					</p>
					<ul class="text-xs text-purple-700 dark:text-purple-300 space-y-1 ml-4 list-disc">
						<li><strong>Pizzas:</strong> Meia Calabresa, meia Margherita</li>
						<li><strong>Açaí:</strong> Metade com morango, metade com banana</li>
						<li><strong>Esfihas:</strong> 3 sabores diferentes no mesmo pedido</li>
					</ul>
					<p class="text-xs text-purple-600 dark:text-purple-400 italic mt-2">
						💡 Dica: Produtos individuais podem sobrescrever essa configuração se necessário.
					</p>
				</div>
			</div>
		</div>
	</form>
</template>
