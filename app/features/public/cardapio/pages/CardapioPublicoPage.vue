<script setup lang="ts">
/**
 * 📌 CardapioPublicoPage
 *
 * Página principal do cardápio público.
 * Delega toda a lógica e UI para o CardapioManager.
 */

import CardapioManager from "~/features/public/cardapio/components/shared/CardapioManager.vue";

// Props recebidas da rota
interface Props {
	slug: string;
}

const props = defineProps<Props>();
</script>

<template>
	<CardapioManager :slug="slug" />
</template>
