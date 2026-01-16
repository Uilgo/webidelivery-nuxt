<script setup lang="ts">
/**
 * 📌 Rota do Cardápio Público
 *
 * Rota dinâmica que importa a página da feature.
 * Ex: /pizzaria-do-ze, /lanchonete-central
 */

import CardapioPublicoPage from "~/features/public/cardapio/pages/CardapioPublicoPage.vue";

// Desabilita layout padrão (usa layout limpo para cardápio público)
definePageMeta({
	layout: false,
});

// Parâmetros da rota
const route = useRoute();
const slug = computed(() => route.params.slug as string);
</script>

<template>
	<CardapioPublicoPage :slug="slug" />
</template>
