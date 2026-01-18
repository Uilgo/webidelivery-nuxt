<script setup lang="ts">
/**
 * 📌 Rota: /admin/pedidos
 *
 * Página de gerenciamento de pedidos do painel admin.
 * Importa e renderiza PedidosPage da feature.
 */

// Importar a página da feature
import PedidosPage from "~/features/admin/pedidos/pages/PedidosPage.vue";

// Metadados da página
definePageMeta({
	layout: "admin",
});

// SEO
useSeoMeta({
	title: "Pedidos - Painel Admin",
	description: "Gerencie os pedidos do seu estabelecimento",
});
</script>

<template>
	<PedidosPage />
</template>
