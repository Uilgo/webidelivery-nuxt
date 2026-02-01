<script setup lang="ts">
/**
 * 📌 CardapioPublicoPage
 *
 * Página principal do cardápio público.
 * Exibe hero, banners, ofertas, destaques e produtos com infinite scroll.
 */

import { useCardapioPublico } from "~/features/public/cardapio/composables/useCardapioPublico";
import { useProdutoDrawer } from "~/features/public/cardapio/composables/useProdutoDrawer";
import { useCarrinhoDrawer } from "~/features/public/cardapio/composables/useCarrinhoDrawer";
import { useSobreDrawer } from "~/features/public/cardapio/composables/useSobreDrawer";
import { useTemaPublico } from "~/features/public/cardapio/composables/useTemaPublico";
import type { ProdutoPublico } from "~/features/public/cardapio/types/cardapio-publico";

// Imports explícitos dos componentes
import CardapioSkeleton from "~/features/public/cardapio/components/CardapioSkeleton.vue";
import CardapioHeader from "~/features/public/cardapio/components/CardapioHeader.vue";
import CardapioBannerCobertura from "~/features/public/cardapio/components/CardapioBannerCobertura.vue";
import CardapioBanners from "~/features/public/cardapio/components/CardapioBanners.vue";
import CardapioCategorias from "~/features/public/cardapio/components/CardapioCategorias.vue";
import CardapioBusca from "~/features/public/cardapio/components/CardapioBusca.vue";
import CardapioOfertasScroll from "~/features/public/cardapio/components/CardapioOfertasScroll.vue";
import CardapioDestaquesLista from "~/features/public/cardapio/components/CardapioDestaquesLista.vue";
import CardapioProdutoCard from "~/features/public/cardapio/components/CardapioProdutoCard.vue";
import CardapioProdutoDrawer from "~/features/public/cardapio/components/CardapioProdutoDrawer.vue";
import CardapioProdutoBottomSheet from "~/features/public/cardapio/components/CardapioProdutoBottomSheet.vue";
import CardapioCarrinhoLateral from "~/features/public/cardapio/components/CardapioCarrinhoLateral.vue";
import CardapioCarrinhoBotaoFlutuante from "~/features/public/cardapio/components/CardapioCarrinhoBotaoFlutuante.vue";
import CardapioCarrinhoBottomSheet from "~/features/public/cardapio/components/CardapioCarrinhoBottomSheet.vue";

// Props recebidas da rota
interface Props {
	slug: string;
}

const props = defineProps<Props>();

// Carrega dados do cardápio
const {
	estabelecimento,
	categorias,
	ofertas,
	destaques,
	produtos,
	loading,
	error,
	hasMore,
	loadMore,
} = useCardapioPublico(props.slug);

// Aplica tema personalizado do estabelecimento
useTemaPublico(estabelecimento);

// Estado da busca
const termoBusca = ref("");
const filtrosAtivos = ref({ destaque: false, promocao: false });
const ordenacaoAtual = ref("padrao");
const categoriaSelecionada = ref<string | null>(null);

// Estado do drawer de produto (usando composable)
const {
	drawerAberto: drawerProdutoAberto,
	bottomSheetAberto: bottomSheetProdutoAberto,
	produtoSelecionado,
} = useProdutoDrawer();

// Estado do drawer/bottom sheet do carrinho
const { drawerAberto: drawerCarrinhoAberto, bottomSheetAberto: bottomSheetCarrinhoAberto } =
	useCarrinhoDrawer();

// Estado do drawer/bottom sheet do sobre
const { bottomSheetAberto: bottomSheetSobreAberto } = useSobreDrawer();

// Produtos filtrados (reativo)
const produtosFiltrados = computed<readonly ProdutoPublico[]>(() => {
	// Combina todos os produtos (ofertas + destaques + produtos paginados)
	// Remove duplicatas usando um Map com ID como chave
	const todosOsProdutos = new Map<string, ProdutoPublico>();

	// Adiciona ofertas
	ofertas.value.forEach((p) => todosOsProdutos.set(p.id, p));

	// Adiciona destaques
	destaques.value.forEach((p) => todosOsProdutos.set(p.id, p));

	// Adiciona produtos paginados
	produtos.value.forEach((p) => todosOsProdutos.set(p.id, p));

	// Converte Map para array
	let resultado = Array.from(todosOsProdutos.values());

	// Filtro de busca
	if (termoBusca.value.trim()) {
		const termo = termoBusca.value.toLowerCase().trim();
		resultado = resultado.filter(
			(p) => p.nome.toLowerCase().includes(termo) || p.descricao?.toLowerCase().includes(termo),
		);
	}

	// Filtros
	if (filtrosAtivos.value.destaque) {
		resultado = resultado.filter((p) => p.destaque);
	}
	if (filtrosAtivos.value.promocao) {
		resultado = resultado.filter((p) => p.em_promocao);
	}

	// Ordenação
	if (ordenacaoAtual.value === "menor-preco") {
		resultado.sort((a, b) => {
			const precoA = Math.min(...a.variacoes.map((v) => v.preco_promocional || v.preco));
			const precoB = Math.min(...b.variacoes.map((v) => v.preco_promocional || v.preco));
			return precoA - precoB;
		});
	} else if (ordenacaoAtual.value === "maior-preco") {
		resultado.sort((a, b) => {
			const precoA = Math.min(...a.variacoes.map((v) => v.preco_promocional || v.preco));
			const precoB = Math.min(...b.variacoes.map((v) => v.preco_promocional || v.preco));
			return precoB - precoA;
		});
	} else if (ordenacaoAtual.value === "a-z") {
		resultado.sort((a, b) => a.nome.localeCompare(b.nome));
	} else if (ordenacaoAtual.value === "z-a") {
		resultado.sort((a, b) => b.nome.localeCompare(a.nome));
	}

	return resultado;
});

