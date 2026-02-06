<script setup lang="ts">
/**
 * 📌 PedidoStatus
 *
 * Componente para exibir o status atual do pedido.
 */

import type { StatusPedido } from "~/features/public/pedido/types/pedido";
import { usePedido } from "~/features/public/pedido/composables/usePedido";

interface Props {
	status: StatusPedido;
}

const props = defineProps<Props>();

const { getStatusInfo } = usePedido();

/**
 * Informações do status
 */
const statusInfo = computed(() => getStatusInfo(props.status));
</script>

<template>
	<div :class="['p-6 rounded-2xl border-2 shadow-[var(--cardapio-card-shadow)]', statusInfo.cor]">
		<div class="flex items-start gap-4">
			<div class="flex-shrink-0">
				<Icon :name="statusInfo.icone" class="w-8 h-8" />
			</div>
			<div class="flex-1">
				<h3 class="text-lg font-bold mb-1">{{ statusInfo.label }}</h3>
				<p class="text-sm opacity-90">{{ statusInfo.descricao }}</p>
			</div>
		</div>
	</div>
</template>
