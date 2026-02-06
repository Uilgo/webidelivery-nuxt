<script setup lang="ts">
/**
 * 📌 PedidoTabs
 *
 * Tabs para filtrar pedidos por status usando UiTabs.
 */

import type { StatusPedido } from "~/features/admin/pedidos/types/pedidos-admin";

interface Props {
	modelValue: StatusPedido | null;
	contadores: Record<StatusPedido, number>;
}

interface Emits {
	"update:modelValue": [value: StatusPedido | null];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

/**
 * Total de pedidos
 */
const totalPedidos = computed(() => {
	return Object.values(props.contadores).reduce((acc, count) => acc + count, 0);
});

/**
 * Tabs formatadas para UiTabs
 */
const tabs = computed(() => [
	{ key: "todos", label: "Todos", badge: totalPedidos.value },
	{ key: "pendente", label: "Pendentes", badge: props.contadores.pendente || 0 },
	{ key: "aceito", label: "Aceitos", badge: props.contadores.aceito || 0 },
	{ key: "preparo", label: "Em Preparo", badge: props.contadores.preparo || 0 },
	{ key: "pronto", label: "Prontos", badge: props.contadores.pronto || 0 },
	{ key: "entrega", label: "Em Entrega", badge: props.contadores.entrega || 0 },
	{ key: "concluido", label: "Concluídos", badge: props.contadores.concluido || 0 },
	{ key: "cancelado", label: "Cancelados", badge: props.contadores.cancelado || 0 },
]);

/**
 * Tab ativa (converte null para "todos")
 */
const tabAtiva = computed({
	get: () => props.modelValue || "todos",
	set: (value: string) => {
		emit("update:modelValue", value === "todos" ? null : (value as StatusPedido));
	},
});
</script>

<template>
	<UiTabs v-model="tabAtiva" :tabs="tabs">
		<!-- Slot vazio - tabs são apenas para filtro, conteúdo fica fora -->
		<template #default></template>
	</UiTabs>
</template>
