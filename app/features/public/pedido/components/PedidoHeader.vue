<script setup lang="ts">
/**
 * 📌 PedidoHeader
 *
 * Header da página com logo e status badge (Tailwind + Design System Adaptativo).
 */

import type { StatusPedido } from "~/features/public/pedido/types/pedido";
import { usePedido } from "~/features/public/pedido/composables/usePedido";

interface Props {
	status: StatusPedido;
	slug: string;
	nomeEstabelecimento?: string;
}

const props = defineProps<Props>();

const { getStatusInfo } = usePedido();

/**
 * Informações do status
 */
const statusInfo = computed(() => getStatusInfo(props.status));
</script>

<template>
	<div
		class="bg-gradient-to-r from-[var(--cardapio-primary)] to-[var(--cardapio-primary)] opacity-95 rounded-3xl p-6 shadow-[var(--cardapio-card-shadow-hover)] mb-6"
	>
		<div class="flex items-center justify-between flex-wrap gap-4">
			<!-- Logo/Nome -->
			<button
				type="button"
				@click="navigateTo(`/${slug}`)"
				class="flex items-center gap-3 text-white hover:opacity-80 transition-opacity"
			>
				<Icon name="lucide:arrow-left" class="w-5 h-5" />
				<div class="flex items-center gap-3">
					<Icon name="lucide:store" class="w-6 h-6" />
					<span class="text-lg font-bold">{{ nomeEstabelecimento || "Voltar" }}</span>
				</div>
			</button>

			<!-- Status Badge -->
			<div
				class="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white font-semibold text-sm"
			>
				<Icon :name="statusInfo.icone" class="w-4 h-4" />
				<span>{{ statusInfo.label }}</span>
			</div>
		</div>
	</div>
</template>
