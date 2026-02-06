<script setup lang="ts">
/**
 * 📌 /signup
 *
 * Página de cadastro - importa da feature auth
 */

// Importar componente da feature
import SignupPage from "~/features/auth/pages/SignupPage.vue";

// Definir layout
definePageMeta({
	layout: "auth",
	middleware: ["guest"], // ✅ Redireciona usuários logados
});

// Meta tags para SEO
useSeoMeta({
	title: "Cadastro - WebiDelivery",
	description: "Crie sua conta WebiDelivery e comece a gerenciar seu cardápio digital",
});
</script>

<template>
	<SignupPage />
</template>
