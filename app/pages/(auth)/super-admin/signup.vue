<script setup lang="ts">
/**
 * 📌 /super-admin/signup
 *
 * Página de cadastro da plataforma - importa da feature auth
 */

// Importar componente da feature
import SuperAdminSignupPage from "~/features/auth/pages/SuperAdminSignupPage.vue";

// Definir layout
definePageMeta({
	layout: "auth",
});

// Meta tags para SEO
useSeoMeta({
	title: "Cadastro Plataforma - WebiDelivery",
	description: "Cadastro na equipe WebiDelivery com código de acesso",
});
</script>

<template>
	<SuperAdminSignupPage />
</template>
