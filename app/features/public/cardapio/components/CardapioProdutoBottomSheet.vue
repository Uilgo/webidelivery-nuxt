<script setup lang="ts">
/**
 * 📌 CardapioProdutoBottomSheet
 * Bottom Sheet mobile com TODAS as funcionalidades do Drawer
 */

import type {
	ProdutoPublico,
	VariacaoPublica,
	GrupoAdicionalPublico,
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

const carrinhoStore = useCarrinhoStore();
const { buscarProdutosPorCategoriaPai } = useProdutosSabores();

// Estados
const variacaoSelecionadaId = ref<string | null>(null);
const adicionaisSelecionados = ref<Map<string, number>>(new Map());
const observacao = ref("");
const quantidade = ref(1);
const multiplosSabores = ref(false);
const quantidadeSabores = ref<2 | 3 | 4>(2);
const saboresSelecionados = ref<string[]>([]);
const produtosDisponiveis = ref<ProdutoPublico[]>([]);
const carregandoProdutos = ref(false);
const gruposAdicionais = ref<GrupoAdicionalPublico[]>([]);
const grupoSelecionado = ref<string | null>(null);

const variacaoSelecionada = computed<VariacaoPublica | null>(() => {
	if (!variacaoSelecionadaId.value || !props.produto) return null;
	return props.produto.variacoes.find((v) => v.id === variacaoSelecionadaId.value) ?? null;
});

const isOpen = computed({
	get: () => props.modelValue,
	set: (value: boolean) => emit("update:modelValue", value),
});

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
			await Promise.all([carregarProdutosSabores(), carregarGruposAdicionais()]);
		}
	},
);

watch(multiplosSabores, (ativo) => {
	if (!ativo) saboresSelecionados.value = [];
});

const variacoesOptions = computed(() => {
	if (!props.produto) return [];
	return props.produto.variacoes.map((v) => ({
		label: `${v.nome} - ${formatCurrency(v.preco_promocional ?? v.preco)}`,
		value: v.id,
	}));
});

const maxSaboresAdicionais = computed(() => quantidadeSabores.value - 1);

const opcoesSabores = [
	{ label: "2 sabores", value: 2 },
	{ label: "3 sabores", value: 3 },
	{ label: "4 sabores", value: 4 },
];

const categoriaPai = computed<CategoriaPublica | null>(() => {
	if (!props.produto) return null;
	const cat = props.categorias.find((c) => c.id === props.produto!.categoria_id);
	if (!cat) return null;
	if (cat.categoria_pai_id) {
		return props.categorias.find((c) => c.id === cat.categoria_pai_id) ?? null;
	}
	return cat;
});

const subcategoriasIds = computed<string[]>(() => {
	if (!categoriaPai.value) return [];
	return props.categorias
		.filter((c) => c.categoria_pai_id === categoriaPai.value!.id)
		.map((c) => c.id);
});

const produtosDisponiveisFiltrados = computed<readonly ProdutoPublico[]>(() => {
	return produtosDisponiveis.value.filter((p) => p.id !== props.produto?.id);
});

const carregarProdutosSabores = async () => {
	if (!categoriaPai.value || subcategoriasIds.value.length === 0) {
		produtosDisponiveis.value = [];
		return;
	}
	try {
		carregandoProdutos.value = true;
		produtosDisponiveis.value = await buscarProdutosPorCategoriaPai(
			props.estabelecimentoId,
			subcategoriasIds.value,
		);
	} catch (err) {
		console.error("Erro ao carregar produtos:", err);
		produtosDisponiveis.value = [];
	} finally {
		carregandoProdutos.value = false;
	}
};

