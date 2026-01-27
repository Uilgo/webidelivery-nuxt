<script setup lang="ts">
/**
 * 📌 Página do Cardápio Público
 *
 * Página principal do cardápio público acessível via /{slug}.
 * Exibe o cardápio completo do estabelecimento.
 */

// Importar a página da feature
import CardapioPublicoPage from "~/features/public/cardapio/pages/CardapioPublicoPage.vue";
import { useCardapioPublico } from "~/features/public/cardapio/composables/useCardapioPublico";

// Obter o slug da rota
const route = useRoute();
const slug = route.params.slug as string;

// Carregar dados do estabelecimento para SEO
const { estabelecimento } = useCardapioPublico(slug);

// Definir meta da página
definePageMeta({
	layout: "public",
	title: "Cardápio",
});

/**
 * SEO dinâmico baseado no estabelecimento
 */
useSeoMeta({
	title: () => estabelecimento.value?.nome ?? "Cardápio",
	description: () => estabelecimento.value?.descricao ?? "Veja nosso cardápio e faça seu pedido",
	ogTitle: () => estabelecimento.value?.nome ?? "Cardápio",
	ogDescription: () => estabelecimento.value?.descricao ?? "Veja nosso cardápio e faça seu pedido",
	ogImage: () => estabelecimento.value?.capa ?? estabelecimento.value?.logo ?? undefined,
});
</script>

<template>
	<CardapioPublicoPage :slug="slug" />
</template>
