<script setup lang="ts">
/**
 * 📌 CardapioHeader
 *
 * Cabeçalho premium do cardápio público com visual moderno.
 * Inclui: imagem de capa com overlay, logo com glow, badges animados,
 * chips informativos e glassmorphism.
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
 * Valor de entrega grátis formatado
 */
const valorEntregaGratis = computed(() => {
	const valor = props.estabelecimento.entrega_gratis_acima;
	return valor ? `+R$${valor.toFixed(0)}` : null;
});

/**
 * Texto completo de entrega grátis para o modal
 */
const entregaGratisTexto = computed(() => {
	const valor = props.estabelecimento.entrega_gratis_acima;
	return valor ? `Entrega grátis acima de R$ ${valor.toFixed(2)}` : null;
});

/**
 * Compartilhar estabelecimento
 */
const compartilhar = async (): Promise<void> => {
	const url = window.location.href;
	const text = `Confira o cardápio de ${props.estabelecimento.nome}!`;

	if (navigator.share) {
		try {
			await navigator.share({ title: props.estabelecimento.nome, text, url });
		} catch {
			// Usuário cancelou ou erro silencioso
		}
	} else {
		// Fallback: copia para clipboard
		await navigator.clipboard.writeText(url);
	}
};

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
	<header class="relative z-40">
		<!-- Container Principal com Capa -->
		<div class="relative overflow-hidden rounded-xl sm:rounded-2xl shadow-xl">
			<!-- Imagem de Capa com Overlay Gradiente -->
			<div class="absolute inset-0 z-0">
				<!-- Imagem de capa do estabelecimento -->
				<img
					v-if="estabelecimento.capa"
					:src="estabelecimento.capa"
					:alt="`Capa de ${estabelecimento.nome}`"
					class="w-full h-full object-cover"
					loading="eager"
				/>
				<!-- Fallback: gradiente baseado na cor primária -->
				<div
					v-else
					class="w-full h-full bg-gradient-to-br from-[var(--cardapio-primary)] via-[var(--cardapio-primary)] to-[var(--cardapio-primary)]"
				/>
				<!-- Overlay gradiente escuro para legibilidade -->
				<div
					class="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20"
					:style="{ opacity: 'var(--cardapio-overlay-opacity)' }"
				/>
			</div>

			<!-- Conteúdo do Header -->
			<div class="relative z-10 p-3 sm:p-4 md:p-5 lg:p-6 xl:p-7">
				<div class="flex items-start gap-2 sm:gap-3 md:gap-4 lg:gap-5">
					<!-- Logo com Glow Effect -->
					<div class="relative shrink-0 group">
						<!-- Glow ring -->
						<div
							class="absolute -inset-1 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[var(--cardapio-primary)] to-[var(--cardapio-secondary,var(--cardapio-primary))] opacity-75 blur-sm group-hover:opacity-100 transition-opacity duration-300"
						/>
						<!-- Logo Container -->
						<div
							class="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 xl:w-36 xl:h-36 rounded-xl sm:rounded-2xl overflow-hidden bg-[var(--cardapio-secondary)] shadow-2xl ring-2 ring-white/50"
						>
							<img
								v-if="estabelecimento.logo"
								:src="estabelecimento.logo"
								:alt="`Logo de ${estabelecimento.nome}`"
								class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
								loading="eager"
							/>
							<div
								v-else
								class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200"
							>
								<Icon
									name="lucide:store"
									class="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gray-400"
								/>
							</div>
						</div>
					</div>

					<!-- Informações -->
					<div class="flex-1 min-w-0 pt-1">
						<!-- Nome do Estabelecimento -->
						<h1
							class="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-white leading-tight drop-shadow-lg"
						>
							{{ estabelecimento.nome ?? "Estabelecimento" }}
						</h1>

						<!-- Descrição -->
						<p
							v-if="estabelecimento.descricao"
							class="mt-1 sm:mt-1.5 md:mt-2 text-sm sm:text-base md:text-lg text-white/80 line-clamp-2 drop-shadow"
						>
							{{ estabelecimento.descricao }}
						</p>

						<!-- Chips Informativos + Botão Ver Mais -->
						<div class="mt-2.5 sm:mt-3 md:mt-4 flex flex-wrap items-center justify-between gap-2">
							<div class="flex flex-wrap items-center gap-2">
								<!-- Badge Status (Aberto/Fechado) com pulse -->
								<div
									class="inline-flex items-center gap-1.5 px-2.5 py-1 cardapio-rounded text-xs sm:text-sm md:text-base font-semibold shadow-lg backdrop-blur-sm transition-colors duration-300"
									:class="
										estaAberto
											? 'bg-[var(--cardapio-success)] text-[var(--cardapio-success-text)]'
											: 'bg-[var(--cardapio-danger)] text-[var(--cardapio-danger-text)]'
									"
								>
									<span
										class="size-2 rounded-full"
										:class="estaAberto ? 'bg-white animate-pulse' : 'bg-white/70'"
									/>
									{{ estaAberto ? "Aberto" : "Fechado" }}
								</div>

								<!-- Tempo de Entrega (oculto no mobile) -->
								<div
									class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 cardapio-rounded text-xs sm:text-sm font-medium bg-white/20 text-white backdrop-blur-sm"
								>
									<Icon name="lucide:clock" class="w-3.5 h-3.5" />
									{{ tempoEntrega }}
								</div>

								<!-- Frete Grátis (oculto no mobile) -->
								<div
									v-if="valorEntregaGratis"
									class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 cardapio-rounded text-xs sm:text-sm font-medium text-[var(--cardapio-warning-text)] shadow-lg bg-[var(--cardapio-warning)]"
								>
									<Icon name="lucide:truck" class="w-3.5 h-3.5" />
									Grátis {{ valorEntregaGratis }}
								</div>
							</div>

							<!-- Botão Ver Mais -->
							<button
								type="button"
								class="inline-flex items-center gap-1.5 px-3 py-1.5 cardapio-rounded text-xs sm:text-sm md:text-base font-medium bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
								@click="modalInfoAberto = true"
							>
								<Icon name="lucide:info" class="w-4 h-4" />
								Ver Mais
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</header>

	<!-- Modal de Informações Premium -->
	<UiModal v-model="modalInfoAberto" title="Informações" size="md">
		<div class="space-y-5">
			<!-- Header do Modal com Logo -->
			<div class="flex items-center gap-4 pb-4 border-b border-[var(--cardapio-border)]">
				<div class="size-16 rounded-xl overflow-hidden bg-[var(--cardapio-secondary)] shadow-md">
					<img
						v-if="estabelecimento.logo"
						:src="estabelecimento.logo"
						:alt="estabelecimento.nome"
						class="w-full h-full object-cover"
					/>
					<div v-else class="w-full h-full flex items-center justify-center">
						<Icon name="lucide:store" class="w-8 h-8 text-[var(--cardapio-text-muted)]" />
					</div>
				</div>
				<div>
					<h3 class="text-lg font-bold text-[var(--cardapio-text)]">
						{{ estabelecimento.nome }}
					</h3>
					<UiBadge :variant="estaAberto ? 'success' : 'error'" size="sm" class="mt-1">
						{{ estaAberto ? "Aberto agora" : "Fechado no momento" }}
					</UiBadge>
				</div>
			</div>

			<!-- Descrição -->
			<div v-if="estabelecimento.descricao">
				<h4 class="text-sm font-semibold text-[var(--cardapio-text)] mb-2 flex items-center gap-2">
					<Icon name="lucide:file-text" class="w-4 h-4 text-[var(--cardapio-primary)]" />
					Sobre
				</h4>
				<p class="text-sm text-[var(--cardapio-text-muted)] leading-relaxed">
					{{ estabelecimento.descricao }}
				</p>
			</div>

			<!-- Grid de Informações -->
			<div class="grid grid-cols-2 gap-3">
				<!-- Tempo de Entrega -->
				<div
					class="p-3 rounded-xl bg-[var(--cardapio-secondary)] border border-[var(--cardapio-border)]"
				>
					<div class="flex items-center gap-2 text-[var(--cardapio-primary)] mb-1">
						<Icon name="lucide:clock" class="w-4 h-4" />
						<span class="text-xs font-medium">Tempo de Entrega</span>
					</div>
					<p class="text-lg font-bold text-[var(--cardapio-text)]">{{ tempoEntrega }}</p>
				</div>

				<!-- Frete Grátis -->
				<div
					v-if="entregaGratisTexto"
					class="p-3 rounded-xl bg-[var(--cardapio-success-light)] dark:bg-[var(--cardapio-success-dark)] bg-opacity-20 dark:bg-opacity-20"
				>
					<div class="flex items-center gap-2 text-[var(--cardapio-success)] mb-1 font-medium">
						<Icon name="lucide:truck" class="w-4 h-4" />
						<span class="text-xs font-medium">Frete Grátis</span>
					</div>
					<p
						class="text-lg font-bold text-[var(--cardapio-success-dark)] dark:text-[var(--cardapio-success)] filter brightness-110"
					>
						{{ valorEntregaGratis }}
					</p>
				</div>
			</div>

			<!-- Endereço -->
			<div v-if="enderecoCompleto">
				<h4 class="text-sm font-semibold text-[var(--cardapio-text)] mb-2 flex items-center gap-2">
					<Icon name="lucide:map-pin" class="w-4 h-4 text-[var(--cardapio-primary)]" />
					Endereço
				</h4>
				<p class="text-sm text-[var(--cardapio-text-muted)]">{{ enderecoCompleto }}</p>
			</div>

			<!-- Ações (WhatsApp + Compartilhar) -->
			<div>
				<h4 class="text-sm font-semibold text-[var(--cardapio-text)] mb-3 flex items-center gap-2">
					<Icon name="lucide:share-2" class="w-4 h-4 text-[var(--cardapio-primary)]" />
					Ações
				</h4>
				<div class="grid grid-cols-2 gap-2">
					<!-- WhatsApp -->
					<UiButton
						v-if="estabelecimento.whatsapp"
						variant="outline"
						size="md"
						class="!border-[var(--cardapio-success)] !text-[var(--cardapio-success)] hover:!bg-[var(--cardapio-success-light)] dark:hover:!bg-[var(--cardapio-success-dark)] dark:hover:!bg-opacity-20"
						@click="abrirWhatsApp"
					>
						<template #iconLeft>
							<Icon name="lucide:message-circle" class="w-4 h-4" />
						</template>
						WhatsApp
					</UiButton>

					<!-- Compartilhar -->
					<UiButton
						variant="outline"
						size="md"
						class="!border-[var(--cardapio-primary)] !text-[var(--cardapio-primary)] hover:!bg-[var(--cardapio-primary)] hover:!bg-opacity-10"
						@click="compartilhar"
					>
						<template #iconLeft>
							<Icon name="lucide:share-2" class="w-4 h-4" />
						</template>
						Compartilhar
					</UiButton>
				</div>
			</div>
		</div>

		<template #footer="{ close }">
			<div class="flex justify-end">
				<UiButton variant="ghost" @click="close">Fechar</UiButton>
			</div>
		</template>
	</UiModal>
</template>
