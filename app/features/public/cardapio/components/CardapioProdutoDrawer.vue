<script setup lang="ts">
/**
 * 📌 CardapioProdutoDrawer
 *
 * Drawer para visualização e personalização de produto.
 * Permite selecionar variação, adicionais e quantidade.
 * Design moderno com cards, accordions e interações suaves.
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

// Store do carrinho
const carrinhoStore = useCarrinhoStore();

// Composable para buscar produtos
const { buscarProdutosPorCategoriaPai } = useProdutosSabores();

// Composable para validar cupons
const { validarCupom, calcularDesconto } = useValidarCupom();

// Estado local
const variacaoSelecionadaId = ref<string | null>(null);
const adicionaisSelecionados = ref<Map<string, number>>(new Map());
const observacao = ref("");
const quantidade = ref(1);

// Estado para múltiplos sabores
const multiplosSabores = ref(false);
const quantidadeSabores = ref<number>(2);
const saboresSelecionados = ref<string[]>([]);

// Estado para produtos disponíveis (carregados dinamicamente)
const produtosDisponiveis = ref<ProdutoPublico[]>([]);
const carregandoProdutos = ref(false);

// Estado para grupos de adicionais (carregados dinamicamente)
const gruposAdicionais = ref<GrupoAdicionalPublico[]>([]);

// Estado para controlar qual grupo está expandido
const grupoExpandido = ref<string | null>(null);

// Estado para scroll do header
const isScrolled = ref(false);

// Estado para progressive disclosure do footer
const detalhesExpandidos = ref(false);

// Estado para cupom
const cupomInput = ref("");
const cupomAplicado = ref<string | null>(null);
const descontoCupom = ref(0);
const erroCupom = ref<string | null>(null);
const aplicandoCupom = ref(false);

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
			grupoExpandido.value = null;
			isScrolled.value = false;

			// Reseta estados do footer
			detalhesExpandidos.value = false;
			cupomInput.value = "";
			cupomAplicado.value = null;
			descontoCupom.value = 0;
			erroCupom.value = null;
			aplicandoCupom.value = false;

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
 * Opções de quantidade de sabores (dinâmico baseado no produto)
 */
const opcoesSabores = computed(() => {
	if (!props.produto?.permite_divisao_sabores) return [];

	const max = props.produto.max_sabores_divisao;
	const opcoes = [];

	for (let i = 2; i <= max; i++) {
		opcoes.push({
			value: i,
			label: `${i} sabores`,
		});
	}

	return opcoes;
});

/**
 * Encontra a categoria pai do produto atual
 */
