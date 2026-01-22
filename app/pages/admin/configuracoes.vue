<script setup lang="ts">
/**
 * 📌 Rota: /admin/configuracoes
 *
 * Página de configurações do estabelecimento.
 * Importa a página da feature de configurações.
 */

import ConfiguracoesPage from "~/features/admin/configuracoes/pages/ConfiguracoesPage.vue";

// Metadados da página
definePageMeta({
	middleware: ["admin-only"],
	layout: "admin",
});

// SEO
useSeoMeta({
	title: "Configurações - WebiDelivery",
	description: "Gerencie as configurações do seu estabelecimento",
});
</script>

<template>
	<div class="h-full">
		<ConfiguracoesPage />
	</div>
</template>
