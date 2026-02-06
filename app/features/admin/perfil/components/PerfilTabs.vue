<script setup lang="ts">
/**
 * 📌 PerfilTabs
 *
 * Navegação entre as duas tabs do perfil:
 * - Dados Pessoais (avatar + dados)
 * - Configurações (email + senha)
 */

import { computed } from "vue";

interface Props {
	modelValue: "dados" | "configuracoes";
}

interface Emits {
	"update:modelValue": [value: "dados" | "configuracoes"];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Configuração das tabs
const tabs = [
	{ key: "dados", label: "Dados Pessoais", icon: "lucide:user" },
	{ key: "configuracoes", label: "Configurações", icon: "lucide:settings" },
];

// Proxy para lidar com o v-model do componente pai
const currentTab = computed({
	get: () => props.modelValue,
	set: (val) => emit("update:modelValue", val as "dados" | "configuracoes"),
});
</script>

<template>
	<UiTabs v-model="currentTab" :tabs="tabs" class="w-full" />
</template>
