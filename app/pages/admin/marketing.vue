<script setup lang="ts">
/**
 * 📌 Rota: /admin/marketing
 *
 * Página de marketing do painel administrativo.
 * Importa a página da feature de marketing.
 */

import MarketingPage from "~/features/admin/marketing/pages/MarketingPage.vue";

// Metadata da página
definePageMeta({
	middleware: ["admin-only"],
	layout: "admin",
});

// SEO
useSeoMeta({
	title: "Marketing - WebiDelivery",
	description: "Gerencie cupons, banners e promoções do seu estabelecimento",
});
</script>

<template>
	<MarketingPage />
</template>
