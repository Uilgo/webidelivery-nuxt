<script setup lang="ts">
/**
 * 🛣️ Rota: /admin/relatorios
 *
 * Página de relatórios do painel administrativo.
 * Importa a página da feature que contém toda a lógica.
 */

import RelatoriosPage from "~/features/admin/relatorios/pages/RelatoriosPage.vue";

// Metadados da página
definePageMeta({
	layout: "admin",
	middleware: ["admin-only"],
});

// SEO
useSeoMeta({
	title: "Relatórios - WebiDelivery",
	description:
		"Visualize relatórios detalhados de pedidos, vendas, produtos, marketing e financeiro",
});
</script>

<template>
	<RelatoriosPage />
</template>
