<script setup lang="ts">
/**
 * 📌 PedidosPage
 *
 * Página principal de gerenciamento de pedidos do painel admin.
 * Delega toda a lógica e UI para o PedidosManager.
 */

import PedidosManager from "~/features/admin/pedidos/components/PedidosManager.vue";

// Define metadata da página
definePageMeta({
	layout: "admin",
});
</script>

<template>
	<PedidosManager />
</template>
