<script setup lang="ts">
/**
 * 📌 /super-admin/forgot-password
 *
 * Página de recuperação de senha da plataforma - importa da feature auth
 */

// Importar componente da feature
import SuperAdminForgotPage from "~/features/auth/pages/SuperAdminForgotPage.vue";

// Definir layout
definePageMeta({
	layout: "auth",
});

// Meta tags para SEO
useSeoMeta({
	title: "Recuperar Senha Plataforma - WebiDelivery",
	description: "Recupere o acesso à plataforma WebiDelivery para equipe interna",
});
</script>

<template>
	<SuperAdminForgotPage />
</template>
