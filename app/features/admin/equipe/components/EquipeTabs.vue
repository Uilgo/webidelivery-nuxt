<script setup lang="ts">
/**
 * 📌 EquipeTabs
 *
 * Componente de tabs para alternar entre Membros e Convites.
 * Mobile-first com design responsivo.
 */

import type { AbaEquipe } from "../types/equipe";

interface Props {
	abaAtiva: AbaEquipe;
}

interface Emits {
	change: [aba: AbaEquipe];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Definição das abas
const abas = [
	{
		key: "membros" as const,
		label: "Membros",
		icon: "lucide:users",
	},
	{
		key: "convites" as const,
		label: "Convites Pendentes",
		icon: "lucide:mail",
	},
];

// Função para alternar aba
const alternarAba = (aba: string) => {
	const abaTyped = aba as AbaEquipe;
	if (abaTyped !== props.abaAtiva) {
		emit("change", abaTyped);
	}
};
</script>

<template>
	<UiTabs :tabs="abas" :model-value="abaAtiva" @tab-change="alternarAba" />
</template>
