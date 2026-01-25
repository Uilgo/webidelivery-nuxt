<script setup lang="ts">
/**
 * 📌 CardapioProdutoDrawer
 *
 * Drawer para visualização e personalização de produto.
 * Permite selecionar variação, adicionais e quantidade.
 */

import type {
	ProdutoPublico,
	VariacaoPublica,
	GrupoAdicionalPublico,
	AdicionalPublico,
	CategoriaPublica,
} from "../types/cardapio-publico";
import { useCarrinhoStore } from "~/stores/carrinho";
import { useProdutosSabores } from "../composables/useProdutosSabores";
import { formatCurrency } from "~/lib/formatters/currency";

interface Props {
	modelValue: boolean;
	produto: ProdutoPublico | null;
	estabelecimentoId: string;
	estabelecimentoSlug: string;
	categorias: readonly CategoriaPublica[];
}

interface Emits {
	(e: "update:modelValue", value: boolean): void;
	(e: "adicionado"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Store do carrinho
const carrinhoStore = useCarrinhoStore();

// Composable para buscar produtos
const { buscarProdutosPorCategoriaPai } = useProdutosSabores();

// Estado local
const variacaoSelecionadaId = ref<string | null>(null);
const adicionaisSelecionados = ref<Map<string, number>>(new Map());
const observacao = ref("");
const quantidade = ref(1);

// Estado para múltiplos sabores
const multiplosSabores = ref(false);
const quantidadeSabores = ref<2 | 3 | 4>(2);
const saboresSelecionados = ref<string[]>([]);

// Estado para produtos disponíveis (carregados dinamicamente)
const produtosDisponiveis = ref<ProdutoPublico[]>([]);
const carregandoProdutos = ref(false);

// Estado para grupos de adicionais (carregados dinamicamente)
const gruposAdicionais = ref<GrupoAdicionalPublico[]>([]);

// Estado para controlar qual grupo está selecionado/expandido
const grupoSelecionado = ref<string | null>(null);

// Computed para obter o objeto completo da variação selecionada
const variacaoSelecionada = computed<VariacaoPublica | null>(() => {
	if (!variacaoSelecionadaId.value || !props.produto) return null;
	return props.produto.variacoes.find((v) => v.id === variacaoSelecionadaId.value) ?? null;
});

// Computed para controle do drawer
const isOpen = computed({
	get: () => props.modelValue,
	set: (value: boolean) => emit("update:modelValue", value),
});

/**
 * Reseta o estado quando o drawer abre
 */
watch(
	() => props.modelValue,
	async (aberto) => {
		if (aberto && props.produto) {
			variacaoSelecionadaId.value = props.produto.variacoes[0]?.id ?? null;
			adicionaisSelecionados.value = new Map();
			observacao.value = "";
			quantidade.value = 1;
			multiplosSabores.value = false;
			quantidadeSabores.value = 2;
			saboresSelecionados.value = [];
			grupoSelecionado.value = null;

			// Carrega produtos das subcategorias e grupos de adicionais
			await Promise.all([carregarProdutosSabores(), carregarGruposAdicionais()]);
		}
	},
);

/**
 * Reseta sabores quando desmarca múltiplos sabores
 */
watch(multiplosSabores, (ativo) => {
	if (!ativo) {
		saboresSelecionados.value = [];
	}
});

/**
 * Opções formatadas para o Select de variações
 */
const variacoesOptions = computed(() => {
	if (!props.produto) return [];

	return props.produto.variacoes.map((variacao) => {
		// Formata o label com nome e preço
		let label = variacao.nome;

		// Se tem preço promocional, mostra ambos
		if (variacao.preco_promocional) {
			label += ` - ${formatCurrency(variacao.preco_promocional)}`;
		} else {
			label += ` - ${formatCurrency(variacao.preco)}`;
		}

		return {
			label,
			value: variacao.id,
		};
	});
});

/**
 * Quantidade máxima de sabores adicionais que pode selecionar
 * (total - 1, pois o produto atual já conta como 1 sabor)
 */
const maxSaboresAdicionais = computed(() => quantidadeSabores.value - 1);

/**
 * Opções de quantidade de sabores
 */
const opcoesSabores = [
	{ label: "2 sabores", value: 2 },
	{ label: "3 sabores", value: 3 },
	{ label: "4 sabores", value: 4 },
];

/**
 * Encontra a categoria pai do produto atual
 */
const categoriaPai = computed<CategoriaPublica | null>(() => {
	if (!props.produto) return null;

	// Busca a categoria do produto
	const categoriaAtual = props.categorias.find((c) => c.id === props.produto!.categoria_id);
	if (!categoriaAtual) {
		console.log("❌ Categoria do produto não encontrada");
		return null;
	}

	console.log(
		"📂 Categoria do produto:",
		categoriaAtual.nome,
		"categoria_pai_id:",
		categoriaAtual.categoria_pai_id,
	);

	// Se tem categoria_pai_id, busca a categoria pai
	if (categoriaAtual.categoria_pai_id) {
		const pai = props.categorias.find((c) => c.id === categoriaAtual.categoria_pai_id);
		console.log("📁 Categoria pai encontrada:", pai?.nome);
		return pai ?? null;
	}

	// Se não tem pai, ela mesma é a categoria pai (categoria raiz)
	console.log("📁 Categoria raiz (sem pai):", categoriaAtual.nome);
	return categoriaAtual;
});

/**
 * IDs de todas as subcategorias da categoria pai
 */
const subcategoriasIds = computed<string[]>(() => {
	if (!categoriaPai.value) return [];

	// Pega TODAS as subcategorias da categoria pai
	return props.categorias
		.filter((c) => c.categoria_pai_id === categoriaPai.value!.id)
		.map((c) => c.id);
});

/**
 * Todos os produtos das subcategorias (opções de sabores)
 */
const produtosDisponiveisFiltrados = computed<readonly ProdutoPublico[]>(() => {
	// Remove o produto atual da lista (não faz sentido escolher o mesmo sabor)
	return produtosDisponiveis.value.filter((p) => p.id !== props.produto?.id);
});

/**
 * Carrega produtos das subcategorias quando o drawer abre
 */
const carregarProdutosSabores = async () => {
	if (!categoriaPai.value || subcategoriasIds.value.length === 0) {
		produtosDisponiveis.value = [];
		return;
	}

	try {
		carregandoProdutos.value = true;
		const produtos = await buscarProdutosPorCategoriaPai(
			props.estabelecimentoId,
			subcategoriasIds.value,
		);

		produtosDisponiveis.value = produtos;

		console.log("✅ Produtos carregados:", {
			categoriaPai: categoriaPai.value.nome,
			subcategorias: subcategoriasIds.value.length,
			totalProdutos: produtos.length,
		});
	} catch (err) {
		console.error("Erro ao carregar produtos:", err);
		produtosDisponiveis.value = [];
	} finally {
		carregandoProdutos.value = false;
	}
};

/**
 * Carrega grupos de adicionais do produto atual
 */
const carregarGruposAdicionais = async () => {
	if (!props.produto) return;

	try {
		const supabase = useSupabaseClient();

		// Busca os grupos de adicionais vinculados ao produto
		const { data, error } = await supabase
			.from("produto_grupos_adicionais")
			.select(
				`
				grupo_adicional:grupos_adicionais (
					id,
					nome,
					descricao,
					min_selecao,
					max_selecao,
					obrigatorio,
					adicionais (
						id,
						nome,
						preco,
						permite_multiplas_unidades
					)
				)
			`,
			)
			.eq("produto_id", props.produto.id);

		if (error) {
			console.error("Erro ao buscar grupos de adicionais:", error);
			return;
		}

		// Atualiza o estado local com os grupos de adicionais
		if (data && data.length > 0) {
			gruposAdicionais.value = data
				.map((item) => {
					const grupo = item.grupo_adicional as unknown;
					if (!grupo || typeof grupo !== "object") return null;

					const g = grupo as Record<string, unknown>;
					return {
						id: g.id as string,
						nome: g.nome as string,
						descricao: (g.descricao as string) || null,
						min_selecao: g.min_selecao as number,
						max_selecao: g.max_selecao as number,
						obrigatorio: g.obrigatorio as boolean,
						adicionais: ((g.adicionais as unknown[]) || []).map((a) => {
							const adicional = a as Record<string, unknown>;
							return {
								id: adicional.id as string,
								nome: adicional.nome as string,
								preco: parseFloat(adicional.preco as string),
								permite_multiplas_unidades: adicional.permite_multiplas_unidades as boolean,
							};
						}),
					};
				})
				.filter((g): g is NonNullable<typeof g> => g !== null && g.adicionais.length > 0);

			console.log("✅ Grupos de adicionais carregados:", gruposAdicionais.value.length);
		} else {
			gruposAdicionais.value = [];
		}
	} catch (err) {
		console.error("Erro ao carregar grupos de adicionais:", err);
		gruposAdicionais.value = [];
	}
};

/**
 * Preço da variação selecionada (considera promoção)
 */
const precoVariacao = computed(() => {
	if (!variacaoSelecionada.value) return 0;
	return variacaoSelecionada.value.preco_promocional ?? variacaoSelecionada.value.preco;
});

/**
 * Total dos adicionais selecionados
 */
const totalAdicionais = computed(() => {
	let total = 0;
	if (!props.produto) return total;

	for (const grupo of props.produto.grupos_adicionais) {
		for (const adicional of grupo.adicionais) {
			const qtd = adicionaisSelecionados.value.get(adicional.id) ?? 0;
			total += adicional.preco * qtd;
		}
	}
	return total;
});

/**
 * Preço unitário (variação + adicionais)
 */
const precoUnitario = computed(() => precoVariacao.value + totalAdicionais.value);

/**
 * Preço total (unitário * quantidade)
 */
const precoTotal = computed(() => precoUnitario.value * quantidade.value);

/**
 * Verifica se um grupo de adicionais está válido
 */
const grupoValido = (grupo: GrupoAdicionalPublico): boolean => {
	const totalSelecionado = grupo.adicionais.reduce((acc, a) => {
		return acc + (adicionaisSelecionados.value.get(a.id) ?? 0);
	}, 0);

	if (grupo.obrigatorio && totalSelecionado < grupo.min_selecao) {
		return false;
	}
	return true;
};

/**
 * Verifica se pode adicionar ao carrinho
 */
const podeAdicionar = computed(() => {
	if (!props.produto || !variacaoSelecionada.value) return false;

	for (const grupo of props.produto.grupos_adicionais) {
		if (!grupoValido(grupo)) return false;
	}
	return true;
});

/**
 * Quantidade selecionada de um adicional
 */
const getQuantidadeAdicional = (adicionalId: string): number => {
	return adicionaisSelecionados.value.get(adicionalId) ?? 0;
};

/**
 * Altera quantidade de um adicional
 */
const alterarAdicional = (
	grupo: GrupoAdicionalPublico,
	adicional: AdicionalPublico,
	delta: number,
): void => {
	const atual = getQuantidadeAdicional(adicional.id);
	const novo = Math.max(0, atual + delta);

	const totalGrupo = grupo.adicionais.reduce((acc, a) => {
		if (a.id === adicional.id) return acc + novo;
		return acc + (adicionaisSelecionados.value.get(a.id) ?? 0);
	}, 0);

	if (totalGrupo > grupo.max_selecao) return;

	if (novo === 0) {
		adicionaisSelecionados.value.delete(adicional.id);
	} else {
		adicionaisSelecionados.value.set(adicional.id, novo);
	}

	adicionaisSelecionados.value = new Map(adicionaisSelecionados.value);
};

/**
 * Adiciona produto ao carrinho
 */
const adicionarAoCarrinho = (): void => {
	if (!props.produto || !variacaoSelecionada.value || !podeAdicionar.value) return;

	carrinhoStore.setEstabelecimento(props.estabelecimentoId, props.estabelecimentoSlug);

	const adicionaisLista: { id: string; nome: string; preco: number; quantidade: number }[] = [];

	for (const grupo of props.produto.grupos_adicionais) {
		for (const adicional of grupo.adicionais) {
			const qtd = adicionaisSelecionados.value.get(adicional.id) ?? 0;
			if (qtd > 0) {
				adicionaisLista.push({
					id: adicional.id,
					nome: adicional.nome,
					preco: adicional.preco,
					quantidade: qtd,
				});
			}
		}
	}

	carrinhoStore.adicionarItem({
		tipo: "produto",
		produto_id: props.produto.id,
		nome: props.produto.nome,
		imagem_url: props.produto.imagem_url,
		variacao: {
			id: variacaoSelecionada.value.id,
			nome: variacaoSelecionada.value.nome,
			preco: precoVariacao.value,
		},
		adicionais: adicionaisLista,
		observacao: observacao.value,
		quantidade: quantidade.value,
		preco_unitario: precoUnitario.value,
		preco_total: precoTotal.value,
	});

	emit("adicionado");
	emit("update:modelValue", false);
};
</script>

<template>
	<UiDrawer v-model="isOpen" :title="produto?.nome ?? 'Produto'" size="xl">
		<template v-if="produto">
			<div class="space-y-6 pb-24">
				<!-- Imagem do produto -->
				<div
					v-if="produto.imagem_url"
					class="w-full h-48 sm:h-64 rounded-lg overflow-hidden bg-[var(--bg-muted)]"
				>
					<img :src="produto.imagem_url" :alt="produto.nome" class="w-full h-full object-cover" />
				</div>

				<!-- Descrição -->
				<p v-if="produto.descricao" class="text-sm text-[var(--text-secondary)]">
					{{ produto.descricao }}
				</p>

				<!-- Variações -->
				<div v-if="produto.variacoes.length > 1" class="space-y-3">
					<UiSelect
						v-model="variacaoSelecionadaId"
						:options="variacoesOptions"
						label="Escolha uma opção"
						:required="true"
						size="lg"
					/>
				</div>

				<!-- Card de Múltiplos Sabores -->
				<div class="space-y-3">
					<!-- Checkbox para ativar múltiplos sabores -->
					<label
						class="flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors bg-[var(--bg-muted)]"
						:class="
							multiplosSabores
								? 'border-[var(--primary)] bg-[var(--primary-light)]'
								: 'border-[var(--border-default)] hover:border-[var(--border-hover)]'
						"
					>
						<input
							type="checkbox"
							v-model="multiplosSabores"
							class="w-5 h-5 mt-0.5 text-[var(--primary)] rounded focus:ring-[var(--primary)]"
						/>
						<div class="flex-1">
							<h3 class="font-semibold text-[var(--text-primary)]">Adicionar mais sabores?</h3>
							<p class="text-sm text-[var(--text-muted)] mt-0.5">
								Personalize com até 4 sabores diferentes
							</p>
						</div>
					</label>

					<!-- Seleção de quantidade de sabores (aparece quando marcado) -->
					<div v-if="multiplosSabores" class="space-y-4">
						<!-- Blocos de quantidade de sabores -->
						<div>
							<label class="block text-sm font-medium text-[var(--text-primary)] mb-3">
								Quantos sabores? <span class="text-[var(--error)]">*</span>
							</label>
							<div class="grid grid-cols-3 gap-3">
								<label
									v-for="opcao in opcoesSabores"
									:key="opcao.value"
									class="relative flex items-center justify-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 group"
									:class="
										quantidadeSabores === opcao.value
											? 'border-[var(--primary)] bg-gradient-to-br from-[var(--primary-light)] to-transparent shadow-lg scale-105'
											: 'border-[var(--border-default)] hover:border-[var(--primary)] hover:shadow-md hover:scale-102 bg-[var(--bg-surface)]'
									"
								>
									<input
										type="radio"
										:value="opcao.value"
										v-model="quantidadeSabores"
										class="sr-only"
									/>

									<!-- Ícone -->
									<Icon
										:name="
											quantidadeSabores === opcao.value ? 'lucide:check-circle-2' : 'lucide:circle'
										"
										class="w-5 h-5 transition-all duration-200"
										:class="
											quantidadeSabores === opcao.value
												? 'text-[var(--primary)] scale-110'
												: 'text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:scale-105'
										"
									/>

									<!-- Texto -->
									<span
										class="font-semibold text-sm transition-colors duration-200"
										:class="
											quantidadeSabores === opcao.value
												? 'text-[var(--primary)]'
												: 'text-[var(--text-primary)] group-hover:text-[var(--primary)]'
										"
									>
										{{ opcao.label }}
									</span>

									<!-- Badge de selecionado -->
									<div
										v-if="quantidadeSabores === opcao.value"
										class="absolute -top-2 -right-2 w-6 h-6 bg-[var(--primary)] rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-200"
									>
										<Icon name="lucide:check" class="w-4 h-4 text-white" />
									</div>
								</label>
							</div>
						</div>

						<!-- Lista de sabores para selecionar -->
						<div class="space-y-3">
							<label class="block text-sm font-medium text-[var(--text-primary)]">
								Escolha os sabores
							</label>

							<!-- Loading -->
							<div v-if="carregandoProdutos" class="text-center py-4">
								<Icon
									name="lucide:loader-2"
									class="w-6 h-6 animate-spin text-[var(--primary)] mx-auto"
								/>
								<p class="text-sm text-[var(--text-muted)] mt-2">Carregando sabores...</p>
							</div>

							<!-- Slots de sabores -->
							<div v-else class="space-y-2">
								<!-- Slot 1: Produto atual (fixo) -->
								<div
									class="flex items-center gap-3 p-4 border-2 rounded-xl bg-gradient-to-br from-[var(--primary-light)] to-transparent border-[var(--primary)]"
								>
									<div
										class="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
									>
										1
									</div>
									<div class="flex-1">
										<p class="text-sm font-semibold text-[var(--text-primary)]">
											{{ produto?.nome }}
										</p>
										<p class="text-xs text-[var(--text-muted)]">Sabor principal</p>
									</div>
									<Icon name="lucide:lock" class="w-5 h-5 text-[var(--primary)]" />
								</div>

								<!-- Slots 2, 3, 4: Sabores adicionais (selects customizados) -->
								<div
									v-for="index in maxSaboresAdicionais"
									:key="index"
									class="flex items-center gap-3 p-4 border-2 rounded-xl transition-all duration-200"
									:class="
										saboresSelecionados[index - 1]
											? 'border-[var(--primary)] bg-gradient-to-br from-[var(--primary-light)] to-transparent shadow-md'
											: 'border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--border-hover)] hover:shadow-sm'
									"
								>
									<div
										class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 transition-all duration-200"
										:class="
											saboresSelecionados[index - 1]
												? 'bg-[var(--primary)] text-white shadow-lg scale-110'
												: 'bg-[var(--bg-muted)] text-[var(--text-muted)]'
										"
									>
										{{ index + 1 }}
									</div>

									<!-- Sabor selecionado (fixo com botão trocar) -->
									<div
										v-if="saboresSelecionados[index - 1]"
										class="flex-1 flex items-center justify-between"
									>
										<div class="flex-1 min-w-0">
											<p class="text-sm font-semibold text-[var(--text-primary)] truncate">
												{{
													produtosDisponiveisFiltrados.find(
														(p) => p.id === saboresSelecionados[index - 1],
													)?.nome
												}}
											</p>
											<p class="text-xs text-[var(--text-muted)]">Sabor adicional</p>
										</div>

										<button
											type="button"
											class="ml-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white border border-[var(--primary)] rounded-lg transition-all duration-200"
											@click="
												() => {
													const newSabores = [...saboresSelecionados];
													newSabores[index - 1] = '';
													saboresSelecionados = newSabores.filter((s) => s !== '');
												}
											"
										>
											<Icon name="lucide:refresh-cw" class="w-3.5 h-3.5" />
											Trocar
										</button>
									</div>

									<!-- Select para escolher sabor -->
									<div v-else class="flex-1">
										<UiSelectMenu
											v-model="saboresSelecionados[index - 1]"
											:options="
												produtosDisponiveisFiltrados.map((p) => ({
													label: p.nome,
													value: p.id,
													disabled: saboresSelecionados.includes(p.id),
												}))
											"
											placeholder="Selecione um sabor"
											searchPlaceholder="Buscar sabor..."
											:searchable="true"
											size="md"
										/>
									</div>

									<!-- Ícone de status -->
									<Icon
										v-if="saboresSelecionados[index - 1]"
										name="lucide:check-circle-2"
										class="w-5 h-5 text-[var(--primary)] flex-shrink-0 animate-in zoom-in duration-200"
									/>
									<Icon
										v-else
										name="lucide:circle-dashed"
										class="w-5 h-5 text-[var(--text-muted)] flex-shrink-0"
									/>
								</div>
							</div>

							<!-- Mensagem quando não há produtos disponíveis -->
							<div
								v-if="!carregandoProdutos && produtosDisponiveisFiltrados.length === 0"
								class="text-center py-4 text-sm text-[var(--text-muted)]"
							>
								Nenhum sabor disponível para esta categoria
							</div>
						</div>
					</div>
				</div>

				<!-- Grupos de Adicionais -->
				<div v-if="gruposAdicionais.length > 0" class="space-y-3">
					<div v-for="grupo in gruposAdicionais" :key="grupo.id" class="space-y-2">
						<!-- Bloco do grupo (clicável) -->
						<label
							class="relative flex items-center justify-between gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 group"
							:class="
								grupoSelecionado === grupo.id
									? 'border-[var(--primary)] bg-gradient-to-br from-[var(--primary-light)] to-transparent shadow-lg'
									: 'border-[var(--border-default)] hover:border-[var(--primary)] hover:shadow-md bg-[var(--bg-surface)]'
							"
							@click="grupoSelecionado = grupoSelecionado === grupo.id ? null : grupo.id"
						>
							<!-- Ícone de seleção -->
							<Icon
								:name="grupoSelecionado === grupo.id ? 'lucide:check-circle-2' : 'lucide:circle'"
								class="w-5 h-5 transition-all duration-200 flex-shrink-0"
								:class="
									grupoSelecionado === grupo.id
										? 'text-[var(--primary)] scale-110'
										: 'text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:scale-105'
								"
							/>

							<!-- Informações do grupo -->
							<div class="flex-1 min-w-0">
								<h3
									class="font-semibold text-sm transition-colors duration-200"
									:class="
										grupoSelecionado === grupo.id
											? 'text-[var(--primary)]'
											: 'text-[var(--text-primary)] group-hover:text-[var(--primary)]'
									"
								>
									{{ grupo.nome }}
									<span v-if="grupo.obrigatorio" class="text-[var(--error)] ml-1">*</span>
								</h3>
								<p
									class="text-xs mt-0.5 transition-colors duration-200"
									:class="
										(() => {
											const totalSelecionado = grupo.adicionais.reduce(
												(acc, a) => acc + getQuantidadeAdicional(a.id),
												0,
											);
											// Se atingiu o limite, mostra em amarelo/warning
											if (totalSelecionado >= grupo.max_selecao) {
												return 'text-[var(--warning)] font-medium';
											}
											return 'text-[var(--text-muted)]';
										})()
									"
								>
									{{
										(() => {
											const totalSelecionado = grupo.adicionais.reduce(
												(acc, a) => acc + getQuantidadeAdicional(a.id),
												0,
											);
											// Se atingiu o limite, mostra mensagem específica
											if (totalSelecionado >= grupo.max_selecao) {
												return "Limite atingido - Remova um item para adicionar outro";
											}
											// Senão, mostra a descrição normal
											return grupo.descricao || "Escolha seus adicionais";
										})()
									}}
								</p>
							</div>

							<!-- Contador de seleção dinâmico -->
							<span
								class="text-xs font-medium whitespace-nowrap transition-colors duration-200"
								:class="
									(() => {
										const totalSelecionado = grupo.adicionais.reduce(
											(acc, a) => acc + getQuantidadeAdicional(a.id),
											0,
										);
										return totalSelecionado > 0
											? 'text-[var(--primary)]'
											: 'text-[var(--text-muted)]';
									})()
								"
							>
								{{
									(() => {
										const totalSelecionado = grupo.adicionais.reduce(
											(acc, a) => acc + getQuantidadeAdicional(a.id),
											0,
										);

										// Caso especial: opcional com limite 1
										if (grupo.min_selecao === 0 && grupo.max_selecao === 1) {
											return totalSelecionado > 0 ? "1 item selecionado" : "Escolha até 1 item";
										}

										// Opcional com múltiplas escolhas
										if (grupo.min_selecao === 0) {
											return totalSelecionado > 0
												? `${totalSelecionado} de ${grupo.max_selecao} selecionados`
												: `Escolha até ${grupo.max_selecao} itens`;
										}

										// Obrigatório com quantidade exata
										if (grupo.min_selecao === grupo.max_selecao) {
											const faltam = grupo.max_selecao - totalSelecionado;
											if (totalSelecionado === 0) {
												return `Escolha ${grupo.max_selecao} ${grupo.max_selecao === 1 ? "item" : "itens"}`;
											}
											if (faltam > 0) {
												return `${totalSelecionado} de ${grupo.max_selecao} (faltam ${faltam})`;
											}
											return `${totalSelecionado} de ${grupo.max_selecao} completo`;
										}

										// Obrigatório com range (min até max)
										if (totalSelecionado === 0) {
											return `Escolha de ${grupo.min_selecao} a ${grupo.max_selecao} itens`;
										}
										if (totalSelecionado < grupo.min_selecao) {
											const faltam = grupo.min_selecao - totalSelecionado;
											return `${totalSelecionado} de ${grupo.max_selecao} (faltam ${faltam})`;
										}
										return `${totalSelecionado} de ${grupo.max_selecao} selecionados`;
									})()
								}}
							</span>

							<!-- Badge de selecionado -->
							<div
								v-if="grupoSelecionado === grupo.id"
								class="absolute -top-2 -right-2 w-6 h-6 bg-[var(--primary)] rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-200"
							>
								<Icon name="lucide:check" class="w-4 h-4 text-white" />
							</div>
						</label>

						<!-- Lista de adicionais (aparece abaixo do bloco quando selecionado) -->
						<div
							v-if="grupoSelecionado === grupo.id"
							class="space-y-2 pl-4 animate-in slide-in-from-top-2 duration-200"
						>
							<!-- Select para adicionar novo item (só aparece se não atingiu o limite) -->
							<div
								v-if="
									(() => {
										const totalSelecionado = grupo.adicionais.reduce(
											(acc, a) => acc + getQuantidadeAdicional(a.id),
											0,
										);
										return totalSelecionado < grupo.max_selecao;
									})()
								"
								class="p-3 border-2 border-dashed border-[var(--border-default)] rounded-xl bg-[var(--bg-surface)]"
							>
								<UiSelectMenu
									:model-value="null"
									@update:model-value="
										(value) => {
											if (!value) return;

											const qtdAtual = getQuantidadeAdicional(value as string);
											const novaQtd = qtdAtual + 1;

											// Verifica se não ultrapassou o máximo do grupo
											const totalGrupo = grupo.adicionais.reduce((acc, a) => {
												if (a.id === value) return acc + novaQtd;
												return acc + getQuantidadeAdicional(a.id);
											}, 0);

											if (totalGrupo <= grupo.max_selecao) {
												adicionaisSelecionados.set(value as string, novaQtd);
												adicionaisSelecionados = new Map(adicionaisSelecionados);
											}
										}
									"
									:options="
										grupo.adicionais.map((a) => ({
											label: `${a.nome}${a.preco > 0 ? ' - ' + formatCurrency(a.preco) : ''}`,
											value: a.id,
										}))
									"
									placeholder="Clique para adicionar um item"
									searchPlaceholder="Buscar adicional..."
									:searchable="true"
									size="md"
								/>
							</div>

							<!-- Lista de itens selecionados -->
							<div
								v-for="adicional in grupo.adicionais.filter(
									(a) => getQuantidadeAdicional(a.id) > 0,
								)"
								:key="adicional.id"
								class="flex items-center justify-between p-4 border-2 border-[var(--primary)] rounded-xl bg-gradient-to-br from-[var(--primary-light)] to-transparent"
							>
								<!-- Nome e quantidade -->
								<div class="flex-1 min-w-0">
									<p class="text-sm font-semibold text-[var(--primary)]">
										{{ adicional.nome }}
										<span class="text-[var(--primary)]">
											({{ getQuantidadeAdicional(adicional.id) }}x)
										</span>
									</p>
								</div>

