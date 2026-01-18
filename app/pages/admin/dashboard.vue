<script setup lang="ts">
/**
 * 📌 Rota: /admin/dashboard
 *
 * Página do dashboard administrativo do estabelecimento.
 * Usa o layout admin e importa o componente da feature.
 */

// Importar componente da feature
import DashboardPage from "~/features/admin/dashboard/pages/DashboardPage.vue";

// Definir layout
definePageMeta({
	layout: "admin",
});

// Meta tags para SEO
useHead({
	title: "Dashboard - WebiDelivery",
	meta: [
		{
			name: "description",
			content: "Dashboard administrativo do estabelecimento",
		},
	],
});
</script>

<template>
	<DashboardPage />
</template>
