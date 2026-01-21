<script setup lang="ts">
/**
 * 📌 Página /admin/onboarding
 *
 * Rota de configuração inicial do estabelecimento.
 * Usa layout admin com sidebar mostrando apenas item "Onboarding".
 */

// Importar componente da feature
import OnboardingPage from "~/features/onboarding/pages/OnboardingPage.vue";

// Meta da página
definePageMeta({
	layout: "admin",
	middleware: ["admin-only", "onboarding"], // ✅ Proteção de cargo + onboarding
});

// SEO da página
useSeoMeta({
	title: "Configuração do Estabelecimento - WebiDelivery",
	description: "Configure seu estabelecimento em 5 etapas simples",
});
</script>

<template>
	<OnboardingPage />
</template>