								<!-- Preço e ações -->
								<div class="flex items-center gap-3">
									<span
										v-if="adicional.preco > 0"
										class="text-sm font-semibold text-[var(--primary)] whitespace-nowrap"
									>
										+ {{ formatCurrency(adicional.preco * getQuantidadeAdicional(adicional.id)) }}
									</span>

									<!-- Botões de quantidade -->
									<div class="flex items-center gap-1">
										<!-- Botão diminuir (só aparece se permite_multiplas_unidades) -->
										<button
											v-if="adicional.permite_multiplas_unidades"
											type="button"
											class="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors duration-200"
											@click="
												() => {
													const qtdAtual = getQuantidadeAdicional(adicional.id);
													if (qtdAtual > 1) {
														adicionaisSelecionados.set(adicional.id, qtdAtual - 1);
													} else {
														adicionaisSelecionados.delete(adicional.id);
													}
													adicionaisSelecionados = new Map(adicionaisSelecionados);
												}
											"
										>
											<Icon name="lucide:minus" class="w-4 h-4" />
										</button>

										<!-- Botão aumentar (só aparece se permite_multiplas_unidades) -->
										<button
											v-if="adicional.permite_multiplas_unidades"
											type="button"
											class="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors duration-200"
											@click="
												() => {
													const qtdAtual = getQuantidadeAdicional(adicional.id);
													const novaQtd = qtdAtual + 1;

													// Verifica se não ultrapassou o máximo do grupo
													const totalGrupo = grupo.adicionais.reduce((acc, a) => {
														if (a.id === adicional.id) return acc + novaQtd;
														return acc + getQuantidadeAdicional(a.id);
													}, 0);

													if (totalGrupo <= grupo.max_selecao) {
														adicionaisSelecionados.set(adicional.id, novaQtd);
														adicionaisSelecionados = new Map(adicionaisSelecionados);
													}
												}
											"
										>
											<Icon name="lucide:plus" class="w-4 h-4" />
										</button>

