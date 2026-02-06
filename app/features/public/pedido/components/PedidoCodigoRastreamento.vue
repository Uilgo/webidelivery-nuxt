<script setup lang="ts">
/**
 * 📌 PedidoCodigoRastreamento
 *
 * Card destacado com código de rastreamento e botão de copiar (Tailwind + Design System Adaptativo).
 */

import { formatarCodigoRastreamento } from "~/lib/formatters/codigo-rastreamento";
import { useToast } from "~/composables/ui/useToast";

interface Props {
	codigoRastreamento: string;
}

const props = defineProps<Props>();

const toast = useToast();

/**
 * Copiar código de rastreamento
 */
const copiarCodigo = async () => {
	try {
		await navigator.clipboard.writeText(formatarCodigoRastreamento(props.codigoRastreamento));
		toast.add({
			title: "Código copiado!",
			description: "O código de rastreamento foi copiado para a área de transferência",
			color: "success",
			duration: 3000,
		});
	} catch {
		toast.add({
			title: "Erro ao copiar",
			description: "Não foi possível copiar o código",
			color: "error",
		});
	}
};
</script>

<template>
	<div
		class="flex items-center justify-between gap-4 flex-wrap p-4 md:px-5 bg-[var(--cardapio-secondary)] rounded-2xl shadow-[var(--cardapio-card-shadow)] border-2 border-[var(--cardapio-primary)] border-opacity-20"
	>
		<!-- Esquerda: Header + Código -->
		<div class="flex items-center gap-3 flex-1 min-w-0">
			<!-- Header com ícone -->
			<div class="flex items-center gap-1.5 text-[var(--cardapio-primary)] flex-shrink-0">
				<Icon name="lucide:qr-code" class="w-3.5 h-3.5" />
				<h3 class="text-xs font-semibold uppercase tracking-wide">Código de Rastreamento</h3>
			</div>

			<!-- Código -->
			<div class="flex-1 min-w-0">
				<div
					class="text-2xl md:text-3xl font-bold tracking-wider text-[var(--cardapio-primary)] font-mono break-all"
				>
					{{ formatarCodigoRastreamento(codigoRastreamento) }}
				</div>
				<p class="text-xs text-[var(--cardapio-text-muted)] mt-0.5">
					Guarde este código para acompanhar seu pedido
				</p>
			</div>
		</div>

		<!-- Direita: Botão Copiar -->
		<div class="flex-shrink-0 w-full sm:w-auto">
			<button
				type="button"
				@click="copiarCodigo"
				class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-[var(--cardapio-muted)] border border-[var(--cardapio-border)] rounded-xl text-[var(--cardapio-text)] text-sm font-semibold transition-all duration-300 hover:bg-[var(--cardapio-primary)] hover:border-[var(--cardapio-primary)] hover:text-white hover:-translate-y-0.5 hover:shadow-[var(--cardapio-button-shadow)]"
			>
				<Icon name="lucide:copy" class="w-4 h-4" />
				<span>Copiar</span>
			</button>
		</div>
	</div>
</template>
