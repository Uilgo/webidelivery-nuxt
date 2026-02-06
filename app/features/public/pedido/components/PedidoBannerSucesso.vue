<script setup lang="ts">
/**
 * 📌 PedidoBannerSucesso
 *
 * Banner de sucesso do pedido (Tailwind + Design System Adaptativo).
 */

interface Props {
	numeroPedido: number;
}

const props = defineProps<Props>();
</script>

<template>
	<div
		class="relative overflow-hidden flex items-center gap-4 p-5 md:p-6 bg-gradient-to-r from-[#10b981] to-[#059669] text-white rounded-2xl shadow-[var(--cardapio-card-shadow)]"
	>
		<!-- Efeito de fundo -->
		<div
			class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
		/>

		<!-- Ícone -->
		<div class="relative z-10 flex-shrink-0">
			<Icon name="lucide:check-circle-2" class="w-10 h-10 md:w-12 md:h-12 animate-pulse" />
		</div>

		<!-- Conteúdo -->
		<div class="relative z-10 flex-1">
			<h1 class="text-lg md:text-xl font-bold mb-1">Pedido realizado com sucesso!</h1>
			<p class="text-sm md:text-base opacity-90">
				Seu pedido <strong>#{{ numeroPedido }}</strong> foi recebido e está sendo processado.
			</p>
		</div>
	</div>
</template>
