<script setup lang="ts">
/**
 * 📌 ComboForm
 *
 * Formulário unificado para criação e edição de combos.
 * Campos: nome, descrição, imagem, preços, período de validade, configurações.
 */

import type { Combo, ComboProdutoInput } from "../../../types/combo";
import { useProdutosFetch } from "../../B-produtos/composables/useProdutosFetch";

// Supabase client
const supabase = useSupabaseClient();

// Buscar produtos disponíveis
const { produtos: produtosDisponiveis, fetch: fetchProdutos } = useProdutosFetch();

// Props do componente
interface Props {
	combo?: Combo | null;
	isEdicao: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	combo: null,
});

// Emits tipados
interface Emits {
	submit: [data: FormData];
}

interface FormData {
	nome: string;
	descricao: string;
	imagem_url: string;
	preco_combo: number;
	preco_original: number;
	destaque: boolean;
	ativo: boolean;
	data_inicio: string;
	data_fim: string;
	produtos: ComboProdutoInput[];
}

const emit = defineEmits<Emits>();

// Estado do formulário
const form = reactive({
	nome: "",
	descricao: "",
	imagem_url: "",
	preco_combo: 0,
	preco_original: 0,
	destaque: false,
	ativo: true,
	data_inicio: "",
	data_fim: "",
	produtos: [] as ComboProdutoInput[],
	tipo_desconto: "valor" as "valor" | "percentual", // novo campo
	desconto_percentual: 0, // novo campo
});

// Estado de erros
const errors = reactive({
	nome: "",
	imagem_url: "",
	preco_combo: "",
	data_fim: "",
});

// Computed para economia
const economia = computed(() => {
	if (form.preco_original > 0 && form.preco_combo > 0) {
		const diff = form.preco_original - form.preco_combo;
		const percent = (diff / form.preco_original) * 100;
		return {
			valor: diff,
			percentual: percent,
		};
	}
	return { valor: 0, percentual: 0 };
});

// Computed para calcular preço original automaticamente
const precoOriginalCalculado = computed(() => {
	if (form.produtos.length === 0) return 0;

	const total = form.produtos.reduce((acc, produtoCombo) => {
		const produto = produtosDisponiveis.value.find((p) => p.id === produtoCombo.produto_id);

		if (!produto) {
			return acc;
		}

		// Verificar se tem variações
		if (!produto.variacoes || produto.variacoes.length === 0) {
			return acc;
		}

		// Pega o preço da primeira variação
		const preco = produto.variacoes[0]?.preco;

		// Converter para número se for string
		const precoNumerico = typeof preco === "string" ? parseFloat(preco) : preco || 0;

		return acc + precoNumerico * produtoCombo.quantidade;
	}, 0);

	return total;
});

// Atualizar form.preco_original quando produtos mudarem
watch(
	() => form.produtos,
	() => {
		form.preco_original = precoOriginalCalculado.value;
		// Limpar erro quando produtos mudarem
		errors.preco_combo = "";
	},
	{ deep: true },
);

// Recalcular preço original quando produtos disponíveis forem carregados
watch(
	() => produtosDisponiveis.value,
	() => {
		// Só recalcula se já tem produtos selecionados
		if (form.produtos.length > 0) {
			form.preco_original = precoOriginalCalculado.value;
		}
	},
	{ deep: true },
);

// Calcular preço do combo quando desconto percentual mudar
watch(
	() => form.desconto_percentual,
	(novoDesconto) => {
		if (form.tipo_desconto === "percentual" && form.preco_original > 0) {
			const desconto = (form.preco_original * novoDesconto) / 100;
			form.preco_combo = form.preco_original - desconto;
		}
		// Limpar erro quando desconto mudar
		errors.preco_combo = "";
	},
);

// Recalcular preço do combo quando tipo de desconto mudar
watch(
	() => form.tipo_desconto,
	(novoTipo) => {
		if (novoTipo === "percentual" && form.desconto_percentual > 0) {
			const desconto = (form.preco_original * form.desconto_percentual) / 100;
			form.preco_combo = form.preco_original - desconto;
		}
		// Limpar erro quando tipo mudar
		errors.preco_combo = "";
	},
);

