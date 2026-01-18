<script setup lang="ts">
/**
 * 📌 ProdutoForm
 *
 * Formulário unificado para criação e edição de produtos.
 * Suporta variações, grupos de adicionais e upload de imagem.
 */

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
	submit: [data: FormData];
}

interface FormData {
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
}

const emit = defineEmits<Emits>();

// Composables
const { categorias } = useCategoriasFetch();
const { gruposAdicionais } = useGruposAdicionaisFetch();

// Estado do formulário
const form = reactive({
	nome: "",
	descricao: "",
	categoria_id: "",
	imagem_url: "",
	ativo: true,
	destaque: false,
	em_promocao: false,
	variacoes: [
		{
			id: undefined as string | undefined,
			nome: "Padrão",
			preco: 0,
			preco_promocional: null as number | null,
		},
	],
	grupos_adicionais_ids: [] as string[],
});

// Estado de erros
const errors = reactive({
	nome: "",
	categoria_id: "",
	variacoes: "",
});

// Opções para o select de categorias
const categoriaOptions = computed(() => {
	return categorias.value.map((categoria: CategoriaComputada) => ({
		value: categoria.id,
		label: categoria.nome,
	}));
});

// Inicializar formulário com dados do produto (edição)
const inicializarFormulario = (): void => {
	if (props.produto && props.isEdicao) {
		form.nome = props.produto.nome;
		form.descricao = props.produto.descricao || "";
		form.categoria_id = props.produto.categoria_id;
		form.imagem_url = props.produto.imagem_url || "";
		form.ativo = props.produto.ativo;
		form.destaque = props.produto.destaque;
		form.em_promocao = props.produto.em_promocao;

		// Carregar variações se existirem
		if (props.produto.variacoes && props.produto.variacoes.length > 0) {
			form.variacoes = props.produto.variacoes.map((v) => ({
				id: v.id, // Mantém o ID para update inteligente
				nome: v.nome,
				preco: Number(v.preco),
				preco_promocional: v.preco_promocional ? Number(v.preco_promocional) : null,
			}));
		} else {
			form.variacoes = [
				{
					id: undefined,
					nome: "Padrão",
					preco: 0,
					preco_promocional: null,
				},
			];
		}

		// Carregar grupos de adicionais selecionados
		if (props.produto.grupos_adicionais && props.produto.grupos_adicionais.length > 0) {
			form.grupos_adicionais_ids = props.produto.grupos_adicionais.map((g) => g.grupo_adicional_id);
		} else {
			form.grupos_adicionais_ids = [];
		}
	} else {
		// Reset para criação
		form.nome = "";
		form.descricao = "";
		form.categoria_id = "";
		form.imagem_url = "";
		form.ativo = true;
		form.destaque = false;
		form.em_promocao = false;
		form.variacoes = [
			{
				id: undefined,
				nome: "Padrão",
				preco: 0,
				preco_promocional: null,
			},
		];
		form.grupos_adicionais_ids = [];
	}
};

// Adicionar nova variação
const adicionarVariacao = (): void => {
	form.variacoes.push({
		id: undefined, // Nova variação não tem ID
		nome: "",
		preco: 0,
		preco_promocional: null,
	});
};

// Remover variação
const removerVariacao = (index: number): void => {
	if (form.variacoes.length > 1) {
		form.variacoes.splice(index, 1);
	}
};

// Validar formulário
const validarFormulario = (): boolean => {
	// Reset erros
	errors.nome = "";
	errors.categoria_id = "";
	errors.variacoes = "";

	let isValid = true;

	// Validar nome
	if (!form.nome.trim()) {
		errors.nome = "Nome é obrigatório";
		isValid = false;
	} else if (form.nome.trim().length < 3) {
		errors.nome = "Nome deve ter pelo menos 3 caracteres";
		isValid = false;
	}

	// Validar categoria
	if (!form.categoria_id) {
		errors.categoria_id = "Categoria é obrigatória";
		isValid = false;
	}

	// Validar variações
	const variacoesValidas = form.variacoes.filter((v) => v.nome.trim() && v.preco > 0);

	if (variacoesValidas.length === 0) {
		errors.variacoes = "Pelo menos uma variação com nome e preço é obrigatória";
		isValid = false;
	}

	return isValid;
};

// Handler do submit
const handleSubmit = (): void => {
	if (!validarFormulario()) {
		return;
	}

	// Preparar dados para envio
	const dadosParaEnvio: FormData = {
		...form,
		variacoes: form.variacoes.filter((v) => v.nome.trim() && v.preco > 0),
	};

	emit("submit", dadosParaEnvio);
};

