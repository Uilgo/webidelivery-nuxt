<script setup lang="ts">
/**
 * 📌 Rota: /{slug}/checkout
 *
 * Página de checkout do estabelecimento.
 */

import CheckoutPage from "~/features/public/checkout/pages/CheckoutPage.vue";

/**
 * Meta tags
 */
useSeoMeta({
	title: "Finalizar Pedido",
	description: "Finalize seu pedido e escolha a forma de entrega e pagamento.",
	robots: "noindex, nofollow",
});
</script>

<template>
	<CheckoutPage />
</template>
