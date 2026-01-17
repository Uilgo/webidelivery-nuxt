<script setup lang="ts">
/**
 * 📌 CardapioHeader
 *
 * Cabeçalho do cardápio público com logo, nome, informações e status de funcionamento.
 */

import type { Estabelecimento } from "../types/cardapio-publico";

interface Props {
	estabelecimento: Estabelecimento;
}

const props = defineProps<Props>();

// Status aberto/fechado vem direto do banco
const estaAberto = computed(() => props.estabelecimento.aberto);

// Estado do modal de informações
const modalInfoAberto = ref(false);

/**
 * Formata endereço completo
 */
const enderecoCompleto = computed(() => {
	// Por enquanto retorna null, pois não temos endereço no tipo simplificado
	// TODO: Buscar endereço do estabelecimento se necessário
	return null;
});

/**
 * Formata tempo de entrega
 */
const tempoEntrega = computed(() => {
	const { tempo_entrega_min, tempo_entrega_max } = props.estabelecimento;
	return `${tempo_entrega_min}-${tempo_entrega_max} min`;
});

/**
 * Texto de entrega grátis
 */
const entregaGratisTexto = computed(() => {
	const valor = props.estabelecimento.entrega_gratis_acima;
	return valor ? `Entrega grátis acima de R$ ${valor.toFixed(2)}` : null;
});

/**
 * Abre WhatsApp
 */
const abrirWhatsApp = (): void => {
	if (props.estabelecimento.whatsapp) {
		const numero = props.estabelecimento.whatsapp.replace(/\D/g, "");
		window.open(`https://wa.me/${numero}`, "_blank");
	}
};
</script>

<template>
	<header class="sticky top-0 z-40 bg-transparent">
		<div class="bg-[var(--bg-surface)] rounded-lg sm:rounded-xl shadow-lg p-2 sm:p-3 md:p-4">
			<div class="flex items-start gap-2 sm:gap-3 md:gap-4">
				<!-- Logo Quadrado -->
				<div
					class="size-16 sm:size-20 md:size-24 lg:size-28 rounded-md sm:rounded-lg overflow-hidden bg-[var(--bg-surface)] shadow-lg shrink-0"
				>
					<img
						v-if="estabelecimento.logo"
						:src="estabelecimento.logo"
						:alt="`Logo de ${estabelecimento.nome}`"
						class="w-full h-full object-cover"
						loading="eager"
					/>
					<div
						v-else
						class="w-full h-full flex items-center justify-center bg-[var(--bg-muted)] text-[var(--text-muted)]"
					>
						<Icon name="lucide:store" class="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
					</div>
				</div>

				<!-- Info -->
				<div class="flex-1 min-w-0">
					<!-- Linha 1: Nome + ModeToggle -->
					<div class="flex items-start justify-between gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
						<div class="flex-1 min-w-0">
							<h1
								class="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[var(--text-primary)] leading-tight"
							>
								{{ estabelecimento.nome ?? "Estabelecimento" }}
							</h1>
							<p
								v-if="estabelecimento.descricao"
								class="text-sm sm:text-base text-[var(--text-muted)] line-clamp-1 mt-1"
							>
								{{ estabelecimento.descricao }}
							</p>
						</div>
						<LayoutsModeToggle class="shrink-0" />
					</div>

					<!-- Linha 2: Entrega Grátis -->
					<div
						v-if="entregaGratisTexto"
						class="flex items-center gap-1 text-xs sm:text-sm text-green-600 font-medium mb-2"
					>
						{{ entregaGratisTexto }}
					</div>

					<!-- Linha 3: Badge + Tempo + Botão Ver Mais -->
					<div class="flex items-center justify-between gap-2">
						<div class="flex items-center gap-2 sm:gap-3">
							<UiBadge :variant="estaAberto ? 'success' : 'error'" size="md">
								<template #iconLeft>
									<Icon
										:name="estaAberto ? 'lucide:check-circle' : 'lucide:x-circle'"
										class="w-3 h-3 sm:w-3.5 sm:h-3.5"
									/>
								</template>
								{{ estaAberto ? "Aberto" : "Fechado" }}
							</UiBadge>

							<!-- Tempo de Entrega -->
							<div class="flex items-center gap-1 text-xs sm:text-sm text-[var(--text-muted)]">
								<Icon name="lucide:clock" class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
								<span>{{ tempoEntrega }}</span>
							</div>
						</div>

						<UiButton
							variant="ghost"
							size="sm"
							class="text-xs sm:text-sm"
							@click="modalInfoAberto = true"
						>
							Ver Mais
						</UiButton>
					</div>
				</div>
			</div>
		</div>
	</header>

	<!-- Modal de Informações -->
	<UiModal v-model="modalInfoAberto" title="Informações" size="md">
		<div class="space-y-4">
			<!-- Descrição -->
			<div v-if="estabelecimento.descricao">
				<h3 class="text-sm font-semibold text-[var(--text-primary)] mb-1">Sobre</h3>
				<p class="text-sm text-[var(--text-muted)]">{{ estabelecimento.descricao }}</p>
			</div>

			<!-- Endereço -->
			<div v-if="enderecoCompleto">
				<h3 class="text-sm font-semibold text-[var(--text-primary)] mb-1">Endereço</h3>
				<p class="text-sm text-[var(--text-muted)]">{{ enderecoCompleto }}</p>
			</div>

			<!-- WhatsApp -->
			<div v-if="estabelecimento.whatsapp">
				<h3 class="text-sm font-semibold text-[var(--text-primary)] mb-1">Contato</h3>
				<UiButton variant="outline" size="sm" class="w-full" @click="abrirWhatsApp">
					<template #iconLeft>
						<Icon name="lucide:message-circle" class="w-4 h-4" />
					</template>
					Falar no WhatsApp
				</UiButton>
			</div>

			<!-- Tempo de Entrega -->
			<div>
				<h3 class="text-sm font-semibold text-[var(--text-primary)] mb-1">Tempo de Entrega</h3>
				<p class="text-sm text-[var(--text-muted)]">{{ tempoEntrega }}</p>
			</div>

			<!-- Entrega Grátis -->
			<div v-if="entregaGratisTexto">
				<h3 class="text-sm font-semibold text-[var(--text-primary)] mb-1">Entrega Grátis</h3>
				<p class="text-sm text-green-600 font-medium">{{ entregaGratisTexto }}</p>
			</div>

			<!-- Status -->
			<div>
				<h3 class="text-sm font-semibold text-[var(--text-primary)] mb-1">Status</h3>
				<UiBadge :variant="estaAberto ? 'success' : 'error'" size="md">
					{{ estaAberto ? "Aberto agora" : "Fechado no momento" }}
				</UiBadge>
			</div>
		</div>

		<template #footer="{ close }">
			<div class="flex justify-end">
				<UiButton variant="ghost" @click="close">Fechar</UiButton>
			</div>
		</template>
	</UiModal>
</template>
