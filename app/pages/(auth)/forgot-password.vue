<script setup lang="ts">
/**
 * 📌 /forgot-password
 *
 * Página de recuperação de senha - importa da feature auth
 */

// Importar componente da feature
import ForgotPage from "~/features/auth/pages/ForgotPage.vue";

// Definir layout
definePageMeta({
	layout: "auth",
});

// Meta tags para SEO
useSeoMeta({
	title: "Esqueci minha senha - WebiDelivery",
	description: "Recupere o acesso à sua conta WebiDelivery",
});
</script>

<template>
	<ForgotPage />
</template>
