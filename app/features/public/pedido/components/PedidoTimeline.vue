<script setup lang="ts">
/**
 * 📌 PedidoTimeline
 *
 * Timeline visual do status do pedido com animações (Tailwind + Design System Adaptativo).
 */

import type { StatusPedido } from "~/features/public/pedido/types/pedido";
import { formatDateTime } from "~/lib/formatters/date";

interface Props {
	status: StatusPedido;
	createdAt: string;
	aceitoEm?: string | null;
	preparoEm?: string | null;
	prontoEm?: string | null;
	entregaEm?: string | null;
	concluidoEm?: string | null;
	canceladoEm?: string | null;
}

const props = defineProps<Props>();

/**
 * Configuração dos steps da timeline
 */
const timelineSteps = computed(() => {
	const steps = [
		{
			id: "recebido",
			icon: "lucide:file-text",
			title: "Pedido Recebido",
			description: formatDateTime(props.createdAt),
			status: "active" as const,
		},
		{
			id: "aceito",
			icon: "lucide:check-circle",
			title: props.status === "pendente" ? "Aguardando Confirmação" : "Pedido Confirmado",
			description:
				props.status === "pendente"
					? "Seu pedido foi recebido e está aguardando confirmação do estabelecimento."
					: props.aceitoEm
						? `Confirmado em ${formatDateTime(props.aceitoEm)} - Seu pedido foi recebido e confirmado, aguarde pois em breve ele começará a ser preparado!`
						: "Seu pedido foi recebido e confirmado, aguarde pois em breve ele começará a ser preparado!",
			status:
				props.status === "pendente"
					? ("current" as const)
					: props.status === "aceito"
						? ("current" as const)
						: props.aceitoEm
							? ("active" as const)
							: ("inactive" as const),
		},
		{
			id: "preparo",
			icon: "lucide:chef-hat",
			title: "Em Preparo",
			description: props.preparoEm
				? `Iniciado em ${formatDateTime(props.preparoEm)} - O restaurante está preparando seu pedido`
				: "O restaurante está preparando seu pedido",
			status:
				props.status === "preparo"
					? ("current" as const)
					: props.preparoEm
						? ("active" as const)
						: ("inactive" as const),
		},
		{
			id: "pronto",
			icon: "lucide:check-circle-2",
			title: "Pedido Pronto",
			description: props.prontoEm
				? `Pronto em ${formatDateTime(props.prontoEm)} - Seu pedido está pronto, aguarde, pois em breve ele sairá para entrega!`
				: "Seu pedido está pronto, aguarde, pois em breve ele sairá para entrega!",
			status:
				props.status === "pronto"
					? ("current" as const)
					: props.prontoEm
						? ("active" as const)
						: ("inactive" as const),
		},
		{
			id: "entrega",
			icon: "lucide:bike",
			title: "Saiu para Entrega",
			description: props.entregaEm
				? `Saiu em ${formatDateTime(props.entregaEm)} - Seu pedido está a caminho`
				: "Seu pedido está a caminho",
			status:
				props.status === "entrega"
					? ("current" as const)
					: props.entregaEm
						? ("active" as const)
						: ("inactive" as const),
		},
		{
			id: "concluido",
			icon: "lucide:check-circle-2",
			title: "Entregue",
			description: props.concluidoEm
				? `Entregue em ${formatDateTime(props.concluidoEm)} - Obrigado pela preferência! Esperamos que tenha gostado do seu pedido. Volte sempre! 🎉`
				: "Pedido entregue com sucesso - Obrigado pela preferência! Esperamos que tenha gostado do seu pedido. Volte sempre! 🎉",
			status: props.status === "concluido" ? ("active" as const) : ("inactive" as const),
		},
	];

	// Se cancelado, mostrar apenas até o ponto do cancelamento
	if (props.canceladoEm) {
		return [
			...steps.slice(0, 2),
			{
				id: "cancelado",
				icon: "lucide:x-circle",
				title: "Pedido Cancelado",
				description: formatDateTime(props.canceladoEm),
				status: "cancelled" as const,
			},
		];
	}

	return steps;
});
</script>

<template>
	<div
		class="relative p-6 bg-[var(--cardapio-secondary)] rounded-2xl shadow-[var(--cardapio-card-shadow)]"
	>
		<!-- Linha conectora vertical -->
		<div class="absolute left-[39px] top-14 bottom-14 w-0.5 bg-[var(--cardapio-border)]" />

		<!-- Steps -->
		<div
			v-for="(step, index) in timelineSteps"
			:key="step.id"
			class="flex gap-4 py-4 relative first:pt-0 last:pb-0"
		>
			<!-- Ícone -->
			<div
				class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all duration-300"
				:class="{
					'bg-[var(--cardapio-muted)] border-2 border-[var(--cardapio-border)] text-[var(--cardapio-text-muted)]':
						step.status === 'inactive',
					'bg-[var(--cardapio-primary)] border-2 border-[var(--cardapio-primary)] text-white':
						step.status === 'active',
					'bg-[#f59e0b] border-2 border-[#f59e0b] text-white animate-pulse':
						step.status === 'current',
					'bg-[#ef4444] border-2 border-[#ef4444] text-white': step.status === 'cancelled',
				}"
			>
				<Icon :name="step.icon" class="w-4 h-4" />
			</div>

			<!-- Conteúdo -->
			<div class="flex-1 pt-1">
				<h4
					class="text-sm font-semibold mb-1 transition-colors duration-300"
					:class="{
						'text-[var(--cardapio-text-muted)]': step.status === 'inactive',
						'text-[var(--cardapio-text)]':
							step.status === 'active' || step.status === 'current' || step.status === 'cancelled',
					}"
				>
					{{ step.title }}
				</h4>
				<p class="text-xs text-[var(--cardapio-text-muted)] leading-relaxed">
					{{ step.description }}
				</p>
			</div>
		</div>
	</div>
</template>
