<script setup lang="ts">
/**
 * 📌 CardapioPublicoPage
 *
 * Página principal do cardápio público de um estabelecimento.
 * Usa SSR para carregar dados no servidor com cache.
 */

import type { ProdutoPublico } from "../types/cardapio-publico";
import { useCardapioPublico } from "../composables/useCardapioPublico";
import { useCarrinhoStore } from "~/stores/carrinho";

// Componentes do cardápio
import CardapioHeader from "../components/CardapioHeader.vue";
import CardapioBanners from "../components/CardapioBanners.vue";
import CardapioCategorias from "../components/CardapioCategorias.vue";
import CardapioBusca from "../components/CardapioBusca.vue";
import CardapioProdutoLista from "../components/CardapioProdutoLista.vue";
import CardapioProdutoModal from "../components/CardapioProdutoModal.vue";
import CardapioCarrinhoFlutuante from "../components/CardapioCarrinhoFlutuante.vue";
import CardapioCarrinhoDrawer from "../components/CardapioCarrinhoDrawer.vue";
import CardapioSkeleton from "../components/CardapioSkeleton.vue";

// Props recebidas da rota
interface Props {
	slug: string;
}

const props = defineProps<Props>();

// Composable do cardápio (SSR com cache)
const { estabelecimento, categorias, loading, error, categoriaSelecionada, termoBusca } =
	useCardapioPublico(props.slug);

// Verifica se está aberto (usa campo direto do banco)
const estaAberto = computed(() => estabelecimento.value?.aberto ?? false);

// Store do carrinho (client-side only)
const carrinhoStore = useCarrinhoStore();

// Estado do modal de produto
const modalProdutoAberto = ref(false);
const produtoSelecionado = ref<ProdutoPublico | null>(null);

// Estado do drawer do carrinho
const drawerCarrinhoAberto = ref(false);

// Carrega carrinho do localStorage (client-side only)
onMounted(() => {
	carrinhoStore.carregarDoStorage();
});

/**
 * SEO dinâmico
 */
useSeoMeta({
	title: () => estabelecimento.value?.nome ?? "Cardápio",
	description: () => estabelecimento.value?.descricao ?? "Veja nosso cardápio e faça seu pedido",
	ogTitle: () => estabelecimento.value?.nome ?? "Cardápio",
	ogDescription: () => estabelecimento.value?.descricao ?? "Veja nosso cardápio e faça seu pedido",
	ogImage: () => estabelecimento.value?.logo_url ?? undefined,
});

/**
 * Abre modal de produto
 */
const abrirProduto = (produto: ProdutoPublico): void => {
	produtoSelecionado.value = produto;
	modalProdutoAberto.value = true;
};

/**
 * Abre drawer do carrinho
 */
const abrirCarrinho = (): void => {
	drawerCarrinhoAberto.value = true;
};

/**
 * Vai para checkout
 */
const irParaCheckout = (): void => {
	// TODO: Implementar modal/página de checkout
	drawerCarrinhoAberto.value = false;
};

/**
 * Seleciona categoria
 */
const selecionarCategoria = (categoriaId: string): void => {
	categoriaSelecionada.value = categoriaId;
	termoBusca.value = "";
};

// Estado de ordenação e filtros
const ordenacao = ref("padrao");
const filtros = ref({ destaque: false, promocao: false });

/**
 * Aplica ordenação
 */
const aplicarOrdenacao = (tipo: string): void => {
	ordenacao.value = tipo;
};

/**
 * Aplica filtros
 */
const aplicarFiltros = (novosFiltros: { destaque: boolean; promocao: boolean }): void => {
	filtros.value = novosFiltros;
};
</script>

<template>
	<div class="min-h-screen bg-[var(--bg-page)]">
		<!-- Loading Skeleton -->
		<CardapioSkeleton v-if="loading" />

		<!-- Erro -->
		<div v-else-if="error" class="flex items-center justify-center min-h-screen">
			<UiEmptyState icon="lucide:alert-circle" title="Ops!" :description="error" />
		</div>

		<!-- Cardápio -->
		<template v-else-if="estabelecimento">
			<!-- Header -->
			<CardapioHeader :estabelecimento="estabelecimento" />

			<!-- Banners -->
			<CardapioBanners />

			<!-- Categorias -->
			<CardapioCategorias
				:categorias="categorias"
				:categoria-selecionada="categoriaSelecionada"
				@selecionar="selecionarCategoria"
			/>

			<!-- Busca -->
			<CardapioBusca v-model="termoBusca" @ordenar="aplicarOrdenacao" @filtrar="aplicarFiltros" />

			<!-- Lista de produtos -->
			<CardapioProdutoLista
				:categorias="categorias"
				:termo-busca="termoBusca"
				:ordenacao="ordenacao"
				:filtros="filtros"
				@selecionar-produto="abrirProduto"
			/>

			<!-- Modal de produto -->
			<CardapioProdutoModal
				v-model="modalProdutoAberto"
				:produto="produtoSelecionado"
				:estabelecimento-id="estabelecimento.id"
				:estabelecimento-slug="estabelecimento.slug"
			/>

			<!-- Carrinho flutuante -->
			<CardapioCarrinhoFlutuante @abrir="abrirCarrinho" />

			<!-- Drawer do carrinho -->
			<CardapioCarrinhoDrawer
				v-model="drawerCarrinhoAberto"
				:esta-aberto="estaAberto"
				@checkout="irParaCheckout"
			/>
		</template>
	</div>
</template>