// Watchers
watch(
	() => props.produto,
	() => {
		inicializarFormulario();
	},
	{ immediate: true },
);

// Inicializar ao montar
onMounted(() => {
	inicializarFormulario();
});

// Expor método handleSubmit para o componente pai
defineExpose({
	handleSubmit,
});
</script>

<template>
	<form class="space-y-6" @submit.prevent="handleSubmit">
		<!-- Seção Básica -->
		<div class="space-y-5">
			<h3
				class="text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border-muted)] pb-3"
			>
				Informações Básicas
			</h3>

			<!-- Nome -->
			<div>
				<label for="nome" class="block text-sm font-medium text-[var(--text-primary)] mb-2">
					Nome do Produto *
				</label>
				<UiInput
					id="nome"
					v-model="form.nome"
					placeholder="Ex: Pizza Margherita"
					:error="errors.nome ? true : undefined"
					required
				/>
			</div>

			<!-- Categoria -->
			<div>
				<UiSelectMenu
					id="categoria"
					v-model="form.categoria_id"
					:options="categoriaOptions"
					label="Categoria *"
					placeholder="Selecione uma categoria"
					:error-message="errors.categoria_id"
					:required="true"
					searchable
				/>
			</div>

			<!-- Descrição -->
			<div>
				<label for="descricao" class="block text-sm font-medium text-[var(--text-primary)] mb-2">
					Descrição
				</label>
				<UiTextarea
					id="descricao"
					v-model="form.descricao"
					placeholder="Descreva os ingredientes e características do produto..."
					:rows="3"
				/>
			</div>

			<!-- Upload de Imagem -->
			<div>
				<label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
					Imagem do Produto
				</label>
				<UiPictureUpload
					v-model="form.imagem_url"
					:preview="form.imagem_url"
					placeholder="Adicione uma imagem do produto"
				/>
			</div>
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
						<UiSwitch id="ativo" v-model="form.ativo" />
					</div>
				</div>

				<!-- Destaque -->
				<div class="p-4 bg-[var(--bg-muted)] rounded-lg">
					<label for="destaque" class="block text-sm font-medium text-[var(--text-primary)] mb-3">
						Em Destaque
					</label>
					<div class="flex items-center justify-between">
						<p class="text-xs text-[var(--text-muted)]">Aparece em destaque</p>
						<UiSwitch id="destaque" v-model="form.destaque" />
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
						<UiSwitch id="em_promocao" v-model="form.em_promocao" />
					</div>
				</div>
			</div>
		</div>

		<!-- Seção Variações -->
		<div class="p-6 bg-[var(--card-bg)] border border-[var(--border-default)] rounded-lg">
			<div class="flex items-center justify-between mb-4">
				<h3 class="text-base font-semibold text-[var(--text-primary)]">Variações e Preços</h3>
				<UiButton type="button" variant="outline" size="sm" @click="adicionarVariacao">
					<Icon name="lucide:plus" class="w-4 h-4 mr-1.5" />
					Adicionar
				</UiButton>
			</div>

			<!-- Container com scroll -->
			<div class="max-h-[400px] overflow-y-auto overflow-x-hidden custom-scrollbar pr-1">
				<div class="space-y-3">
					<div
						v-for="(variacao, index) in form.variacoes"
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
								<UiInput
									v-model.number="variacao.preco"
									type="number"
									step="0.01"
									min="0"
									placeholder="0,00"
									required
								/>
							</div>

							<!-- Preço Promocional -->
							<div v-if="form.em_promocao" class="w-32">
								<label class="block text-xs font-medium text-[var(--text-primary)] mb-1.5">
									Preço Promo
								</label>
								<UiInput
									:model-value="variacao.preco_promocional ?? undefined"
									type="number"
									step="0.01"
									min="0"
									placeholder="0,00"
									@update:model-value="variacao.preco_promocional = $event ? Number($event) : null"
								/>
							</div>

							<!-- Botão Remover -->
							<UiButton
								type="button"
								variant="ghost"
								size="sm"
								:disabled="form.variacoes.length === 1"
								class="flex items-center justify-center h-10 w-10 flex-shrink-0"
								@click="removerVariacao(index)"
							>
								<Icon name="lucide:trash-2" class="w-4 h-4" />
							</UiButton>
						</div>
					</div>
				</div>
			</div>

			<p v-if="errors.variacoes" class="text-xs text-red-600 mt-2">
				{{ errors.variacoes }}
			</p>
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
					v-model="form.grupos_adicionais_ids"
					:value="grupo.id"
					:label="grupo.nome"
					class="p-3.5 bg-[var(--bg-muted)] rounded-lg border border-[var(--border-muted)] hover:border-[var(--border-strong)] transition-colors duration-200"
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