const carregarGruposAdicionais = async () => {
	if (!props.produto) return;
	try {
		const supabase = useSupabaseClient();
		const { data, error } = await supabase
			.from("produto_grupos_adicionais")
			.select(
				`grupo_adicional:grupos_adicionais (id,nome,descricao,min_selecao,max_selecao,obrigatorio,adicionais (id,nome,preco,permite_multiplas_unidades))`,
			)
			.eq("produto_id", props.produto.id);

		if (error) {
			console.error("Erro ao buscar grupos:", error);
			return;
		}

		if (data && data.length > 0) {
			const grupos = data
				.map((item) => {
					const g = item.grupo_adicional as unknown as Record<string, unknown>;
					if (!g) return null;
					return {
						id: g.id as string,
						nome: g.nome as string,
						descricao: (g.descricao as string) || null,
						min_selecao: g.min_selecao as number,
						max_selecao: g.max_selecao as number,
						obrigatorio: g.obrigatorio as boolean,
						adicionais: ((g.adicionais as unknown[]) || []).map((a) => {
							const ad = a as Record<string, unknown>;
							return {
								id: ad.id as string,
								nome: ad.nome as string,
								preco: parseFloat(ad.preco as string),
								permite_multiplas_unidades: ad.permite_multiplas_unidades as boolean,
							};
						}),
					};
				})
				.filter((g) => g !== null && g.adicionais.length > 0);

			gruposAdicionais.value = grupos as GrupoAdicionalPublico[];
		} else {
			gruposAdicionais.value = [];
		}
	} catch (err) {
		console.error("Erro ao carregar grupos:", err);
		gruposAdicionais.value = [];
	}
};

const precoVariacao = computed(() => {
	if (!variacaoSelecionada.value) return 0;
	return variacaoSelecionada.value.preco_promocional ?? variacaoSelecionada.value.preco;
});

const totalAdicionais = computed(() => {
	let total = 0;
	for (const grupo of gruposAdicionais.value) {
		for (const adicional of grupo.adicionais) {
			const qtd = adicionaisSelecionados.value.get(adicional.id) ?? 0;
			total += adicional.preco * qtd;
		}
	}
	return total;
});

const precoUnitario = computed(() => precoVariacao.value + totalAdicionais.value);
const precoTotal = computed(() => precoUnitario.value * quantidade.value);

const grupoValido = (grupo: GrupoAdicionalPublico): boolean => {
	const total = grupo.adicionais.reduce(
		(acc, a) => acc + (adicionaisSelecionados.value.get(a.id) ?? 0),
		0,
	);
	if (grupo.obrigatorio && total < grupo.min_selecao) return false;
	return true;
};

const podeAdicionar = computed(() => {
	if (!props.produto || !variacaoSelecionada.value) return false;
	for (const grupo of gruposAdicionais.value) {
		if (!grupoValido(grupo)) return false;
	}
	return true;
});

const getQuantidadeAdicional = (adicionalId: string): number => {
	return adicionaisSelecionados.value.get(adicionalId) ?? 0;
};

