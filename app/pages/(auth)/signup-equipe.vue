<script setup lang="ts">
/**
 * 📌 /signup-equipe
 *
 * Página de cadastro de membro da equipe - importa da feature auth
 */

// Importar componente da feature
import TeamMemberSignupPage from "~/features/auth/pages/TeamMemberSignupPage.vue";

// Definir layout
definePageMeta({
	layout: "auth",
});

// Meta tags para SEO
useSeoMeta({
	title: "Entrar na Equipe - WebiDelivery",
	description: "Cadastre-se na equipe do estabelecimento com seu código de acesso",
});
</script>

<template>
	<TeamMemberSignupPage />
</template>
