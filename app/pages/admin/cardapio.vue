<script setup lang="ts">
/**
 * 📌 Rota /admin/cardapio
 *
 * Página de gerenciamento do cardápio do estabelecimento.
 * Importa a página principal da feature.
 */

// Importar a página da feature
import CardapioPage from "~/features/admin/cardapio/pages/CardapioPage.vue";

// Meta da página
definePageMeta({
	layout: "admin",
	middleware: ["admin-only", "onboarding"], // ✅ Proteção de cargo + onboarding
});

// SEO
useSeoMeta({
	title: "Cardápio - WebiDelivery",
	description: "Gerencie categorias, produtos, adicionais e combos do seu cardápio",
});
</script>

<template>
	<CardapioPage />
</template>
