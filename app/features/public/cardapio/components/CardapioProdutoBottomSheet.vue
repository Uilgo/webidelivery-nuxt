<script setup lang="ts">
/**
 * 📌 CardapioProdutoBottomSheet
 * Bottom Sheet mobile com design moderno e funcionalidades completas
 */

import type {
	ProdutoPublico,
	VariacaoPublica,
	GrupoAdicionalPublico,
	CategoriaPublica,
} from "../types/cardapio-publico";
import { useCarrinhoStore } from "~/stores/carrinho";
import { useProdutosSabores } from "../composables/useProdutosSabores";
import { useValidarCupom } from "../composables/useValidarCupom";
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
const { validarCupom, calcularDesconto } = useValidarCupom();

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
const grupoExpandido = ref<string | null>(null);

// Estado para progressive disclosure do footer
const detalhesExpandidos = ref(false);

// Estado para cupom
const cupomInput = ref("");
const cupomAplicado = ref<string | null>(null);
const descontoCupom = ref(0);
const erroCupom = ref<string | null>(null);
const aplicandoCupom = ref(false);

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
			grupoExpandido.value = null;

			// Reseta estados do footer
			detalhesExpandidos.value = false;
			cupomInput.value = "";
			cupomAplicado.value = null;
			descontoCupom.value = 0;
			erroCupom.value = null;
			aplicandoCupom.value = false;

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
const subtotal = computed(() => precoUnitario.value * quantidade.value);
const precoTotal = computed(() => Math.max(0, subtotal.value - descontoCupom.value));

/**
 * Lista detalhada de itens para exibição
 */
const itensDetalhados = computed(() => {
	const itens: Array<{
		tipo: "produto" | "adicional" | "desconto";
		nome: string;
		subtexto?: string;
		quantidade: number;
		precoUnitario: number;
		precoTotal: number;
	}> = [];

	// Produto base com variação
	if (props.produto && variacaoSelecionada.value) {
		itens.push({
			tipo: "produto",
			nome: props.produto.nome,
			subtexto: variacaoSelecionada.value.nome,
			quantidade: quantidade.value,
			precoUnitario: precoVariacao.value,
			precoTotal: precoVariacao.value * quantidade.value,
		});
	}

	// Adicionais selecionados
	for (const grupo of gruposAdicionais.value) {
		for (const adicional of grupo.adicionais) {
			const qtd = adicionaisSelecionados.value.get(adicional.id) ?? 0;
			if (qtd > 0) {
				itens.push({
					tipo: "adicional",
					nome: adicional.nome,
					quantidade: qtd,
					precoUnitario: adicional.preco,
					precoTotal: adicional.preco * qtd,
				});
			}
		}
	}

	return itens;
});

/**
 * Verifica se tem adicionais selecionados
 */
const temAdicionais = computed(() => {
	return itensDetalhados.value.some((item) => item.tipo === "adicional");
});

/**
 * Aplica cupom de desconto
 */
const aplicarCupom = async (): Promise<void> => {
	if (!cupomInput.value.trim()) {
		erroCupom.value = "Digite um código de cupom";
		return;
	}

	try {
		aplicandoCupom.value = true;
		erroCupom.value = null;

		// Valida o cupom usando a função RPC
		const resultado = await validarCupom(
			props.estabelecimentoId,
			cupomInput.value.trim(),
			subtotal.value,
		);

		if (resultado.valido && resultado.tipo) {
			// Cupom válido - calcula o desconto
			const valorDesconto = calcularDesconto(
				resultado.tipo,
				resultado.valor_desconto,
				subtotal.value,
			);

			cupomAplicado.value = cupomInput.value.trim().toUpperCase();
			descontoCupom.value = valorDesconto;
			cupomInput.value = "";
			erroCupom.value = null;
		} else {
			// Cupom inválido - mostra o motivo
			erroCupom.value = resultado.motivo_invalido || "Cupom inválido";
		}
	} catch (error) {
		erroCupom.value = "Erro ao validar cupom. Tente novamente.";
		console.error("Erro ao aplicar cupom:", error);
	} finally {
		aplicandoCupom.value = false;
	}
};

/**
 * Remove cupom aplicado
 */
