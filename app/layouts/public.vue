<script setup lang="ts">
/**
 * 📌 Layout Público
 *
 * Layout para páginas públicas do cardápio.
 * Usado nas rotas /{slug} e /{slug}/checkout.
 */

// Configurar meta tags básicas
useHead({
	htmlAttrs: {
		lang: "pt-BR",
	},
	meta: [
		{ charset: "utf-8" },
		{ name: "viewport", content: "width=device-width, initial-scale=1" },
	],
});
</script>

<template>
	<div class="min-h-screen bg-[var(--bg-primary)]">
		<!-- Conteúdo da página -->
		<slot></slot>
	</div>
</template>
