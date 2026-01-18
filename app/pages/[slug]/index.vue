<script setup lang="ts">
/**
 * 📌 Página do Cardápio Público
 *
 * Página principal do cardápio público acessível via /{slug}.
 * Exibe o cardápio completo do estabelecimento.
 */

// Importar a página da feature
import CardapioPublicoPage from "~/features/public/cardapio/pages/CardapioPublicoPage.vue";

// Obter o slug da rota
const route = useRoute();
const slug = route.params.slug as string;

// Definir meta da página
definePageMeta({
	layout: "public",
	title: "Cardápio",
});
</script>

<template>
	<CardapioPublicoPage :slug="slug" />
</template>