/**
 * Retorna produtos de uma categoria específica (com filtros aplicados)
 */
const produtosPorCategoria = (categoriaId: string): readonly ProdutoPublico[] => {
	return produtosFiltrados.value.filter((p) => p.categoria_id === categoriaId);
};

/**
 * Verifica se há algum filtro/busca/ordenação ativa
 */
const temFiltrosAtivos = computed(() => {
	return (
		termoBusca.value.trim() !== "" ||
		filtrosAtivos.value.destaque ||
		filtrosAtivos.value.promocao ||
		ordenacaoAtual.value !== "padrao" ||
		categoriaSelecionada.value !== null
	);
});

/**
 * Categorias visíveis (filtra se há categoria selecionada)
 */
const categoriasVisiveis = computed(() => {
	if (categoriaSelecionada.value) {
		return categorias.value.filter((c) => c.id === categoriaSelecionada.value);
	}
	return categorias.value;
});

/**
 * Handler de ordenação
 */
const handleOrdenar = (tipo: string): void => {
	ordenacaoAtual.value = tipo;
};

/**
 * Handler de filtros
 */
const handleFiltrar = (filtros: { destaque: boolean; promocao: boolean }): void => {
	filtrosAtivos.value = filtros;
};

/**
 * Handler de seleção de categoria
 */
const handleSelecionarCategoria = (categoriaId: string | null) => {
	categoriaSelecionada.value = categoriaId;
};

/**
 * Handler quando produto é adicionado ao carrinho
 */
const handleProdutoAdicionado = (): void => {
	// Produto adicionado com sucesso
};

/**
 * Handler de carregar mais produtos
 */
const handleLoadMore = async () => {
	await loadMore();
};
</script>