const categoriaPai = computed<CategoriaPublica | null>(() => {
	if (!props.produto) return null;

	// Busca a categoria do produto
	const categoriaAtual = props.categorias.find((c) => c.id === props.produto!.categoria_id);
	if (!categoriaAtual) {
		return null;
	}

	// Se tem categoria_pai_id, busca a categoria pai
	if (categoriaAtual.categoria_pai_id) {
		const pai = props.categorias.find((c) => c.id === categoriaAtual.categoria_pai_id);
		return pai ?? null;
	}

	// Se não tem pai, ela mesma é a categoria pai (categoria raiz)
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

	for (const grupo of gruposAdicionais.value) {
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
 * Subtotal antes do desconto (unitário * quantidade)
 */
const subtotal = computed(() => precoUnitario.value * quantidade.value);

/**
 * Preço total (subtotal - desconto do cupom)
 */
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
					quantidade: qtd, // Usa apenas a quantidade selecionada pelo usuário
					precoUnitario: adicional.preco,
					precoTotal: adicional.preco * qtd, // Não multiplica pela quantidade do produto
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

	for (const grupo of gruposAdicionais.value) {
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

/**
 * Handler de scroll para efeito no header
 */
const handleScroll = (event: Event) => {
	const target = event.target as HTMLElement;
	isScrolled.value = target.scrollTop > 20;
};

/**
 * Toggle expandir grupo com scroll automático
 */
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

/**
 * Obtém ícone para o grupo de adicionais
 */
const getGrupoIcon = (nome: string): string => {
	const nomeLower = nome.toLowerCase();
	if (nomeLower.includes("borda")) return "lucide:pizza";
	if (nomeLower.includes("extra") || nomeLower.includes("adicional")) return "lucide:plus-circle";
	if (nomeLower.includes("bebida")) return "lucide:cup-soda";
	if (nomeLower.includes("sobremesa")) return "lucide:cake";
	if (nomeLower.includes("molho")) return "lucide:flame";
	return "lucide:plus-circle";
};

/**
 * Obtém label de progresso do grupo
 */
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

/**
 * Verifica se grupo atingiu o limite
 */
const isGrupoLimiteAtingido = (grupo: GrupoAdicionalPublico): boolean => {
	const totalSelecionado = grupo.adicionais.reduce(
		(acc, a) => acc + getQuantidadeAdicional(a.id),
		0,
	);
	return totalSelecionado >= grupo.max_selecao;
};

/**
 * Obtém total selecionado do grupo
 */
const getTotalSelecionadoGrupo = (grupo: GrupoAdicionalPublico): number => {
	return grupo.adicionais.reduce((acc, a) => acc + getQuantidadeAdicional(a.id), 0);
};

/**
 * Toggle expandir detalhes com scroll automático
 */
const toggleDetalhes = (): void => {
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
	<UiDrawer v-model="isOpen" size="lg" class="cardapio-theme-bridge">
		<template #header>
			<div class="flex-1 min-w-0">
				<h2 class="text-2xl font-bold text-[var(--cardapio-text)] leading-tight mb-2">
					{{ produto?.nome }}
				</h2>
				<div class="flex items-center gap-2">
					<div
						class="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--cardapio-primary)]/10 rounded-full"
					>
						<Icon name="lucide:tag" class="w-3.5 h-3.5 text-[var(--cardapio-primary)]" />
						<span class="text-sm font-bold text-[var(--cardapio-primary)]">
							{{ formatCurrency(precoVariacao) }}
						</span>
					</div>
					<span v-if="variacaoSelecionada" class="text-sm text-[var(--cardapio-text-muted)]">
						{{ variacaoSelecionada.nome }}
					</span>
				</div>
			</div>
		</template>

		<template v-if="produto">
			<div class="relative h-full flex flex-col">
				<!-- Conteúdo Scrollável -->
				<div class="flex-1 overflow-y-auto" @scroll="handleScroll">
					<div class="space-y-4 px-3 py-3">
						<!-- Seção da Imagem -->
						<div
							v-if="produto.imagem_url"
							class="relative w-full h-48 rounded-2xl overflow-hidden bg-[var(--cardapio-secondary)] shadow-lg"
						>
							<img
								:src="produto.imagem_url"
								:alt="produto.nome"
								class="w-full h-full object-cover"
							/>
							<!-- Overlay gradiente -->
							<div
								class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
							/>
						</div>

						<!-- Badges do produto -->
						<div v-if="produto.destaque || produto.em_promocao" class="flex flex-wrap gap-2">
							<!-- Badge Destaque -->
							<div
								v-if="produto.destaque"
								class="px-3 py-1.5 bg-gradient-to-r from-[var(--cardapio-highlight-from)] to-[var(--cardapio-highlight-to)] text-[var(--cardapio-highlight-text)] text-xs font-semibold rounded-full shadow-md flex items-center gap-1.5"
							>
								<Icon name="lucide:star" class="w-3.5 h-3.5" />
								Destaque
							</div>

							<!-- Badge Promoção -->
							<div
								v-if="produto.em_promocao"
								class="px-3 py-1.5 bg-gradient-to-r from-[var(--cardapio-promo-from)] to-[var(--cardapio-promo-to)] text-[var(--cardapio-promo-text)] text-xs font-semibold rounded-full shadow-md flex items-center gap-1.5"
							>
								<Icon name="lucide:tag" class="w-3.5 h-3.5" />
								Promoção
							</div>
						</div>

						<!-- Seção Descrição -->
						<div
							v-if="produto.descricao"
							class="p-4 rounded-2xl bg-[var(--cardapio-secondary)]/50 border border-[var(--cardapio-border)]"
						>
							<div class="flex items-center gap-2 mb-2">
								<Icon name="lucide:info" class="w-4 h-4 text-[var(--cardapio-primary)]" />
								<h3 class="text-sm font-semibold text-[var(--cardapio-text)]">
									Sobre este produto
								</h3>
							</div>
							<p class="text-sm text-[var(--cardapio-text-muted)] leading-relaxed">
								{{ produto.descricao }}
							</p>
						</div>

						<!-- Seção Variações em Cards -->
						<div v-if="produto.variacoes.length > 1" class="space-y-3">
							<div class="flex items-center gap-2 mb-3">
								<Icon name="lucide:ruler" class="w-4 h-4 text-[var(--cardapio-primary)]" />
								<h3 class="text-sm font-semibold text-[var(--cardapio-text)]">
									Escolha o tamanho
									<span class="text-[var(--cardapio-danger)]">*</span>
								</h3>
							</div>
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<button
									v-for="(variacao, index) in produto.variacoes"
									:key="variacao.id"
									type="button"
									class="relative flex items-center gap-3 p-4 border-2 rounded-xl transition-all duration-200 text-left group"
									:class="[
										variacaoSelecionadaId === variacao.id
											? 'border-[var(--cardapio-primary)] bg-gradient-to-br from-[var(--cardapio-primary)]/10 to-transparent shadow-lg'
											: 'border-[var(--cardapio-border)] bg-[var(--cardapio-secondary)] hover:border-[var(--cardapio-primary)]/50 hover:shadow-md',
									]"
									@click="variacaoSelecionadaId = variacao.id"
								>
									<!-- Número -->
									<div
										class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm transition-colors"
										:class="[
											variacaoSelecionadaId === variacao.id
												? 'bg-[var(--cardapio-primary)] text-white'
												: 'bg-[var(--cardapio-background)] text-[var(--cardapio-text-muted)]',
										]"
									>
										{{ index + 1 }}
									</div>

									<!-- Info -->
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
										<p class="text-xs text-[var(--cardapio-text-muted)] mt-0.5">
											{{ formatCurrency(variacao.preco_promocional ?? variacao.preco) }}
										</p>
									</div>

									<!-- Check indicator -->
									<div
										v-if="variacaoSelecionadaId === variacao.id"
										class="w-6 h-6 rounded-full bg-[var(--cardapio-primary)] flex items-center justify-center flex-shrink-0"
									>
										<Icon name="lucide:check" class="w-4 h-4 text-white" />
									</div>
								</button>
							</div>
						</div>

						<!-- Seção Múltiplos Sabores (condicional) -->
						<div
							v-if="produto?.permite_divisao_sabores && produtosDisponiveisFiltrados.length > 0"
							class="border-2 rounded-2xl overflow-hidden transition-all duration-200"
							:class="[
								multiplosSabores
									? 'border-[var(--cardapio-primary)] shadow-lg'
									: 'border-[var(--cardapio-border)] hover:border-[var(--cardapio-primary)]/50',
							]"
						>
							<!-- Header do Accordion -->
							<button
								type="button"
								class="w-full flex items-center gap-3 p-4 text-left transition-colors"
								:class="[
									multiplosSabores
										? 'bg-gradient-to-r from-[var(--cardapio-primary)]/10 to-transparent'
										: 'bg-[var(--cardapio-secondary)]',
								]"
								@click="multiplosSabores = !multiplosSabores"
							>
								<!-- Ícone -->
								<div
									class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
									:class="[
										multiplosSabores
											? 'bg-[var(--cardapio-primary)] text-white'
											: 'bg-[var(--cardapio-background)] text-[var(--cardapio-text-muted)]',
									]"
								>
									<Icon name="lucide:git-compare" class="w-5 h-5" />
								</div>

								<!-- Info -->
								<div class="flex-1 min-w-0">
									<h4
										class="font-semibold text-sm"
										:class="[
											multiplosSabores
												? 'text-[var(--cardapio-primary)]'
												: 'text-[var(--cardapio-text)]',
										]"
									>
										Quer dividir seu sabor?
									</h4>
									<p class="text-xs text-[var(--cardapio-text-muted)] mt-0.5">
										Personalize com até {{ produto.max_sabores_divisao }} sabores
									</p>
								</div>

								<!-- Chevron -->
								<Icon
									name="lucide:chevron-down"
									class="w-5 h-5 text-[var(--cardapio-text-muted)] transition-transform duration-200"
									:class="{ 'rotate-180': multiplosSabores }"
								/>
							</button>

							<!-- Conteúdo Expandido -->
							<div
								v-if="multiplosSabores"
								class="p-4 space-y-4 animate-in slide-in-from-top-2 duration-200"
							>
								<!-- Segmented Control de quantidade -->
								<div>
									<label class="text-sm font-medium text-[var(--cardapio-text)] mb-3 block">
										Quantos sabores?
										<span class="text-[var(--cardapio-danger)]">*</span>
									</label>
									<div class="flex p-1 bg-[var(--cardapio-secondary)] rounded-xl">
										<button
											v-for="opcao in opcoesSabores"
											:key="opcao.value"
											type="button"
											class="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200"
											:class="[
												quantidadeSabores === opcao.value
													? 'bg-[var(--cardapio-primary)] text-white shadow-md'
													: 'text-[var(--cardapio-text-muted)] hover:text-[var(--cardapio-text)]',
											]"
											@click="quantidadeSabores = opcao.value as 2 | 3 | 4"
										>
											{{ opcao.label }}
										</button>
									</div>
								</div>

								<!-- Lista de sabores -->
								<div class="space-y-2">
									<label class="text-sm font-medium text-[var(--cardapio-text)] block">
										Escolha os sabores
									</label>

									<!-- Loading -->
									<div v-if="carregandoProdutos" class="text-center py-6">
										<Icon
											name="lucide:loader-2"
											class="w-6 h-6 animate-spin text-[var(--cardapio-primary)] mx-auto"
										/>
										<p class="text-sm text-[var(--cardapio-text-muted)] mt-2">
											Carregando sabores...
										</p>
									</div>

									<div v-else class="space-y-2">
										<!-- Slot 1: Produto atual (fixo) -->
										<div
											class="flex items-center gap-3 p-4 border-2 rounded-xl bg-gradient-to-br from-[var(--cardapio-primary)]/10 to-transparent border-[var(--cardapio-primary)]"
										>
											<div
												class="w-8 h-8 rounded-full bg-[var(--cardapio-primary)] flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
											>
												1
											</div>
											<div class="flex-1 min-w-0">
												<p class="text-sm font-semibold text-[var(--cardapio-text)] truncate">
													{{ produto?.nome }}
												</p>
												<p class="text-xs text-[var(--cardapio-text-muted)]">Sabor principal</p>
											</div>
											<Icon name="lucide:lock" class="w-5 h-5 text-[var(--cardapio-primary)]" />
										</div>

										<!-- Slots 2, 3, 4: Sabores adicionais -->
										<div
											v-for="index in maxSaboresAdicionais"
											:key="index"
											class="flex items-center gap-3 p-4 border-2 rounded-xl transition-all duration-200"
											:class="[
												saboresSelecionados[index - 1]
													? 'border-[var(--cardapio-primary)] bg-gradient-to-br from-[var(--cardapio-primary)]/10 to-transparent shadow-md'
													: 'border-[var(--cardapio-border)] bg-[var(--cardapio-secondary)] hover:border-[var(--cardapio-hover)]',
											]"
										>
											<div
												class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 transition-all duration-200"
												:class="[
													saboresSelecionados[index - 1]
														? 'bg-[var(--cardapio-primary)] text-white shadow-lg'
														: 'bg-[var(--cardapio-background)] text-[var(--cardapio-text-muted)]',
												]"
											>
												{{ index + 1 }}
											</div>

											<!-- Sabor selecionado -->
											<div
												v-if="saboresSelecionados[index - 1]"
												class="flex-1 flex items-center justify-between min-w-0"
											>
												<div class="flex-1 min-w-0">
													<p class="text-sm font-semibold text-[var(--cardapio-text)] truncate">
														{{
															produtosDisponiveisFiltrados.find(
																(p) => p.id === saboresSelecionados[index - 1],
															)?.nome
														}}
													</p>
													<p class="text-xs text-[var(--cardapio-text-muted)]">Sabor adicional</p>
												</div>
												<button
													type="button"
													class="ml-2 flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[var(--cardapio-primary)] hover:bg-[var(--cardapio-primary)] hover:text-white border border-[var(--cardapio-primary)] rounded-lg transition-all duration-200"
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
											<div v-else class="flex-1 relative">
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
													class="select-menu-force-upward"
												/>
											</div>
										</div>
									</div>

									<!-- Mensagem quando não há produtos -->
									<div
										v-if="!carregandoProdutos && produtosDisponiveisFiltrados.length === 0"
										class="text-center py-6 text-sm text-[var(--cardapio-text-muted)]"
									>
										Nenhum sabor disponível para esta categoria
									</div>
								</div>
							</div>
						</div>

						<!-- Seção Grupos de Adicionais -->
						<div v-if="gruposAdicionais.length > 0" class="space-y-4">
							<div class="flex items-center gap-2">
								<Icon name="lucide:plus-circle" class="w-4 h-4 text-[var(--cardapio-primary)]" />
								<h3 class="text-sm font-semibold text-[var(--cardapio-text)]">
									Personalize seu pedido
								</h3>
							</div>

							<div class="space-y-3">
								<div
									v-for="grupo in gruposAdicionais"
									:id="`grupo-${grupo.id}`"
									:key="grupo.id"
									class="border-2 rounded-2xl overflow-hidden transition-all duration-200"
									:class="[
										grupoExpandido === grupo.id
											? 'border-[var(--cardapio-primary)] shadow-lg'
											: 'border-[var(--cardapio-border)] hover:border-[var(--cardapio-primary)]/50',
									]"
								>
									<!-- Header do Accordion -->
									<button
										type="button"
										class="w-full flex items-center gap-3 p-4 text-left transition-colors"
										:class="[
											grupoExpandido === grupo.id
												? 'bg-gradient-to-r from-[var(--cardapio-primary)]/10 to-transparent'
												: 'bg-[var(--cardapio-secondary)]',
										]"
										@click="toggleGrupo(grupo.id)"
									>
										<!-- Ícone -->
										<div
											class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
											:class="[
												grupoExpandido === grupo.id
													? 'bg-[var(--cardapio-primary)] text-white'
													: 'bg-[var(--cardapio-background)] text-[var(--cardapio-text-muted)]',
											]"
										>
											<Icon :name="getGrupoIcon(grupo.nome)" class="w-5 h-5" />
										</div>

										<!-- Info -->
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
												<span v-if="grupo.obrigatorio" class="text-[var(--cardapio-danger)]">
													*
												</span>
											</h4>
											<p class="text-xs text-[var(--cardapio-text-muted)] mt-0.5">
												{{ getGrupoProgressLabel(grupo) }}
											</p>
										</div>

										<!-- Progress indicator -->
										<div class="flex items-center gap-2">
											<!-- Barra de progresso -->
											<div
												class="hidden sm:block w-16 h-1.5 bg-[var(--cardapio-border)] rounded-full overflow-hidden"
											>
												<div
													class="h-full bg-[var(--cardapio-primary)] transition-all duration-300"
													:style="{
														width: `${Math.min((getTotalSelecionadoGrupo(grupo) / grupo.max_selecao) * 100, 100)}%`,
													}"
												/>
											</div>
											<!-- Chevron -->
											<Icon
												name="lucide:chevron-down"
												class="w-5 h-5 text-[var(--cardapio-text-muted)] transition-transform duration-200"
												:class="{ 'rotate-180': grupoExpandido === grupo.id }"
											/>
										</div>
									</button>

									<!-- Conteúdo Expandido -->
									<div
										v-if="grupoExpandido === grupo.id"
										class="p-4 space-y-3 animate-in slide-in-from-top-2 duration-200"
									>
										<!-- Select para adicionar (se não atingiu limite) -->
										<div
											v-if="!isGrupoLimiteAtingido(grupo)"
											class="p-3 border-2 border-dashed border-[var(--cardapio-border)] rounded-xl bg-[var(--cardapio-secondary)]/50 relative"
										>
											<UiSelectMenu
												:model-value="null"
												@update:model-value="
													(value) => {
														if (!value) return;
														const qtdAtual = getQuantidadeAdicional(value as string);
														const novaQtd = qtdAtual + 1;
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
														disabled: getQuantidadeAdicional(a.id) > 0, // Desabilita se já foi selecionado
													}))
												"
												placeholder="Clique para adicionar um item"
												searchPlaceholder="Buscar adicional..."
												:searchable="true"
												size="md"
												class="select-menu-force-upward"
											/>
										</div>

										<!-- Lista de itens selecionados -->
										<div
											v-for="adicional in grupo.adicionais.filter(
												(a) => getQuantidadeAdicional(a.id) > 0,
											)"
											:key="adicional.id"
											class="flex items-center justify-between p-3 border-2 border-[var(--cardapio-primary)] rounded-xl bg-gradient-to-br from-[var(--cardapio-primary)]/10 to-transparent"
										>
											<div class="flex-1 min-w-0">
												<p class="text-sm font-semibold text-[var(--cardapio-text)]">
													{{ adicional.nome }}
													<span class="text-[var(--cardapio-text-muted)] font-normal">
														({{ getQuantidadeAdicional(adicional.id) }}x)
													</span>
												</p>
											</div>

											<div class="flex items-center gap-3">
												<span
													v-if="adicional.preco > 0"
													class="text-sm font-semibold text-[var(--cardapio-primary)] whitespace-nowrap"
												>
													+
													{{
														formatCurrency(adicional.preco * getQuantidadeAdicional(adicional.id))
													}}
												</span>

												<!-- Controles de quantidade -->
												<div class="flex items-center gap-1">
													<button
														v-if="adicional.permite_multiplas_unidades"
														type="button"
														class="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-[var(--cardapio-primary)] text-[var(--cardapio-primary)] hover:bg-[var(--cardapio-primary)] hover:text-white transition-colors duration-200"
														@click="alterarAdicional(grupo, adicional, -1)"
													>
														<Icon name="lucide:minus" class="w-4 h-4" />
													</button>

													<button
														v-if="adicional.permite_multiplas_unidades"
														type="button"
														class="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-[var(--cardapio-primary)] text-[var(--cardapio-primary)] hover:bg-[var(--cardapio-primary)] hover:text-white transition-colors duration-200"
														@click="alterarAdicional(grupo, adicional, 1)"
													>
														<Icon name="lucide:plus" class="w-4 h-4" />
													</button>

													<button
														type="button"
														class="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--cardapio-danger)] text-white hover:bg-[var(--cardapio-danger)]/80 transition-colors duration-200"
														@click="
															() => {
																adicionaisSelecionados.delete(adicional.id);
																adicionaisSelecionados = new Map(adicionaisSelecionados);
															}
														"
													>
														<Icon name="lucide:trash-2" class="w-4 h-4" />
													</button>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						<!-- Seção Observação -->
						<div class="space-y-3">
							<div class="flex items-center gap-2">
								<Icon name="lucide:message-square" class="w-4 h-4 text-[var(--cardapio-primary)]" />
								<h3 class="text-sm font-semibold text-[var(--cardapio-text)]">
									Alguma observação?
								</h3>
							</div>
							<div class="p-1">
								<UiTextarea
									v-model="observacao"
									:rows="2"
									placeholder="Ex: Sem cebola, bem passado..."
								/>
							</div>
							<p class="text-xs text-[var(--cardapio-text-muted)] flex items-center gap-1">
								<Icon name="lucide:info" class="w-3 h-3" />
								O estabelecimento fará o possível para atender seu pedido
							</p>
						</div>

						<!-- Seção de Cupom -->
						<div class="space-y-3">
							<div class="flex items-center gap-2">
								<Icon name="lucide:ticket" class="w-4 h-4 text-[var(--cardapio-primary)]" />
								<h3 class="text-sm font-semibold text-[var(--cardapio-text)]">Cupom de desconto</h3>
							</div>

							<!-- Input de cupom (quando não tem cupom aplicado) -->
							<div v-if="!cupomAplicado" class="space-y-2">
								<div class="flex gap-2">
									<input
										v-model="cupomInput"
										type="text"
										placeholder="Digite o código"
										class="flex-1 px-4 py-3 text-sm rounded-xl border-2 transition-all bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:border-[var(--cardapio-primary)] focus:outline-none uppercase"
										:disabled="aplicandoCupom"
										@input="cupomInput = ($event.target as HTMLInputElement).value.toUpperCase()"
										@keyup.enter="aplicarCupom"
									/>
									<button
										type="button"
										class="px-5 py-3 text-sm font-semibold rounded-xl transition-all"
										:class="[
											aplicandoCupom
												? 'bg-[var(--cardapio-border)] text-[var(--cardapio-text-muted)] cursor-wait'
												: 'bg-[var(--cardapio-primary)] text-white hover:opacity-90',
										]"
										:disabled="aplicandoCupom || !cupomInput.trim()"
										@click="aplicarCupom"
									>
										<Icon
											v-if="aplicandoCupom"
											name="lucide:loader-2"
											class="w-4 h-4 animate-spin"
										/>
										<span v-else>Aplicar</span>
									</button>
								</div>

								<!-- Mensagem de erro -->
								<p
									v-if="erroCupom"
									class="text-xs text-[var(--cardapio-danger)] flex items-center gap-1.5 px-1"
								>
									<Icon name="lucide:alert-circle" class="w-3.5 h-3.5" />
									{{ erroCupom }}
								</p>
							</div>

							<!-- Cupom aplicado -->
							<div
								v-else
								class="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-[var(--cardapio-success)]/10 to-transparent border-2 border-[var(--cardapio-success)]"
							>
								<div class="flex items-center gap-3">
									<div
										class="w-10 h-10 rounded-full bg-[var(--cardapio-success)] flex items-center justify-center flex-shrink-0"
									>
										<Icon name="lucide:check" class="w-5 h-5 text-white" />
									</div>
									<div>
										<p class="text-sm font-semibold text-[var(--cardapio-text)]">
											{{ cupomAplicado }}
										</p>
										<p class="text-sm text-[var(--cardapio-success)] font-bold">
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
									class="text-sm font-medium text-[var(--cardapio-danger)] hover:underline px-2"
									@click="removerCupom"
								>
									Remover
								</button>
							</div>
						</div>

						<!-- Seção Ver Detalhes (Progressive Disclosure) -->
						<div v-if="temAdicionais || cupomAplicado" class="space-y-3">
							<!-- Botão para expandir/colapsar -->
							<button
								id="detalhes-button"
								type="button"
								class="w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all"
								:class="[
									detalhesExpandidos
										? 'border-[var(--cardapio-primary)] bg-gradient-to-r from-[var(--cardapio-primary)]/5 to-transparent'
										: 'border-[var(--cardapio-border)] bg-[var(--cardapio-secondary)] hover:border-[var(--cardapio-primary)]/50',
								]"
								@click="toggleDetalhes"
							>
								<div class="flex items-center gap-3">
									<div
										class="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
										:class="[
											detalhesExpandidos
												? 'bg-[var(--cardapio-primary)] text-white'
												: 'bg-[var(--cardapio-background)] text-[var(--cardapio-text-muted)]',
										]"
									>
										<Icon name="lucide:receipt" class="w-5 h-5" />
									</div>
									<div class="text-left">
										<p
											class="text-sm font-semibold"
											:class="[
												detalhesExpandidos
													? 'text-[var(--cardapio-primary)]'
													: 'text-[var(--cardapio-text)]',
											]"
										>
											{{ detalhesExpandidos ? "Ocultar detalhes" : "Ver detalhes" }}
										</p>
										<p class="text-xs text-[var(--cardapio-text-muted)]">Resumo do seu pedido</p>
									</div>
								</div>
								<Icon
									name="lucide:chevron-down"
									class="w-5 h-5 text-[var(--cardapio-text-muted)] transition-transform duration-300"
									:class="{ 'rotate-180': detalhesExpandidos }"
								/>
							</button>

							<!-- Detalhes expandidos -->
							<div
								v-if="detalhesExpandidos"
								class="space-y-3 p-4 rounded-xl bg-[var(--cardapio-secondary)]/50 border border-[var(--cardapio-border)] animate-in slide-in-from-top-2 duration-300"
							>
								<!-- Lista de itens -->
								<div
									v-for="(item, index) in itensDetalhados"
									:key="index"
									class="flex items-start justify-between text-sm pb-3 border-b border-[var(--cardapio-border)] last:border-0 last:pb-0"
								>
									<div class="flex-1 min-w-0 pr-3">
										<p class="font-semibold text-[var(--cardapio-text)]">
											{{ item.nome }}
											<span
												v-if="item.quantidade > 1"
												class="text-[var(--cardapio-text-muted)] font-normal"
											>
												({{ item.quantidade }}x)
											</span>
										</p>
										<p
											v-if="item.subtexto"
											class="text-xs text-[var(--cardapio-text-muted)] mt-0.5"
										>
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
									class="flex items-center justify-between text-sm pt-3 border-t-2 border-[var(--cardapio-border)]"
								>
									<p class="font-medium text-[var(--cardapio-text)]">Subtotal</p>
									<p class="font-bold text-[var(--cardapio-text)]">
										{{ formatCurrency(subtotal) }}
									</p>
								</div>

								<!-- Desconto do cupom -->
								<div
									v-if="cupomAplicado && descontoCupom > 0"
									class="flex items-center justify-between text-sm"
								>
									<p class="text-[var(--cardapio-success)] font-medium flex items-center gap-1.5">
										<Icon name="lucide:tag" class="w-4 h-4" />
										Cupom {{ cupomAplicado }}
									</p>
									<p class="font-bold text-[var(--cardapio-success)]">
										-{{ formatCurrency(descontoCupom) }}
									</p>
								</div>

								<!-- Total final -->
								<div
									class="flex items-center justify-between text-base pt-3 border-t-2 border-[var(--cardapio-border)]"
								>
									<p class="font-bold text-[var(--cardapio-text)]">Total</p>
									<p class="font-bold text-xl text-[var(--cardapio-primary)]">
										{{ formatCurrency(precoTotal) }}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</template>

		<template #footer>
			<!-- Footer Compacto -->
			<div
				class="bg-[var(--cardapio-secondary)] rounded-2xl p-4 shadow-2xl border border-[var(--cardapio-border)]"
			>
				<!-- Resumo do Preço -->
				<div
					class="flex items-center justify-between mb-4 pb-3 border-b border-[var(--cardapio-border)]"
				>
					<div class="flex items-center gap-3">
						<div
							class="w-10 h-10 rounded-full bg-[var(--cardapio-primary)]/10 flex items-center justify-center"
						>
							<Icon name="lucide:shopping-bag" class="w-5 h-5 text-[var(--cardapio-primary)]" />
						</div>
						<div>
							<p class="text-xs text-[var(--cardapio-text-muted)]">Total do pedido</p>
							<p class="text-xl font-bold text-[var(--cardapio-primary)]">
								{{ formatCurrency(precoTotal) }}
							</p>
						</div>
					</div>

					<!-- Controle de quantidade -->
					<div class="flex items-center gap-2 bg-[var(--cardapio-background)] rounded-xl p-1">
						<button
							type="button"
							class="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--cardapio-text)] hover:bg-[var(--cardapio-primary)] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
							:disabled="quantidade <= 1"
							@click="quantidade--"
						>
							<Icon name="lucide:minus" class="w-4 h-4" />
						</button>
						<span class="w-8 text-center font-bold text-base text-[var(--cardapio-text)]">
							{{ quantidade }}
						</span>
						<button
							type="button"
							class="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--cardapio-primary)] hover:bg-[var(--cardapio-primary)] hover:text-white transition-all"
							@click="quantidade++"
						>
							<Icon name="lucide:plus" class="w-4 h-4" />
						</button>
					</div>
				</div>

				<!-- Botão adicionar -->
				<button
					type="button"
					class="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-xl font-bold text-base text-white shadow-lg transition-all duration-200"
					:class="[
						podeAdicionar
							? 'bg-[var(--cardapio-primary)] hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]'
							: 'bg-[var(--cardapio-border)] text-[var(--cardapio-text-muted)] cursor-not-allowed opacity-50',
					]"
					:disabled="!podeAdicionar"
					@click="adicionarAoCarrinho"
				>
					<Icon name="lucide:shopping-cart" class="w-5 h-5" />
					<span>Adicionar ao carrinho</span>
				</button>
			</div>
		</template>
	</UiDrawer>
</template>

<style scoped>
/* Animações customizadas */
@keyframes slide-in-from-top {
	from {
		opacity: 0;
		transform: translateY(-10px);
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

.duration-300 {
	animation-duration: 300ms;
}
</style>