										<!-- Botão remover (sempre aparece) -->
										<button
											type="button"
											class="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--error)] text-white hover:bg-[var(--error)]/80 transition-colors duration-200"
											@click="
												() => {
													adicionaisSelecionados.delete(adicional.id);
													adicionaisSelecionados = new Map(adicionaisSelecionados);
												}
											"
										>
											<Icon name="lucide:x" class="w-4 h-4" />
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Observação -->
				<div class="space-y-2">
					<label class="font-medium text-[var(--text-primary)]">Alguma observação?</label>
					<UiTextarea v-model="observacao" :rows="2" placeholder="Ex: Sem cebola, bem passado..." />
				</div>
			</div>
		</template>

		<!-- Footer fixo com quantidade e botão adicionar -->
		<template #footer>
			<div
				class="flex items-center justify-between gap-4 p-4 border-t border-[var(--border-default)] bg-[var(--bg-surface)]"
			>
				<!-- Controle de quantidade -->
				<div class="flex items-center gap-3">
					<UiButton
						variant="outline"
						size="md"
						class="!p-2 !min-h-[40px] !w-[40px]"
						:disabled="quantidade <= 1"
						@click="quantidade--"
					>
						<Icon name="lucide:minus" class="w-5 h-5" />
					</UiButton>

					<span class="w-8 text-center font-semibold text-lg text-[var(--text-primary)]">
						{{ quantidade }}
					</span>

					<UiButton
						variant="outline"
						size="md"
						class="!p-2 !min-h-[40px] !w-[40px]"
						@click="quantidade++"
					>
						<Icon name="lucide:plus" class="w-5 h-5" />
					</UiButton>
				</div>

				<!-- Botão adicionar -->
				<UiButton
					variant="solid"
					size="lg"
					class="flex-1"
					:disabled="!podeAdicionar"
					@click="adicionarAoCarrinho"
				>
					Adicionar {{ formatCurrency(precoTotal) }}
				</UiButton>
			</div>
		</template>
	</UiDrawer>
</template>
