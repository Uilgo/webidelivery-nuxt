<script setup lang="ts">
/**
 * 📌 Rota: /admin/dashboard
 *
 * Página do dashboard administrativo do estabelecimento.
 * Usa o layout admin e importa o componente da feature.
 */

// Importar componente da feature
import DashboardPage from "~/features/admin/dashboard/pages/DashboardPage.vue";

// Configuração da página
definePageMeta({
	layout: "admin"
});

// SEO
useSeoMeta({
	title: "Dashboard - WebiDelivery",
	description: "Painel administrativo com métricas e indicadores do seu negócio",
});
</script>

<template>
	<DashboardPage />
</template>