// Validar preço do combo em tempo real (CDC Art. 39, V)
watch(
	() => form.preco_combo,
	(novoPreco) => {
		if (
			form.tipo_desconto === "valor" &&
			novoPreco > form.preco_original &&
			form.preco_original > 0
		) {
			errors.preco_combo =
				"Preço do combo não pode ser maior que o preço original (CDC Art. 39, V - prática abusiva)";
		} else if (novoPreco <= 0) {
			errors.preco_combo = "Preço do combo deve ser maior que zero";
		} else {
			errors.preco_combo = "";
		}
	},
);

// Computed para formatar produtos para o SelectMenu
const produtosOptions = computed(() => {
	return produtosDisponiveis.value.map((produto) => ({
		label: produto.nome,
		value: produto.id,
		description: produto.categoria_nome || undefined,
		icon: "lucide:package",
	}));
});

// Computed para sincronizar SelectMenu com form.produtos
const produtosSelecionadosIds = computed({
	get: () => form.produtos.map((p) => p.produto_id),
	set: (ids: (string | number)[]) => {
		// Remover produtos que não estão mais selecionados
		form.produtos = form.produtos.filter((p) => ids.includes(p.produto_id));

		// Adicionar novos produtos selecionados
		ids.forEach((id) => {
			const existe = form.produtos.some((p) => p.produto_id === String(id));
			if (!existe) {
				form.produtos.push({
					produto_id: String(id),
					quantidade: 1,
				});
			}
		});
	},
});

// Inicializar formulário com dados do combo (edição)
const inicializarFormulario = async (): Promise<void> => {
	if (props.combo && props.isEdicao) {
		form.nome = props.combo.nome;
		form.descricao = props.combo.descricao || "";
		form.imagem_url = props.combo.imagem_url || "";
		form.preco_combo = Number(props.combo.preco_combo);
		form.preco_original = Number(props.combo.preco_original);
		form.destaque = props.combo.destaque;
		form.ativo = props.combo.ativo;
		form.data_inicio = props.combo.data_inicio || "";
		form.data_fim = props.combo.data_fim || "";

		// Carregar produtos do combo
		try {
			const { data: comboProdutos } = await supabase
				.from("combo_produtos")
				.select("produto_id, quantidade")
				.eq("combo_id", props.combo.id)
				.order("ordem");

			if (comboProdutos) {
				form.produtos = comboProdutos.map((cp) => ({
					produto_id: cp.produto_id,
					quantidade: cp.quantidade,
				}));
			}
		} catch {
			// Silenciar erro - produtos ficarão vazios
			form.produtos = [];
		}
	} else {
		// Reset para criação
		form.nome = "";
		form.descricao = "";
		form.imagem_url = "";
		form.preco_combo = 0;
		form.preco_original = 0;
		form.destaque = false;
		form.ativo = true;
		form.data_inicio = "";
		form.data_fim = "";
		form.produtos = [];
		form.tipo_desconto = "valor";
		form.desconto_percentual = 0;
	}
};

// Validar formulário
const validarFormulario = (): boolean => {
	// Reset erros
	errors.nome = "";
	errors.preco_combo = "";
	errors.data_fim = "";

	let isValid = true;

	// Validar nome
	if (!form.nome.trim()) {
		errors.nome = "Nome é obrigatório";
		isValid = false;
	} else if (form.nome.trim().length < 3) {
		errors.nome = "Nome deve ter pelo menos 3 caracteres";
		isValid = false;
	}

	// Validar que há produtos selecionados
	if (form.produtos.length === 0) {
		errors.preco_combo = "Selecione pelo menos um produto para o combo";
		isValid = false;
		return isValid;
	}

	// Validar preço do combo
	if (form.preco_combo <= 0) {
		errors.preco_combo = "Preço do combo deve ser maior que zero";
		isValid = false;
	}

	// Validar que preço do combo não é maior que o original
	// CDC Art. 39, V - É prática abusiva exigir vantagem manifestamente excessiva
	if (form.preco_combo > form.preco_original) {
		errors.preco_combo =
			"Preço do combo não pode ser maior que o preço original (CDC Art. 39, V - prática abusiva)";
		isValid = false;
	}

	// Validar datas
	if (form.data_inicio && form.data_fim) {
		if (new Date(form.data_fim) < new Date(form.data_inicio)) {
			errors.data_fim = "Data final deve ser posterior à data inicial";
			isValid = false;
		}
	}

	return isValid;
};

// ========================================
// GERENCIAMENTO DE PRODUTOS
// ========================================