const adicionarAoCarrinho = (): void => {
	if (!props.produto || !variacaoSelecionada.value || !podeAdicionar.value) return;

	carrinhoStore.setEstabelecimento(props.estabelecimentoId, props.estabelecimentoSlug);

	const adicionaisLista: { id: string; nome: string; preco: number; quantidade: number }[] = [];
	for (const grupo of gruposAdicionais.value) {
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
	<UiBottomSheet
		v-model="isOpen"
		:snap-points="[95]"
		:show-handle="true"
		:close-on-click-outside="true"
		class="cardapio-theme-bridge"
	>
		<div v-if="produto" class="space-y-3 p-3 sm:p-4 pb-24">
			<!-- Imagem -->
			<div
				v-if="produto.imagem_url"
				class="w-full h-36 sm:h-40 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700"
			>
				<img
					:src="produto.imagem_url"
					:alt="produto.nome"
					class="w-full h-full object-cover"
					loading="lazy"
				/>
			</div>

			<!-- Nome e descrição -->
			<div>
				<h2 class="text-xl font-bold text-[var(--cardapio-text)] mb-1">{{ produto.nome }}</h2>
				<p v-if="produto.descricao" class="text-sm text-[var(--cardapio-text-muted)]">
					{{ produto.descricao }}
				</p>
			</div>

			<!-- Variações -->
			<div v-if="produto.variacoes.length > 1" class="space-y-2">
				<UiSelect
					v-model="variacaoSelecionadaId"
					:options="variacoesOptions"
					label="Escolha uma opção"
					:required="true"
					size="md"
				/>
			</div>

			<!-- Múltiplos Sabores -->
			<div v-if="produtosDisponiveisFiltrados.length > 0" class="space-y-2.5">
				<label
					class="flex items-start gap-2.5 p-3 sm:p-3.5 border rounded-2xl cursor-pointer transition-colors bg-[var(--cardapio-secondary)]"
					:class="
						multiplosSabores
							? 'border-[var(--cardapio-primary)] bg-[var(--cardapio-primary)]/5'
							: 'border-[var(--cardapio-border)]'
					"
				>
					<input
						type="checkbox"
						v-model="multiplosSabores"
						class="w-4 h-4 mt-0.5 text-[var(--cardapio-primary)] rounded accent-[var(--cardapio-primary)]"
					/>
					<div class="flex-1">
						<h3 class="font-semibold text-sm text-[var(--cardapio-text)]">
							Adicionar mais sabores?
						</h3>
						<p class="text-xs text-[var(--cardapio-text-muted)] mt-0.5">
							Personalize com até 4 sabores
						</p>
					</div>
				</label>

				<div v-if="multiplosSabores" class="space-y-2.5">
					<div>
						<label class="block text-xs sm:text-sm font-medium text-[var(--cardapio-text)] mb-2"
							>Quantos sabores? <span class="text-[var(--cardapio-danger)]">*</span></label
						>
						<div class="grid grid-cols-3 gap-2">
							<label
								v-for="opcao in opcoesSabores"
								:key="opcao.value"
								class="relative flex items-center justify-center gap-1 p-2.5 sm:p-3 border-2 rounded-2xl cursor-pointer transition-all"
								:class="
									quantidadeSabores === opcao.value
										? 'border-[var(--cardapio-primary)] bg-[var(--cardapio-primary)]/10 scale-105'
										: 'border-[var(--cardapio-border)] bg-[var(--cardapio-secondary)]'
								"
							>
								<input
									type="radio"
									:value="opcao.value"
									v-model="quantidadeSabores"
									class="sr-only"
								/>
								<Icon
									:name="
										quantidadeSabores === opcao.value ? 'lucide:check-circle-2' : 'lucide:circle'
									"
									class="w-3 h-3"
									:class="
										quantidadeSabores === opcao.value
											? 'text-[var(--cardapio-primary)]'
											: 'text-[var(--cardapio-text-muted)]'
									"
								/>
								<span
									class="font-semibold text-xs"
									:class="
										quantidadeSabores === opcao.value
											? 'text-[var(--cardapio-primary)]'
											: 'text-[var(--cardapio-text)]'
									"
									>{{ opcao.label }}</span
								>
							</label>
						</div>
					</div>

					<div class="space-y-2">
						<label class="block text-xs sm:text-sm font-medium text-[var(--cardapio-text)]"
							>Escolha os sabores</label
						>
						<div v-if="carregandoProdutos" class="text-center py-3">
							<Icon
								name="lucide:loader-2"
								class="w-5 h-5 animate-spin text-[var(--cardapio-primary)] mx-auto"
							/>
						</div>
						<div v-else class="space-y-2">
							<div
								class="flex items-center gap-2 p-2.5 sm:p-3 border-2 rounded-2xl bg-[var(--cardapio-primary)]/10 border-[var(--cardapio-primary)]"
							>
								<div
									class="w-6 h-6 rounded-full bg-[var(--cardapio-primary)] flex items-center justify-center text-white font-bold text-[10px]"
								>
									1
								</div>
								<div class="flex-1 min-w-0">
									<p class="text-xs font-semibold text-[var(--cardapio-text)] truncate">
										{{ produto?.nome }}
									</p>
								</div>
								<Icon name="lucide:lock" class="w-3 h-3 text-[var(--cardapio-primary)]" />
							</div>

							<div
								v-for="index in maxSaboresAdicionais"
								:key="index"
								class="flex items-center gap-2 p-2.5 sm:p-3 border-2 rounded-2xl"
								:class="
									saboresSelecionados[index - 1]
										? 'border-[var(--cardapio-primary)] bg-[var(--cardapio-primary)]/10'
										: 'border-[var(--cardapio-border)] bg-[var(--cardapio-secondary)]'
								"
							>
								<div
									class="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px]"
									:class="
										saboresSelecionados[index - 1]
											? 'bg-[var(--cardapio-primary)] text-white'
											: 'bg-[var(--cardapio-secondary)] text-[var(--cardapio-text-muted)]'
									"
								>
									{{ index + 1 }}
								</div>
								<div
									v-if="saboresSelecionados[index - 1]"
									class="flex-1 flex items-center justify-between min-w-0"
								>
									<p class="text-xs font-semibold text-[var(--cardapio-text)] truncate">
										{{
											produtosDisponiveisFiltrados.find(
												(p) => p.id === saboresSelecionados[index - 1],
											)?.nome
										}}
									</p>
									<button
										type="button"
										class="ml-1 px-2 py-1 text-xs font-medium text-[var(--cardapio-primary)] border border-[var(--cardapio-primary)] rounded-lg"
										@click="
											() => {
												const n = [...saboresSelecionados];
												n[index - 1] = '';
												saboresSelecionados = n.filter((s) => s !== '');
											}
										"
									>
										Trocar
									</button>
								</div>
								<div v-else class="flex-1 min-w-0">
									<UiSelectMenu
										v-model="saboresSelecionados[index - 1]"
										:options="
											produtosDisponiveisFiltrados.map((p) => ({
												label: p.nome,
												value: p.id,
												disabled: saboresSelecionados.includes(p.id),
											}))
										"
										placeholder="Selecione"
										searchPlaceholder="Buscar..."
										:searchable="true"
										size="sm"
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Grupos de Adicionais -->
			<div v-if="gruposAdicionais.length > 0" class="space-y-2.5">
				<div v-for="grupo in gruposAdicionais" :key="grupo.id" class="space-y-2">
					<label
						class="relative flex items-center justify-between gap-2 p-2.5 sm:p-3 border-2 rounded-2xl cursor-pointer transition-all"
						:class="
							grupoSelecionado === grupo.id
								? 'border-[var(--cardapio-primary)] bg-[var(--cardapio-primary)]/10'
								: 'border-[var(--cardapio-border)] bg-[var(--cardapio-secondary)]'
						"
						@click="grupoSelecionado = grupoSelecionado === grupo.id ? null : grupo.id"
					>
						<Icon
							:name="grupoSelecionado === grupo.id ? 'lucide:check-circle-2' : 'lucide:circle'"
							class="w-3 h-3 flex-shrink-0"
							:class="
								grupoSelecionado === grupo.id
									? 'text-[var(--cardapio-primary)]'
									: 'text-[var(--cardapio-text-muted)]'
							"
						/>
						<div class="flex-1 min-w-0">
							<h3
								class="font-semibold text-sm"
								:class="
									grupoSelecionado === grupo.id
										? 'text-[var(--cardapio-primary)]'
										: 'text-[var(--cardapio-text)]'
								"
							>
								{{ grupo.nome
								}}<span v-if="grupo.obrigatorio" class="text-[var(--cardapio-danger)]">*</span>
							</h3>
							<p class="text-xs mt-0.5 text-[var(--cardapio-text-muted)]">
								{{ grupo.descricao || "Escolha seus adicionais" }}
							</p>
						</div>
						<span
							class="text-xs font-medium whitespace-nowrap"
							:class="
								grupo.adicionais.reduce((acc, a) => acc + getQuantidadeAdicional(a.id), 0) > 0
									? 'text-[var(--cardapio-primary)]'
									: 'text-[var(--cardapio-text-muted)]'
							"
							>{{ grupo.adicionais.reduce((acc, a) => acc + getQuantidadeAdicional(a.id), 0) }}/{{
								grupo.max_selecao
							}}</span
						>
					</label>

					<div v-if="grupoSelecionado === grupo.id" class="space-y-2 pl-2 sm:pl-3">
						<div
							v-if="
								grupo.adicionais.reduce((acc, a) => acc + getQuantidadeAdicional(a.id), 0) <
								grupo.max_selecao
							"
							class="p-2 sm:p-2.5 border-2 border-dashed border-[var(--cardapio-border)] rounded-2xl"
						>
							<UiSelectMenu
								:model-value="null"
								@update:model-value="
									(v) => {
										if (!v) return;
										const q = getQuantidadeAdicional(v as string) + 1;
										const t = grupo.adicionais.reduce((acc, a) => {
											if (a.id === v) return acc + q;
											return acc + getQuantidadeAdicional(a.id);
										}, 0);
										if (t <= grupo.max_selecao) {
											adicionaisSelecionados.set(v as string, q);
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
								placeholder="Adicionar"
								searchPlaceholder="Buscar..."
								:searchable="true"
								size="sm"
							/>
						</div>

						<div
							v-for="adicional in grupo.adicionais.filter((a) => getQuantidadeAdicional(a.id) > 0)"
							:key="adicional.id"
							class="flex items-center justify-between p-2.5 sm:p-3 border-2 border-[var(--cardapio-primary)] rounded-2xl bg-[var(--cardapio-primary)]/10"
						>
							<div class="flex-1 min-w-0">
								<p class="text-sm font-semibold text-[var(--cardapio-text)] truncate">
									{{ adicional.nome }}
									<span class="text-[var(--cardapio-text-muted)]"
										>({{ getQuantidadeAdicional(adicional.id) }}x)</span
									>
								</p>
							</div>
							<div class="flex items-center gap-1.5 sm:gap-2">
								<span
									v-if="adicional.preco > 0"
									class="text-sm font-semibold text-[var(--cardapio-primary)] whitespace-nowrap"
									>+
									{{ formatCurrency(adicional.preco * getQuantidadeAdicional(adicional.id)) }}</span
								>
								<div class="flex items-center gap-1">
									<button
										v-if="adicional.permite_multiplas_unidades"
										type="button"
										class="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg border-2 border-[var(--cardapio-primary)] text-[var(--cardapio-primary)] hover:bg-[var(--cardapio-primary)] hover:text-white transition-colors"
										@click="
											() => {
												const q = getQuantidadeAdicional(adicional.id);
												if (q > 1) {
													adicionaisSelecionados.set(adicional.id, q - 1);
												} else {
													adicionaisSelecionados.delete(adicional.id);
												}
												adicionaisSelecionados = new Map(adicionaisSelecionados);
											}
										"
									>
										<Icon name="lucide:minus" class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
									</button>
									<button
										v-if="adicional.permite_multiplas_unidades"
										type="button"
										class="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg border-2 border-[var(--cardapio-primary)] text-[var(--cardapio-primary)] hover:bg-[var(--cardapio-primary)] hover:text-white transition-colors"
										@click="
											() => {
												const q = getQuantidadeAdicional(adicional.id) + 1;
												const t = grupo.adicionais.reduce((acc, a) => {
													if (a.id === adicional.id) return acc + q;
													return acc + getQuantidadeAdicional(a.id);
												}, 0);
												if (t <= grupo.max_selecao) {
													adicionaisSelecionados.set(adicional.id, q);
													adicionaisSelecionados = new Map(adicionaisSelecionados);
												}
											}
										"
									>
										<Icon name="lucide:plus" class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
									</button>
									<button
										v-if="!adicional.permite_multiplas_unidades"
										type="button"
										class="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
										@click="
											() => {
												adicionaisSelecionados.delete(adicional.id);
												adicionaisSelecionados = new Map(adicionaisSelecionados);
											}
										"
									>
										<Icon name="lucide:trash-2" class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Observações -->
			<div class="space-y-1.5">
				<label class="text-sm font-medium text-[var(--cardapio-text)]">Alguma observação?</label>
				<UiTextarea v-model="observacao" :rows="2" placeholder="Ex: Sem cebola..." />
			</div>
		</div>

		<template #footer>
			<div
				class="p-3 sm:p-4 space-y-3 bg-[var(--cardapio-secondary)] border-t border-[var(--cardapio-border)]"
			>
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<button
							type="button"
							class="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl border border-[var(--cardapio-border)] text-[var(--cardapio-text)] hover:bg-[var(--cardapio-hover)] transition-colors disabled:opacity-50"
							:disabled="quantidade <= 1"
							@click="quantidade--"
						>
							<Icon name="lucide:minus" class="w-4 h-4" />
						</button>
						<span
							class="text-base sm:text-lg font-semibold text-[var(--cardapio-text)] w-10 text-center"
							>{{ quantidade }}</span
						>
						<button
							type="button"
							class="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl border border-[var(--cardapio-primary)] text-[var(--cardapio-primary)] hover:bg-[var(--cardapio-primary)] hover:text-white transition-colors"
							@click="quantidade++"
						>
							<Icon name="lucide:plus" class="w-4 h-4" />
						</button>
					</div>
					<div class="text-right">
						<p class="text-xs text-[var(--cardapio-text-muted)]">Total</p>
						<p class="text-xl font-bold text-[var(--cardapio-primary)]">
							{{ formatCurrency(precoTotal) }}
						</p>
					</div>
				</div>
				<button
					type="button"
					class="w-full py-3 sm:py-3.5 px-4 rounded-2xl font-semibold shadow-lg transition-all flex items-center justify-center gap-2 text-base"
					:class="
						podeAdicionar
							? 'bg-[var(--cardapio-primary)] text-white hover:opacity-90'
							: 'bg-[var(--cardapio-secondary)] text-[var(--cardapio-text-muted)] opacity-50'
					"
					:disabled="!podeAdicionar"
					@click="adicionarAoCarrinho"
				>
					<Icon name="lucide:shopping-cart" class="w-5 h-5" />Adicionar ao carrinho
				</button>
			</div>
		</template>
	</UiBottomSheet>
</template>
