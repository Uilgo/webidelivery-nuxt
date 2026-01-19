<script setup lang="ts">
/**
 * 📊 DashboardPage - Página Principal da Dashboard Admin
 *
 * Página simples que apenas importa e renderiza o DashboardManager.
 * Seguindo o padrão estabelecido no projeto onde páginas são apenas
 * importações das features correspondentes.
 */

import DashboardManager from "~/features/admin/dashboard/components/DashboardManager.vue";
</script>

<template>
	<DashboardManager />
</template>
