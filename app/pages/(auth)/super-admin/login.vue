<script setup lang="ts">
/**
 * 📌 /super-admin/login
 *
 * Página de login da plataforma - importa da feature auth
 */

// Importar componente da feature
import SuperAdminLoginPage from "~/features/auth/pages/SuperAdminLoginPage.vue";

// Definir layout
definePageMeta({
	layout: "auth",
	middleware: ["guest"], // ✅ Redireciona usuários logados
});

// Meta tags para SEO
useSeoMeta({
	title: "Login Plataforma - WebiDelivery",
	description: "Acesso à plataforma WebiDelivery para equipe interna",
});
</script>

<template>
	<SuperAdminLoginPage />
</template>
