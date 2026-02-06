<script setup lang="ts">
/**
 * 📌 PedidoAcoes
 *
 * Botões de ação do pedido (Tailwind + Design System Adaptativo).
 */

interface Props {
	podeCancelar: boolean;
	avisoCancelamento?: string | null;
	cancelando?: boolean;
	slug: string;
}

interface Emits {
	cancelar: [];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
</script>

<template>
	<div class="space-y-4">
		<!-- Aviso sobre Cancelamento -->
		<div
			v-if="avisoCancelamento"
			class="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl"
		>
			<Icon name="lucide:info" class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
			<p class="text-sm text-blue-700 dark:text-blue-400">{{ avisoCancelamento }}</p>
		</div>

		<!-- Aviso quando NÃO pode cancelar -->
		<div
			v-if="!podeCancelar"
			class="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl"
		>
			<Icon name="lucide:alert-triangle" class="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
			<div class="text-sm text-orange-700 dark:text-orange-400">
				<p class="font-semibold mb-1">Não é possível cancelar</p>
				<p>
					Seu pedido já está sendo preparado e não pode mais ser cancelado. Em caso de dúvidas,
					entre em contato pelo WhatsApp.
				</p>
			</div>
		</div>

		<!-- Botões de Ação -->
		<div class="flex flex-col sm:flex-row gap-3">
			<!-- Botão Cancelar -->
			<button
				v-if="podeCancelar"
				type="button"
				@click="emit('cancelar')"
				:disabled="cancelando"
				class="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 bg-[var(--cardapio-secondary)] border-2 border-[#ef4444] text-[#ef4444] rounded-2xl font-bold text-base transition-all duration-300 hover:bg-[#ef4444] hover:text-white hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
			>
				<Icon name="lucide:x-circle" class="w-5 h-5" />
				<span>{{ cancelando ? "Cancelando..." : "Cancelar Pedido" }}</span>
			</button>

			<!-- Botão Voltar ao Cardápio -->
			<button
				type="button"
				@click="navigateTo(`/${slug}`)"
				class="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#f97316] to-[#ea580c] text-white rounded-2xl font-bold text-base transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
			>
				<Icon name="lucide:utensils" class="w-5 h-5" />
				<span>Voltar ao Cardápio</span>
			</button>
		</div>
	</div>
</template>