const removerCupom = (): void => {
	cupomAplicado.value = null;
	descontoCupom.value = 0;
	erroCupom.value = null;
};

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

const alterarAdicional = (
	grupo: GrupoAdicionalPublico,
	adicional: { id: string; preco: number; permite_multiplas_unidades: boolean },
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

const toggleGrupo = (grupoId: string) => {
	const estaExpandindo = grupoExpandido.value !== grupoId;
	grupoExpandido.value = estaExpandindo ? grupoId : null;

	// Se está expandindo, rola o card para o topo após a animação
	if (estaExpandindo) {
		nextTick(() => {
			// Aguarda a animação de expansão (300ms)
			setTimeout(() => {
				const cardElement = document.getElementById(`grupo-${grupoId}`);
				if (cardElement) {
					cardElement.scrollIntoView({
						behavior: "smooth",
						block: "start",
					});
				}
			}, 100);
		});
	}
};

const getGrupoIcon = (nome: string): string => {
	const nomeLower = nome.toLowerCase();
	if (nomeLower.includes("borda")) return "lucide:pizza";
	if (nomeLower.includes("extra") || nomeLower.includes("adicional")) return "lucide:plus-circle";
	if (nomeLower.includes("bebida")) return "lucide:cup-soda";
	if (nomeLower.includes("sobremesa")) return "lucide:cake";
	if (nomeLower.includes("molho")) return "lucide:flame";
	return "lucide:plus-circle";
};

const getGrupoProgressLabel = (grupo: GrupoAdicionalPublico): string => {
	const totalSelecionado = grupo.adicionais.reduce(
		(acc, a) => acc + getQuantidadeAdicional(a.id),
		0,
	);

	if (grupo.min_selecao === 0 && grupo.max_selecao === 1) {
		return totalSelecionado > 0 ? "1 item selecionado" : "Escolha até 1 item";
	}

	if (grupo.min_selecao === 0) {
		return totalSelecionado > 0
			? `${totalSelecionado} de ${grupo.max_selecao} selecionados`
			: `Escolha até ${grupo.max_selecao} itens`;
	}

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

	if (totalSelecionado === 0) {
		return `Escolha de ${grupo.min_selecao} a ${grupo.max_selecao} itens`;
	}
	if (totalSelecionado < grupo.min_selecao) {
		const faltam = grupo.min_selecao - totalSelecionado;
		return `${totalSelecionado} de ${grupo.max_selecao} (faltam ${faltam})`;
	}
	return `${totalSelecionado} de ${grupo.max_selecao} selecionados`;
};

const isGrupoLimiteAtingido = (grupo: GrupoAdicionalPublico): boolean => {
	const totalSelecionado = grupo.adicionais.reduce(
		(acc, a) => acc + getQuantidadeAdicional(a.id),
		0,
	);
	return totalSelecionado >= grupo.max_selecao;
};

const getTotalSelecionadoGrupo = (grupo: GrupoAdicionalPublico): number => {
	return grupo.adicionais.reduce((acc, a) => acc + getQuantidadeAdicional(a.id), 0);
};

/**
 * Toggle expandir detalhes com scroll automático
 */
const toggleDetalhes = () => {
	const estaExpandindo = !detalhesExpandidos.value;
	detalhesExpandidos.value = estaExpandindo;

	// Se está expandindo, rola o botão para o topo após a animação
	if (estaExpandindo) {
		nextTick(() => {
			setTimeout(() => {
				const buttonElement = document.getElementById("detalhes-button");
				if (buttonElement) {
					buttonElement.scrollIntoView({
						behavior: "smooth",
						block: "start",
					});
				}
			}, 100);
		});
	}
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
		<div v-if="produto" class="space-y-3 px-3 py-3 pb-6">
			<!-- Header com Nome e Preço -->
			<div class="text-center pb-2 border-b border-[var(--cardapio-border)]">
				<h2 class="text-xl font-bold text-[var(--cardapio-text)]">{{ produto.nome }}</h2>
				<p class="text-sm text-[var(--cardapio-text-muted)] mt-1">
					<span v-if="variacaoSelecionada" class="font-semibold text-[var(--cardapio-primary)]">
						{{ formatCurrency(precoVariacao) }}
					</span>
					<span v-if="variacaoSelecionada" class="mx-1.5">•</span>
					<span>{{ variacaoSelecionada?.nome || "Selecione uma opção" }}</span>
				</p>
			</div>

			<!-- Imagem -->
			<div
				v-if="produto.imagem_url"
				class="relative w-full h-48 rounded-2xl overflow-hidden bg-[var(--cardapio-secondary)] shadow-lg"
			>
				<img
					:src="produto.imagem_url"
					:alt="produto.nome"
					class="w-full h-full object-cover"
					loading="lazy"
				/>
				<div
					class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"
				/>
			</div>

			<!-- Badges do produto -->
			<div v-if="produto.destaque || produto.em_promocao" class="flex flex-wrap gap-2">
				<!-- Badge Destaque -->
				<div
					v-if="produto.destaque"
					class="px-2.5 py-1 bg-gradient-to-r from-[var(--cardapio-highlight-from)] to-[var(--cardapio-highlight-to)] text-[var(--cardapio-highlight-text)] text-xs font-semibold rounded-full shadow-md flex items-center gap-1"
				>
					<Icon name="lucide:star" class="w-3 h-3" />
					Destaque
				</div>

				<!-- Badge Promoção -->
				<div
					v-if="produto.em_promocao"
					class="px-2.5 py-1 bg-gradient-to-r from-[var(--cardapio-promo-from)] to-[var(--cardapio-promo-to)] text-[var(--cardapio-promo-text)] text-xs font-semibold rounded-full shadow-md flex items-center gap-1"
				>
					<Icon name="lucide:tag" class="w-3 h-3" />
					Promoção
				</div>
			</div>

			<!-- Descrição -->
			<div
				v-if="produto.descricao"
				class="p-3 rounded-xl bg-[var(--cardapio-secondary)]/50 border border-[var(--cardapio-border)]"
			>
				<div class="flex items-center gap-2 mb-1.5">
					<Icon name="lucide:info" class="w-3.5 h-3.5 text-[var(--cardapio-primary)]" />
					<h3 class="text-xs font-semibold text-[var(--cardapio-text)]">Sobre este produto</h3>
				</div>
				<p class="text-xs text-[var(--cardapio-text-muted)] leading-relaxed">
					{{ produto.descricao }}
				</p>
			</div>

			<!-- Variações em Cards -->
			<div v-if="produto.variacoes.length > 1" class="space-y-2">
				<div class="flex items-center gap-2">
					<Icon name="lucide:ruler" class="w-3.5 h-3.5 text-[var(--cardapio-primary)]" />
					<h3 class="text-xs font-semibold text-[var(--cardapio-text)]">
						Escolha o tamanho <span class="text-[var(--cardapio-danger)]">*</span>
					</h3>
				</div>
				<div class="grid grid-cols-1 gap-2">
					<button
						v-for="(variacao, index) in produto.variacoes"
						:key="variacao.id"
						type="button"
						class="relative flex items-center gap-3 p-3 border-2 rounded-xl transition-all duration-200 text-left"
						:class="[
							variacaoSelecionadaId === variacao.id
								? 'border-[var(--cardapio-primary)] bg-gradient-to-r from-[var(--cardapio-primary)]/10 to-transparent'
								: 'border-[var(--cardapio-border)] bg-[var(--cardapio-secondary)]',
						]"
						@click="variacaoSelecionadaId = variacao.id"
					>
						<div
							class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
							:class="[
								variacaoSelecionadaId === variacao.id
									? 'bg-[var(--cardapio-primary)] text-white'
									: 'bg-[var(--cardapio-background)] text-[var(--cardapio-text-muted)]',
							]"
						>
							{{ index + 1 }}
						</div>
						<div class="flex-1 min-w-0">
							<p
								class="font-semibold text-sm truncate"
								:class="[
									variacaoSelecionadaId === variacao.id
										? 'text-[var(--cardapio-primary)]'
										: 'text-[var(--cardapio-text)]',
								]"
							>
								{{ variacao.nome }}
							</p>
							<p class="text-xs text-[var(--cardapio-text-muted)]">
								{{ formatCurrency(variacao.preco_promocional ?? variacao.preco) }}
							</p>
						</div>
						<div
							v-if="variacaoSelecionadaId === variacao.id"
							class="w-5 h-5 rounded-full bg-[var(--cardapio-primary)] flex items-center justify-center flex-shrink-0"
						>
							<Icon name="lucide:check" class="w-3 h-3 text-white" />
						</div>
					</button>
				</div>
			</div>

			<!-- Múltiplos Sabores -->
			<div v-if="produtosDisponiveisFiltrados.length > 0" class="space-y-3">
				<!-- Toggle Switch -->
				<div
					class="p-3 rounded-xl border-2 transition-all duration-200"
					:class="[
						multiplosSabores
							? 'border-[var(--cardapio-primary)] bg-gradient-to-r from-[var(--cardapio-primary)]/5 to-transparent'
							: 'border-[var(--cardapio-border)] bg-[var(--cardapio-secondary)]',
					]"
				>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2.5">
							<div
								class="w-9 h-9 rounded-lg flex items-center justify-center"
								:class="[
									multiplosSabores
										? 'bg-[var(--cardapio-primary)] text-white'
										: 'bg-[var(--cardapio-background)] text-[var(--cardapio-text-muted)]',
								]"
							>
								<Icon name="lucide:git-compare" class="w-4 h-4" />
							</div>
							<div>
								<h3 class="font-semibold text-sm text-[var(--cardapio-text)]">
									Quer dividir seu sabor?
								</h3>
								<p class="text-[10px] text-[var(--cardapio-text-muted)]">
									Personalize com até 4 sabores
								</p>
							</div>
						</div>

						<button
							type="button"
							class="relative w-11 h-6 rounded-full transition-colors duration-200"
							:class="[
								multiplosSabores ? 'bg-[var(--cardapio-primary)]' : 'bg-[var(--cardapio-border)]',
							]"
							@click="multiplosSabores = !multiplosSabores"
						>
							<span
								class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200"
								:class="multiplosSabores ? 'translate-x-5' : 'translate-x-0'"
							/>
						</button>
					</div>
				</div>

				<!-- Conteúdo quando ativado -->
				<div v-if="multiplosSabores" class="space-y-3 animate-in slide-in-from-top-2 duration-300">
					<!-- Segmented Control -->
					<div>
						<label class="text-xs font-medium text-[var(--cardapio-text)] mb-2 block">
							Quantos sabores? <span class="text-[var(--cardapio-danger)]">*</span>
						</label>
						<div class="flex p-0.5 bg-[var(--cardapio-secondary)] rounded-lg">
							<button
								v-for="opcao in opcoesSabores"
								:key="opcao.value"
								type="button"
								class="flex-1 py-2 px-2 rounded-md text-xs font-medium transition-all duration-200"
								:class="[
									quantidadeSabores === opcao.value
										? 'bg-[var(--cardapio-primary)] text-white shadow-sm'
										: 'text-[var(--cardapio-text-muted)]',
								]"
								@click="quantidadeSabores = opcao.value as 2 | 3 | 4"
							>
								{{ opcao.label }}
							</button>
						</div>
					</div>

					<!-- Lista de sabores -->
					<div class="space-y-2">
						<label class="text-xs font-medium text-[var(--cardapio-text)] block"
							>Escolha os sabores</label
						>

						<div v-if="carregandoProdutos" class="text-center py-4">
							<Icon
								name="lucide:loader-2"
								class="w-5 h-5 animate-spin text-[var(--cardapio-primary)] mx-auto"
							/>
						</div>

						<div v-else class="space-y-2">
							<!-- Slot 1: Produto atual -->
							<div
								class="flex items-center gap-2.5 p-3 border-2 rounded-xl bg-gradient-to-r from-[var(--cardapio-primary)]/10 to-transparent border-[var(--cardapio-primary)]"
							>
								<div
									class="w-7 h-7 rounded-full bg-[var(--cardapio-primary)] flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
								>
									1
								</div>
								<div class="flex-1 min-w-0">
									<p class="text-xs font-semibold text-[var(--cardapio-text)] truncate">
										{{ produto?.nome }}
									</p>
									<p class="text-[10px] text-[var(--cardapio-text-muted)]">Sabor principal</p>
								</div>
								<Icon name="lucide:lock" class="w-4 h-4 text-[var(--cardapio-primary)]" />
							</div>

							<!-- Slots 2, 3, 4 -->
							<div
								v-for="index in maxSaboresAdicionais"
								:key="index"
								class="flex items-center gap-2.5 p-3 border-2 rounded-xl transition-all duration-200"
								:class="[
									saboresSelecionados[index - 1]
										? 'border-[var(--cardapio-primary)] bg-gradient-to-r from-[var(--cardapio-primary)]/10 to-transparent'
										: 'border-[var(--cardapio-border)] bg-[var(--cardapio-secondary)]',
								]"
							>
								<div
									class="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0"
									:class="[
										saboresSelecionados[index - 1]
											? 'bg-[var(--cardapio-primary)] text-white'
											: 'bg-[var(--cardapio-background)] text-[var(--cardapio-text-muted)]',
									]"
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
										class="ml-1 px-2 py-1 text-[10px] font-medium text-[var(--cardapio-primary)] border border-[var(--cardapio-primary)] rounded-md"
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
								<div v-else class="flex-1 min-w-0 relative">
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
										class="select-menu-force-upward"
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Grupos de Adicionais -->
			<div v-if="gruposAdicionais.length > 0" class="space-y-3">
				<div class="flex items-center gap-2">
					<Icon name="lucide:plus-circle" class="w-3.5 h-3.5 text-[var(--cardapio-primary)]" />
					<h3 class="text-xs font-semibold text-[var(--cardapio-text)]">Personalize seu pedido</h3>
				</div>

				<div class="space-y-2">
					<div
						v-for="grupo in gruposAdicionais"
						:id="`grupo-${grupo.id}`"
						:key="grupo.id"
						class="border-2 rounded-xl overflow-hidden transition-all duration-200"
						:class="[
							grupoExpandido === grupo.id
								? 'border-[var(--cardapio-primary)]'
								: 'border-[var(--cardapio-border)]',
						]"
					>
						<button
							type="button"
							class="w-full flex items-center gap-2.5 p-3 text-left transition-colors"
							:class="[
								grupoExpandido === grupo.id
									? 'bg-gradient-to-r from-[var(--cardapio-primary)]/10 to-transparent'
									: 'bg-[var(--cardapio-secondary)]',
							]"
							@click="toggleGrupo(grupo.id)"
						>
							<div
								class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
								:class="[
									grupoExpandido === grupo.id
										? 'bg-[var(--cardapio-primary)] text-white'
										: 'bg-[var(--cardapio-background)] text-[var(--cardapio-text-muted)]',
								]"
							>
								<Icon :name="getGrupoIcon(grupo.nome)" class="w-4 h-4" />
							</div>

							<div class="flex-1 min-w-0">
								<h4
									class="font-semibold text-sm"
									:class="[
										grupoExpandido === grupo.id
											? 'text-[var(--cardapio-primary)]'
											: 'text-[var(--cardapio-text)]',
									]"
								>
									{{ grupo.nome }}
									<span v-if="grupo.obrigatorio" class="text-[var(--cardapio-danger)]">*</span>
								</h4>
								<p class="text-[10px] text-[var(--cardapio-text-muted)]">
									{{ getGrupoProgressLabel(grupo) }}
								</p>
							</div>

							<Icon
								name="lucide:chevron-down"
								class="w-4 h-4 text-[var(--cardapio-text-muted)] transition-transform duration-200"
								:class="{ 'rotate-180': grupoExpandido === grupo.id }"
							/>
						</button>

						<div
							v-if="grupoExpandido === grupo.id"
							class="p-3 space-y-2 animate-in slide-in-from-top-2 duration-200"
						>
							<div
								v-if="!isGrupoLimiteAtingido(grupo)"
								class="p-2 border-2 border-dashed border-[var(--cardapio-border)] rounded-lg bg-[var(--cardapio-secondary)]/50 relative"
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
									class="select-menu-force-upward"
								/>
							</div>

							<div
								v-for="adicional in grupo.adicionais.filter(
									(a) => getQuantidadeAdicional(a.id) > 0,
								)"
								:key="adicional.id"
								class="flex items-center justify-between p-2.5 border-2 border-[var(--cardapio-primary)] rounded-lg bg-gradient-to-r from-[var(--cardapio-primary)]/10 to-transparent"
							>
								<div class="flex-1 min-w-0">
									<p class="text-xs font-semibold text-[var(--cardapio-text)]">
										{{ adicional.nome }}
										<span class="text-[var(--cardapio-text-muted)] font-normal">
											({{ getQuantidadeAdicional(adicional.id) }}x)
										</span>
									</p>
								</div>
								<div class="flex items-center gap-1.5">
									<span
										v-if="adicional.preco > 0"
										class="text-xs font-semibold text-[var(--cardapio-primary)] whitespace-nowrap"
									>
										+ {{ formatCurrency(adicional.preco * getQuantidadeAdicional(adicional.id)) }}
									</span>
									<div class="flex items-center gap-0.5">
										<button
											v-if="adicional.permite_multiplas_unidades"
											type="button"
											class="w-7 h-7 flex items-center justify-center rounded-md border-2 border-[var(--cardapio-primary)] text-[var(--cardapio-primary)] hover:bg-[var(--cardapio-primary)] hover:text-white transition-colors"
											@click="alterarAdicional(grupo, adicional, -1)"
										>
											<Icon name="lucide:minus" class="w-3 h-3" />
										</button>
										<button
											v-if="adicional.permite_multiplas_unidades"
											type="button"
											class="w-7 h-7 flex items-center justify-center rounded-md border-2 border-[var(--cardapio-primary)] text-[var(--cardapio-primary)] hover:bg-[var(--cardapio-primary)] hover:text-white transition-colors"
											@click="alterarAdicional(grupo, adicional, 1)"
										>
											<Icon name="lucide:plus" class="w-3 h-3" />
										</button>
										<button
											type="button"
											class="w-7 h-7 flex items-center justify-center rounded-md bg-[var(--cardapio-danger)] text-white hover:bg-[var(--cardapio-danger)]/80 transition-colors"
											@click="
												() => {
													adicionaisSelecionados.delete(adicional.id);
													adicionaisSelecionados = new Map(adicionaisSelecionados);
												}
											"
										>
											<Icon name="lucide:trash-2" class="w-3 h-3" />
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Observações -->
			<div class="space-y-2">
				<div class="flex items-center gap-2">
					<Icon name="lucide:message-square" class="w-3.5 h-3.5 text-[var(--cardapio-primary)]" />
					<h3 class="text-xs font-semibold text-[var(--cardapio-text)]">Alguma observação?</h3>
				</div>
				<UiTextarea v-model="observacao" :rows="2" placeholder="Ex: Sem cebola..." />
				<p class="text-[10px] text-[var(--cardapio-text-muted)] flex items-center gap-1">
					<Icon name="lucide:info" class="w-3 h-3" />
					O estabelecimento fará o possível para atender
				</p>
			</div>

			<!-- Seção de Cupom -->
			<div class="space-y-2">
				<div class="flex items-center gap-2">
					<Icon name="lucide:ticket" class="w-3.5 h-3.5 text-[var(--cardapio-primary)]" />
					<h3 class="text-xs font-semibold text-[var(--cardapio-text)]">Cupom de desconto</h3>
				</div>

				<!-- Input de cupom (quando não tem cupom aplicado) -->
				<div v-if="!cupomAplicado" class="space-y-2">
					<div class="flex gap-2">
						<input
							v-model="cupomInput"
							type="text"
							placeholder="Digite o código"
							class="flex-1 px-3 py-2.5 text-xs rounded-lg border-2 transition-all bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:border-[var(--cardapio-primary)] focus:outline-none uppercase"
							:disabled="aplicandoCupom"
							@input="cupomInput = ($event.target as HTMLInputElement).value.toUpperCase()"
							@keyup.enter="aplicarCupom"
						/>
						<button
							type="button"
							class="px-4 py-2.5 text-xs font-semibold rounded-lg transition-all"
							:class="[
								aplicandoCupom
									? 'bg-[var(--cardapio-border)] text-[var(--cardapio-text-muted)] cursor-wait'
									: 'bg-[var(--cardapio-primary)] text-white hover:opacity-90',
							]"
							:disabled="aplicandoCupom || !cupomInput.trim()"
							@click="aplicarCupom"
						>
							<Icon v-if="aplicandoCupom" name="lucide:loader-2" class="w-3.5 h-3.5 animate-spin" />
							<span v-else>Aplicar</span>
						</button>
					</div>

					<!-- Mensagem de erro -->
					<p
						v-if="erroCupom"
						class="text-[10px] text-[var(--cardapio-danger)] flex items-center gap-1 px-1"
					>
						<Icon name="lucide:alert-circle" class="w-3 h-3" />
						{{ erroCupom }}
					</p>
				</div>

				<!-- Cupom aplicado -->
				<div
					v-else
					class="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-[var(--cardapio-success)]/10 to-transparent border-2 border-[var(--cardapio-success)]"
				>
					<div class="flex items-center gap-2.5">
						<div
							class="w-8 h-8 rounded-full bg-[var(--cardapio-success)] flex items-center justify-center flex-shrink-0"
						>
							<Icon name="lucide:check" class="w-4 h-4 text-white" />
						</div>
						<div>
							<p class="text-xs font-semibold text-[var(--cardapio-text)]">
								{{ cupomAplicado }}
							</p>
							<p class="text-xs text-[var(--cardapio-success)] font-bold">
								{{
									descontoCupom > 0
										? `-${formatCurrency(descontoCupom)} de desconto`
										: "Frete grátis aplicado"
								}}
							</p>
						</div>
					</div>
					<button
						type="button"
						class="text-xs font-medium text-[var(--cardapio-danger)] hover:underline px-2"
						@click="removerCupom"
					>
						Remover
					</button>
				</div>
			</div>

			<!-- Seção Ver Detalhes (Progressive Disclosure) -->
			<div v-if="temAdicionais || cupomAplicado" class="space-y-2">
				<!-- Botão para expandir/colapsar -->
				<button
					id="detalhes-button"
					type="button"
					class="w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all"
					:class="[
						detalhesExpandidos
							? 'border-[var(--cardapio-primary)] bg-gradient-to-r from-[var(--cardapio-primary)]/5 to-transparent'
							: 'border-[var(--cardapio-border)] bg-[var(--cardapio-secondary)] hover:border-[var(--cardapio-primary)]/50',
					]"
					@click="toggleDetalhes"
				>
					<div class="flex items-center gap-2.5">
						<div
							class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
							:class="[
								detalhesExpandidos
									? 'bg-[var(--cardapio-primary)] text-white'
									: 'bg-[var(--cardapio-background)] text-[var(--cardapio-text-muted)]',
							]"
						>
							<Icon name="lucide:receipt" class="w-4 h-4" />
						</div>
						<div class="text-left">
							<p
								class="text-xs font-semibold"
								:class="[
									detalhesExpandidos
										? 'text-[var(--cardapio-primary)]'
										: 'text-[var(--cardapio-text)]',
								]"
							>
								{{ detalhesExpandidos ? "Ocultar detalhes" : "Ver detalhes" }}
							</p>
							<p class="text-[10px] text-[var(--cardapio-text-muted)]">Resumo do seu pedido</p>
						</div>
					</div>
					<Icon
						name="lucide:chevron-down"
						class="w-4 h-4 text-[var(--cardapio-text-muted)] transition-transform duration-300"
						:class="{ 'rotate-180': detalhesExpandidos }"
					/>
				</button>

				<!-- Detalhes expandidos -->
				<div
					v-if="detalhesExpandidos"
					class="space-y-2 p-3 rounded-lg bg-[var(--cardapio-secondary)]/50 border border-[var(--cardapio-border)] animate-in slide-in-from-top-2 duration-300"
				>
					<!-- Lista de itens -->
					<div
						v-for="(item, index) in itensDetalhados"
						:key="index"
						class="flex items-start justify-between text-xs pb-2 border-b border-[var(--cardapio-border)] last:border-0 last:pb-0"
					>
						<div class="flex-1 min-w-0 pr-2">
							<p class="font-semibold text-[var(--cardapio-text)]">
								{{ item.nome }}
								<span
									v-if="item.quantidade > 1"
									class="text-[var(--cardapio-text-muted)] font-normal"
								>
									({{ item.quantidade }}x)
								</span>
							</p>
							<p v-if="item.subtexto" class="text-[10px] text-[var(--cardapio-text-muted)] mt-0.5">
								{{ item.subtexto }}
							</p>
						</div>
						<p class="font-bold text-[var(--cardapio-text)] whitespace-nowrap">
							{{ formatCurrency(item.precoTotal) }}
						</p>
					</div>

					<!-- Subtotal (se tiver desconto) -->
					<div
						v-if="cupomAplicado && descontoCupom > 0"
						class="flex items-center justify-between text-xs pt-2 border-t-2 border-[var(--cardapio-border)]"
					>
						<p class="font-medium text-[var(--cardapio-text)]">Subtotal</p>
						<p class="font-bold text-[var(--cardapio-text)]">{{ formatCurrency(subtotal) }}</p>
					</div>

					<!-- Desconto do cupom -->
					<div
						v-if="cupomAplicado && descontoCupom > 0"
						class="flex items-center justify-between text-xs"
					>
						<p class="text-[var(--cardapio-success)] font-medium flex items-center gap-1">
							<Icon name="lucide:tag" class="w-3.5 h-3.5" />
							Cupom {{ cupomAplicado }}
						</p>
						<p class="font-bold text-[var(--cardapio-success)]">
							-{{ formatCurrency(descontoCupom) }}
						</p>
					</div>

					<!-- Total final -->
					<div
						class="flex items-center justify-between text-sm pt-2 border-t-2 border-[var(--cardapio-border)]"
					>
						<p class="font-bold text-[var(--cardapio-text)]">Total</p>
						<p class="font-bold text-base text-[var(--cardapio-primary)]">
							{{ formatCurrency(precoTotal) }}
						</p>
					</div>
				</div>
			</div>
		</div>

		<template #footer>
			<div class="p-4 bg-[var(--cardapio-secondary)] border-t border-[var(--cardapio-border)]">
				<div class="flex items-center justify-between mb-3">
					<div class="flex items-center gap-2">
						<button
							type="button"
							class="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--cardapio-border)] text-[var(--cardapio-text)] hover:border-[var(--cardapio-primary)] hover:text-[var(--cardapio-primary)] transition-colors disabled:opacity-50"
							:disabled="quantidade <= 1"
							@click="quantidade--"
						>
							<Icon name="lucide:minus" class="w-4 h-4" />
						</button>
						<span class="text-base font-bold text-[var(--cardapio-text)] w-8 text-center">
							{{ quantidade }}
						</span>
						<button
							type="button"
							class="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--cardapio-primary)] text-[var(--cardapio-primary)] hover:bg-[var(--cardapio-primary)] hover:text-white transition-colors"
							@click="quantidade++"
						>
							<Icon name="lucide:plus" class="w-4 h-4" />
						</button>
					</div>
					<div class="text-right">
						<p class="text-[10px] text-[var(--cardapio-text-muted)]">Total</p>
						<p class="text-lg font-bold text-[var(--cardapio-primary)]">
							{{ formatCurrency(precoTotal) }}
						</p>
					</div>
				</div>
				<button
					type="button"
					class="w-full py-3 px-4 rounded-xl font-semibold shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
					:class="[
						podeAdicionar
							? 'bg-[var(--cardapio-primary)] text-white hover:opacity-90 active:scale-[0.98]'
							: 'bg-[var(--cardapio-border)] text-[var(--cardapio-text-muted)] opacity-50',
					]"
					:disabled="!podeAdicionar"
					@click="adicionarAoCarrinho"
				>
					<Icon name="lucide:shopping-cart" class="w-4 h-4" />
					Adicionar ao carrinho
				</button>
			</div>
		</template>
	</UiBottomSheet>
</template>

<style scoped>
@keyframes slide-in-from-top {
	from {
		opacity: 0;
		transform: translateY(-8px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.animate-in {
	animation-fill-mode: both;
}

.slide-in-from-top-2 {
	animation-name: slide-in-from-top;
	animation-duration: 200ms;
}
</style>