<template>
	<div class="min-h-screen bg-[var(--cardapio-background)]">
		<!-- Loading State -->
		<CardapioSkeleton v-if="loading && !estabelecimento" />

		<!-- Error State -->
		<div v-else-if="error" class="flex items-center justify-center min-h-screen p-4">
			<div class="text-center">
				<Icon name="lucide:alert-circle" class="w-16 h-16 text-red-500 mx-auto mb-4" />
				<h2 class="text-xl font-bold text-[var(--cardapio-text)] mb-2">
					Erro ao carregar cardápio
				</h2>
				<p class="text-[var(--cardapio-text-muted)]">{{ error }}</p>
			</div>
		</div>

		<!-- Content -->
		<div v-else-if="estabelecimento">
			<!-- Container Principal com Grid -->
			<div class="w-full max-w-7xl mx-auto px-2 sm:px-3 md:px-4 lg:px-8 pt-3 sm:pt-4 md:pt-6">
				<!-- Grid: 2 colunas no desktop -->
				<div class="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-3 sm:gap-4 md:gap-6">
					<!-- Coluna Esquerda: Conteúdo Principal -->
					<div class="min-w-0">
						<!-- Header -->
						<div class="mb-2 sm:mb-3">
							<CardapioHeader :estabelecimento="estabelecimento" />
						</div>

						<!-- Banner de Cobertura -->
						<CardapioBannerCobertura :estabelecimento="estabelecimento" />

						<!-- Banners Promocionais -->
						<CardapioBanners v-if="estabelecimento" :estabelecimento-id="estabelecimento.id" />

						<!-- Menu de Categorias (Sticky) -->
						<CardapioCategorias
							:categorias="categorias"
							:categoria-selecionada="categoriaSelecionada"
							@selecionar="handleSelecionarCategoria"
						/>

						<!-- Busca + Filtros + Ordenação -->
						<CardapioBusca v-model="termoBusca" @ordenar="handleOrdenar" @filtrar="handleFiltrar" />

						<!-- Container com padding para seções abaixo -->
						<div class="px-2 sm:px-3 md:px-4">
							<!-- Ofertas Imperdíveis (apenas quando não há filtros) -->
							<CardapioOfertasScroll v-show="!temFiltrosAtivos" :ofertas="ofertas" />

							<!-- Mais Vendidos (apenas quando não há filtros) -->
							<CardapioDestaquesLista v-show="!temFiltrosAtivos" :destaques="destaques" />

							<!-- Produtos por Categoria -->
							<section class="pb-20">
								<div v-for="categoria in categoriasVisiveis" :key="categoria.id" class="mb-4">
									<!-- Só exibe categoria se tiver produtos -->
									<template v-if="produtosPorCategoria(categoria.id).length > 0">
										<!-- Título da Categoria -->
										<h3 class="text-2xl font-bold text-[var(--cardapio-text)] mb-4">
											{{ categoria.nome }}
										</h3>

										<!-- Descrição da Categoria (se houver) -->
										<p
											v-if="categoria.descricao"
											class="text-sm text-[var(--cardapio-text-muted)] mb-4 -mt-2"
										>
											{{ categoria.descricao }}
										</p>

										<!-- Produtos da Categoria -->
										<div class="space-y-3">
											<CardapioProdutoCard
												v-for="produto in produtosPorCategoria(categoria.id)"
												:key="produto.id"
												:produto="produto"
											/>
										</div>
									</template>
								</div>

								<!-- Mensagem quando não há resultados -->
								<div
									v-if="temFiltrosAtivos && produtosFiltrados.length === 0"
									class="text-center py-12"
								>
									<Icon
										name="lucide:search-x"
										class="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4"
									/>
									<h3 class="text-lg font-semibold text-[var(--cardapio-text)] mb-2">
										Nenhum produto encontrado
									</h3>
									<p class="text-sm text-[var(--cardapio-text-muted)]">
										Tente ajustar sua busca ou filtros
									</p>
								</div>

								<!-- Loading -->
								<div v-if="loading" class="space-y-3">
									<div
										v-for="i in 3"
										:key="`skeleton-${i}`"
										class="bg-[var(--cardapio-secondary)] rounded-xl shadow-sm overflow-hidden p-4 animate-pulse border border-[var(--cardapio-border)]"
									>
										<div class="flex gap-3">
											<div class="w-24 h-24 bg-[var(--cardapio-secondary)] rounded-lg"></div>
											<div class="flex-1">
												<div class="h-4 bg-[var(--cardapio-secondary)] rounded w-3/4 mb-2"></div>
												<div class="h-3 bg-[var(--cardapio-secondary)] rounded w-full mb-1"></div>
												<div class="h-3 bg-[var(--cardapio-secondary)] rounded w-2/3"></div>
											</div>
										</div>
									</div>
								</div>

								<!-- Fim da Lista -->
								<div v-if="!hasMore && produtos.length > 0" class="text-center py-8">
									<p
										class="text-[var(--cardapio-text-muted)] flex items-center justify-center gap-2"
									>
										<Icon name="lucide:check-circle" class="w-5 h-5 text-green-500" />
										Você viu todos os produtos!
									</p>
								</div>
							</section>
						</div>
					</div>

					<!-- Coluna Direita: Carrinho Lateral (Desktop Only) -->
					<div class="hidden lg:block">
						<CardapioCarrinhoLateral />
					</div>
				</div>
			</div>

			<!-- Carrinho Botão Flutuante (Mobile Only) - Esconde quando bottom sheet do sobre está aberto -->
			<div v-show="!bottomSheetSobreAberto" class="lg:hidden">
				<CardapioCarrinhoBotaoFlutuante />
			</div>

			<!-- Drawer de Produto (Tablet/Desktop) -->
			<CardapioProdutoDrawer
				v-model="drawerProdutoAberto"
				:produto="produtoSelecionado"
				:estabelecimento-id="estabelecimento.id"
				:estabelecimento-slug="estabelecimento.slug"
				:categorias="categorias"
				@adicionado="handleProdutoAdicionado"
			/>

			<!-- Bottom Sheet de Produto (Mobile) -->
			<CardapioProdutoBottomSheet
				v-model="bottomSheetProdutoAberto"
				:produto="produtoSelecionado"
				:estabelecimento-id="estabelecimento.id"
				:estabelecimento-slug="estabelecimento.slug"
				:categorias="categorias"
				@adicionado="handleProdutoAdicionado"
			/>

			<!-- Bottom Sheet do Carrinho (Mobile) -->
			<CardapioCarrinhoBottomSheet
				v-model="bottomSheetCarrinhoAberto"
				:esta-aberto="estabelecimento.aberto"
			/>
		</div>
	</div>
</template>
