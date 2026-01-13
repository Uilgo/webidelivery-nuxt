<script setup lang="ts">
/**
 * 📌 /login
 *
 * Página de login - importa da feature auth
 */

// Importar componente da feature
import LoginPage from "~/features/auth/pages/LoginPage.vue";

// Definir layout
definePageMeta({
	layout: "auth",
});

// Meta tags para SEO
useSeoMeta({
	title: "Login - WebiDelivery",
	description: "Faça login na sua conta WebiDelivery e gerencie seu cardápio digital",
});
</script>

<template>
	<LoginPage />
</template>
