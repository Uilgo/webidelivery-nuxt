<script setup lang="ts">
/**
 * 📌 Rota: /admin/perfil
 *
 * Página de gerenciamento de perfil do usuário.
 * Usa o layout admin e orquestra a feature de perfil.
 */

// Importar componente orquestrador da feature
import PerfilPage from "~/features/admin/perfil/pages/PerfilPage.vue";

// Configuração da página - Correção do layout e middleware
definePageMeta({
	layout: "admin",
	middleware: ["admin-only"], // Apenas usuários autenticados
});

// SEO dinâmico
useSeoMeta({
	title: "Meu Perfil - WebiDelivery",
	description: "Gerencie suas informações pessoais e segurança da conta",
});
</script>

<template>
	<PerfilPage />
</template>