// Remover produto do combo
const removerProduto = (produtoId: string): void => {
	const index = form.produtos.findIndex((p) => p.produto_id === produtoId);
	if (index !== -1) {
		form.produtos.splice(index, 1);
	}
};

// Atualizar quantidade de um produto
const atualizarQuantidade = (produtoId: string, quantidade: number): void => {
	const produto = form.produtos.find((p) => p.produto_id === produtoId);
	if (produto && quantidade > 0) {
		produto.quantidade = quantidade;
	}
};

// Handler do submit
const handleSubmit = (): void => {
	if (!validarFormulario()) {
		return;
	}

	emit("submit", { ...form });
};

// Watchers
watch(
	() => props.combo,
	() => {
		inicializarFormulario();
	},
	{ immediate: true },
);

// Inicializar ao montar
onMounted(async () => {
	// SEMPRE força fetch dos produtos para garantir que as variações estejam carregadas
	await fetchProdutos();

	// Inicializar formulário
	inicializarFormulario();

	// Aguardar próximo tick e forçar recálculo do preço original
	await nextTick();
	if (form.produtos.length > 0) {
		form.preco_original = precoOriginalCalculado.value;
	}
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
					Nome do Combo *
				</label>
				<UiInput
					id="nome"
					v-model="form.nome"
					placeholder="Ex: Combo Família, Combo Executivo"
					:error="errors.nome ? true : undefined"
					required
				/>
				<p v-if="errors.nome" class="text-xs text-red-600 mt-1">{{ errors.nome }}</p>
			</div>

			<!-- Descrição -->
			<div>
				<label for="descricao" class="block text-sm font-medium text-[var(--text-primary)] mb-2">
					Descrição
				</label>
				<UiTextarea
					id="descricao"
					v-model="form.descricao"
					placeholder="Descreva o que está incluído no combo..."
					:rows="3"
				/>
			</div>

			<!-- Imagem do Combo -->
			<UiPictureUpload
				v-model="form.imagem_url"
				label="Imagem do Combo"
				hint="Imagem que será exibida no cardápio"
				:error="errors.imagem_url"
			/>
		</div>

		<!-- Seção Preços -->
		<div class="space-y-4">
			<h3
				class="text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border-muted)] pb-3"
			>
				Preços
			</h3>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<!-- Preço Original (calculado automaticamente) -->
				<div>
					<label
						for="preco_original"
						class="block text-sm font-medium text-[var(--text-primary)] mb-2"
					>
						Preço Original (Calculado)
					</label>
					<UiInput
						id="preco_original"
						:model-value="form.preco_original.toFixed(2)"
						type="text"
						disabled
						placeholder="0,00"
					/>
					<p class="text-xs text-[var(--text-muted)] mt-1">
						Soma automática dos produtos selecionados
					</p>
				</div>

				<!-- Tipo de Desconto -->
				<div>
					<label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
						Tipo de Desconto
					</label>
					<div class="flex gap-2">
						<button
							type="button"
							class="flex-1 px-4 py-2 rounded-lg border transition-colors"
							:class="
								form.tipo_desconto === 'valor'
									? 'bg-[var(--primary)] text-white border-[var(--primary)]'
									: 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-default)] hover:bg-[var(--bg-hover)]'
							"
							@click="form.tipo_desconto = 'valor'"
						>
							Valor Fixo
						</button>
						<button
							type="button"
							class="flex-1 px-4 py-2 rounded-lg border transition-colors"
							:class="
								form.tipo_desconto === 'percentual'
									? 'bg-[var(--primary)] text-white border-[var(--primary)]'
									: 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-default)] hover:bg-[var(--bg-hover)]'
							"
							@click="form.tipo_desconto = 'percentual'"
						>
							Desconto %
						</button>
					</div>
				</div>
			</div>

			<!-- Campo de Preço do Combo ou Desconto Percentual -->
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<!-- Preço do Combo (se tipo_desconto === 'valor') -->
				<div v-if="form.tipo_desconto === 'valor'">
					<label
						for="preco_combo"
						class="block text-sm font-medium text-[var(--text-primary)] mb-2"
					>
						Preço do Combo *
					</label>
					<UiCurrencyInput
						id="preco_combo"
						:model-value="form.preco_combo"
						placeholder="0,00"
						:error="errors.preco_combo ? true : undefined"
						@update:model-value="form.preco_combo = $event"
					/>
					<p v-if="errors.preco_combo" class="text-xs text-red-600 mt-1">
						{{ errors.preco_combo }}
					</p>
					<p v-else class="text-xs text-[var(--text-muted)] mt-1">
						Defina o preço final do combo (igual ou menor que o original)
					</p>
				</div>

				<!-- Desconto Percentual (se tipo_desconto === 'percentual') -->
				<div v-else>
					<label
						for="desconto_percentual"
						class="block text-sm font-medium text-[var(--text-primary)] mb-2"
					>
						Desconto Percentual *
					</label>
					<UiInput
						id="desconto_percentual"
						v-model.number="form.desconto_percentual"
						type="number"
						step="1"
						min="0"
						max="100"
						placeholder="0"
						:error="errors.preco_combo ? true : undefined"
					/>
					<p v-if="errors.preco_combo" class="text-xs text-red-600 mt-1">
						{{ errors.preco_combo }}
					</p>
				</div>

				<!-- Economia (quando em modo valor fixo) ou Preço Final (quando em modo percentual) -->
				<div v-if="form.tipo_desconto === 'valor'">
					<!-- Card de Economia (quando há desconto) -->
					<div
						v-if="economia.valor > 0"
						class="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg"
					>
						<div class="flex items-center gap-2">
							<Icon
								name="lucide:trending-down"
								class="w-5 h-5 text-green-600 dark:text-green-500"
							/>
							<div>
								<p class="text-sm font-medium text-green-900 dark:text-green-100">
									Economia de R$ {{ economia.valor.toFixed(2).replace(".", ",") }}
								</p>
								<p class="text-xs text-green-700 dark:text-green-300">
									{{ economia.percentual.toFixed(1) }}% de desconto
								</p>
							</div>
						</div>
					</div>

					<!-- Card Sem Desconto (quando preço combo = preço original) -->
					<div
						v-else-if="form.preco_combo === form.preco_original && form.preco_original > 0"
						class="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg"
					>
						<div class="flex items-center gap-2">
							<Icon name="lucide:info" class="w-5 h-5 text-blue-600 dark:text-blue-500" />
							<div>
								<p class="text-sm font-medium text-blue-900 dark:text-blue-100">Sem desconto</p>
								<p class="text-xs text-blue-700 dark:text-blue-300">
									Preço igual ao valor original
								</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Preço Final (modo percentual) -->
				<div v-else-if="form.tipo_desconto === 'percentual'">
					<label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
						Preço Final do Combo
					</label>
					<UiInput
						:model-value="'R$ ' + form.preco_combo.toFixed(2).replace('.', ',')"
						type="text"
						disabled
						placeholder="R$ 0,00"
					/>
					<p class="text-xs text-[var(--text-muted)] mt-1">Calculado automaticamente</p>
				</div>
			</div>
		</div>

		<!-- Seção Produtos do Combo -->
		<div class="space-y-4">
			<h3
				class="text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border-muted)] pb-3"
			>
				Produtos do Combo
			</h3>

			<!-- Select de produtos com múltipla seleção -->
			<UiSelectMenu
				v-model="produtosSelecionadosIds"
				:options="produtosOptions"
				label="Selecionar Produtos"
				placeholder="Escolha os produtos que farão parte do combo"
				search-placeholder="Buscar produtos..."
				:multiple="true"
				:searchable="true"
				:clearable="true"
				help-text="Selecione um ou mais produtos para compor o combo"
			/>

			<!-- Lista de produtos selecionados com quantidade -->
			<div v-if="form.produtos.length > 0" class="space-y-4">
				<p class="text-sm font-medium text-[var(--text-primary)]">Produtos Selecionados:</p>

				<!-- Card com scroll -->
				<div
					class="p-4 bg-[var(--card-bg)] border border-[var(--border-default)] rounded-lg max-h-[400px] overflow-y-auto custom-scrollbar"
				>
					<div class="flex flex-col gap-3">
						<div
							v-for="produtoCombo in form.produtos"
							:key="produtoCombo.produto_id"
							class="flex items-center gap-3 p-3 bg-[var(--bg-muted)] rounded-lg border border-[var(--border-default)]"
						>
							<!-- Ícone -->
							<Icon name="lucide:package" class="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" />

							<!-- Nome do produto -->
							<div class="flex-1 min-w-0">
								<p class="text-sm font-medium text-[var(--text-primary)] truncate">
									{{
										produtosDisponiveis.find((p) => p.id === produtoCombo.produto_id)?.nome ||
										"Produto"
									}}
								</p>
								<p class="text-xs text-[var(--text-muted)]">
									{{
										produtosDisponiveis.find((p) => p.id === produtoCombo.produto_id)
											?.categoria_nome || ""
									}}
								</p>
							</div>

							<!-- Controle de quantidade -->
							<div class="flex items-center gap-2">
								<button
									type="button"
									class="flex items-center justify-center w-7 h-7 rounded-md bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
									:disabled="produtoCombo.quantidade <= 1"
									@click="atualizarQuantidade(produtoCombo.produto_id, produtoCombo.quantidade - 1)"
								>
									<Icon name="lucide:minus" class="w-4 h-4" />
								</button>

								<span class="text-sm font-medium text-[var(--text-primary)] w-8 text-center">
									{{ produtoCombo.quantidade }}
								</span>

								<button
									type="button"
									class="flex items-center justify-center w-7 h-7 rounded-md bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
									@click="atualizarQuantidade(produtoCombo.produto_id, produtoCombo.quantidade + 1)"
								>
									<Icon name="lucide:plus" class="w-4 h-4" />
								</button>
							</div>

							<!-- Botão remover -->
							<button
								type="button"
								class="flex items-center justify-center w-7 h-7 rounded-md text-[var(--error)] hover:bg-[var(--error-light)] transition-colors"
								@click="removerProduto(produtoCombo.produto_id)"
							>
								<Icon name="lucide:trash-2" class="w-4 h-4" />
							</button>
						</div>
					</div>
				</div>
			</div>

			<!-- Mensagem quando não há produtos -->
			<div
				v-else
				class="p-6 text-center bg-[var(--bg-muted)] rounded-lg border-2 border-dashed border-[var(--border-default)]"
			>
				<Icon name="lucide:package-plus" class="w-12 h-12 mx-auto mb-2 text-[var(--text-muted)]" />
				<p class="text-sm text-[var(--text-muted)]">
					Nenhum produto selecionado. Adicione produtos ao combo usando o campo acima.
				</p>
			</div>
		</div>

		<!-- Seção Período de Validade -->
		<div class="space-y-4">
			<h3
				class="text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border-muted)] pb-3"
			>
				Período de Validade (Opcional)
			</h3>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<!-- Data Início -->
				<div>
					<label
						for="data_inicio"
						class="block text-sm font-medium text-[var(--text-primary)] mb-2"
					>
						Data de Início
					</label>
					<UiDatePicker
						id="data_inicio"
						v-model="form.data_inicio"
						placeholder="Selecione a data"
					/>
				</div>

				<!-- Data Fim -->
				<div>
					<label for="data_fim" class="block text-sm font-medium text-[var(--text-primary)] mb-2">
						Data de Término
					</label>
					<UiDatePicker
						id="data_fim"
						v-model="form.data_fim"
						placeholder="Selecione a data"
						:min-date="form.data_inicio"
						:error="errors.data_fim ? true : undefined"
					/>
					<p v-if="errors.data_fim" class="text-xs text-red-600 mt-1">
						{{ errors.data_fim }}
					</p>
				</div>
			</div>
		</div>

		<!-- Seção Configurações -->
		<div class="p-6 bg-[var(--card-bg)] border border-[var(--border-default)] rounded-lg">
			<h3 class="text-base font-semibold text-[var(--text-primary)] mb-4">Configurações</h3>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
				<!-- Destaque -->
				<div class="p-4 bg-[var(--bg-muted)] rounded-lg">
					<div class="flex items-center justify-between">
						<div class="flex-1">
							<label
								for="destaque"
								class="block text-sm font-medium text-[var(--text-primary)] mb-1"
							>
								Combo em Destaque
							</label>
							<p class="text-xs text-[var(--text-muted)]">Aparece em posição de destaque</p>
						</div>
						<UiSwitch id="destaque" v-model="form.destaque" />
					</div>
				</div>

				<!-- Ativo -->
				<div class="p-4 bg-[var(--bg-muted)] rounded-lg">
					<div class="flex items-center justify-between">
						<div class="flex-1">
							<label for="ativo" class="block text-sm font-medium text-[var(--text-primary)] mb-1">
								Combo Ativo
							</label>
							<p class="text-xs text-[var(--text-muted)]">Disponível para venda</p>
						</div>
						<UiSwitch id="ativo" v-model="form.ativo" />
					</div>
				</div>
			</div>
		</div>
	</form>
</template>
