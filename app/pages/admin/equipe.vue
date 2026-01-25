<script setup lang="ts">
/**
 * 📌 Página de Equipe
 *
 * Página principal para gerenciamento de equipe do estabelecimento.
 * Permite Admin e Gerente gerenciar membros e convites.
 */

import EquipePage from "~/features/admin/equipe/pages/EquipePage.vue";

// Meta tags e SEO
useSeoMeta({
	title: "Equipe - WebiDelivery",
	description: "Gerencie membros da equipe, convites e permissões do seu estabelecimento",
});

// Middleware de proteção
definePageMeta({
	middleware: ["admin-only"],
	layout: "admin",
});
</script>

<template>
	<EquipePage />
</template>
