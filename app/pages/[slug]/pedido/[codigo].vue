<script setup lang="ts">
/**
 * 📌 Rota: /[slug]/pedido/[codigo]
 *
 * Página de confirmação e acompanhamento do pedido.
 * Usa código de rastreamento em vez de ID para maior segurança.
 */

import PedidoConfirmacaoPage from "~/features/public/pedido/pages/PedidoConfirmacaoPage.vue";
</script>

<template>
	<PedidoConfirmacaoPage />
</template>
