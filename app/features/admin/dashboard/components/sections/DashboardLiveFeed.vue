<script setup lang="ts">
/**
 * 📊 DashboardLiveFeed - Feed de Pedidos em Tempo Real
 *
 * Exibe lista dos últimos pedidos com status e tempo decorrido.
 */

import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { PedidoResumo } from "../../types/dashboard";

interface Props {
	orders: PedidoResumo[];
	loading?: boolean;
}

defineProps<Props>();

/**
 * Formata o tempo decorrido (ex: "há 5 min")
 */
const formatTime = (dateStr: string) => {
	try {
		return formatDistanceToNow(new Date(dateStr), {
			addSuffix: true,
			locale: ptBR,
		});
	} catch {
		return "agora";
	}
};

/**
 * Formata moeda
 */
const formatCurrency = (value: number) => {
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(value);
};

/**
 * Retorna classes de estilo baseadas no status
 */
const getStatusClasses = (status: string) => {
	const map: Record<string, string> = {
		pendente: "bg-yellow-100 text-yellow-700",
		preparo: "bg-blue-100 text-blue-700",
		entrega: "bg-orange-100 text-orange-700",
		concluido: "bg-green-100 text-green-700",
		cancelado: "bg-red-100 text-red-700",
	};
	return map[status.toLowerCase()] || "bg-gray-100 text-gray-700";
};

/**
 * Retorna label formatada do status
 */
const formatStatus = (status: string) => {
	const map: Record<string, string> = {
		pendente: "Pendente",
		preparo: "Preparo",
		entrega: "Entrega",
		concluido: "Concluído",
		cancelado: "Cancelado",
	};
	return map[status.toLowerCase()] || status;
};
</script>

<template>
	<UiCard class="p-5 h-full flex flex-col">
		<div class="flex items-center justify-between mb-6">
			<div class="flex items-center gap-2">
				<div class="relative">
					<span
						class="absolute -right-1 -top-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-[var(--card-bg)]"
					></span>
					<Icon name="lucide:radio" class="w-5 h-5 text-[var(--primary)]" />
				</div>
				<h3 class="text-lg font-bold text-[var(--text-primary)]">Feed de Pedidos</h3>
			</div>
			<UiButton
				variant="ghost"
				size="sm"
				class="text-[var(--primary)] hover:text-[var(--primary-dark)] hover:bg-[var(--primary-light)]"
				to="/admin/pedidos"
			>
				Ver todos
			</UiButton>
		</div>

		<div v-if="loading" class="space-y-4">
			<UiSkeleton v-for="i in 4" :key="i" class="h-16 w-full" />
		</div>

		<div v-else-if="orders.length === 0" class="flex-1 flex items-center justify-center">
			<p class="text-[var(--text-muted)] text-sm">Nenhum pedido recente</p>
		</div>

		<div v-else class="space-y-4 flex-1 overflow-y-auto pr-1 max-h-[300px] custom-scrollbar">
			<div
				v-for="pedido in orders"
				:key="pedido.id"
				class="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--bg-muted)] transition-colors border border-transparent hover:border-[var(--border-default)] group cursor-pointer"
			>
				<div class="flex items-center gap-3">
					<div>
						<div class="flex items-center gap-2">
							<span class="font-bold text-[var(--text-primary)] text-sm">
								#{{ pedido.numero }}
							</span>
							<span class="text-sm text-[var(--text-secondary)] truncate max-w-[120px]">
								{{ pedido.cliente_nome }}
							</span>
						</div>
						<div class="flex items-center gap-2 mt-0.5">
							<span
								class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded"
								:class="getStatusClasses(pedido.status)"
							>
								{{ formatStatus(pedido.status) }}
							</span>
							<span class="text-xs text-[var(--text-muted)] flex items-center gap-1">
								<Icon name="lucide:clock" class="w-3 h-3" />
								{{ formatTime(pedido.created_at) }}
							</span>
						</div>
					</div>
				</div>

				<div class="flex items-center gap-2">
					<p class="font-bold text-[var(--text-primary)]">
						{{ formatCurrency(pedido.valor_total) }}
					</p>
					<Icon
						name="lucide:chevron-right"
						class="w-4 h-4 text-[var(--text-muted)] transition-colors group-hover:text-[var(--text-primary)]"
					/>
				</div>
			</div>
		</div>
	</UiCard>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
	width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
	background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
	background-color: var(--border-default);
	border-radius: 20px;
}
</style>
