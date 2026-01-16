<script setup lang="ts">
/**
 * 📌 CardapioHeader
 *
 * Cabeçalho do cardápio público com logo, nome e status de funcionamento.
 */

import type { EstabelecimentoPublico } from "../types/cardapio-publico";

interface Props {
	estabelecimento: EstabelecimentoPublico;
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
	const { endereco_rua, endereco_numero, endereco_bairro, endereco_cidade, endereco_estado } =
		props.estabelecimento;

	const partes = [
		endereco_rua && endereco_numero ? `${endereco_rua}, ${endereco_numero}` : null,
		endereco_bairro,
		endereco_cidade && endereco_estado ? `${endereco_cidade} - ${endereco_estado}` : null,
	].filter(Boolean);

	return partes.join(" • ");
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
	<header class="sticky top-0 z-40 px-4 pt-4 pb-2 bg-[var(--bg-page)]">
		<div class="max-w-3xl mx-auto bg-[var(--bg-surface)] rounded-xl shadow-md p-4">
			<div class="flex items-start gap-4">
				<!-- Logo -->
				<UiAvatar
					:src="estabelecimento.logo_url ?? undefined"
					:alt="estabelecimento.nome"
					size="lg"
					:fallback="estabelecimento.nome.charAt(0)"
					class="flex-shrink-0"
				/>

				<!-- Info -->
				<div class="flex-1 min-w-0">
					<!-- Linha 1: Título + Descrição + ModeToggle -->
					<div class="flex items-start justify-between gap-2 mb-2">
						<div class="flex-1 min-w-0 space-y-1">
							<h1 class="text-lg font-bold text-[var(--text-primary)] truncate">
								{{ estabelecimento.nome }}
							</h1>
							<p
								v-if="estabelecimento.descricao"
								class="text-sm text-[var(--text-muted)] line-clamp-1"
							>
								{{ estabelecimento.descricao }}
							</p>
						</div>
						<LayoutsModeToggle />
					</div>

					<!-- Linha 2: Badge + Botão Ver Mais -->
					<div class="flex items-center justify-between gap-2">
						<UiBadge :color="estaAberto ? 'success' : 'error'" size="sm">
							{{ estaAberto ? "Aberto agora" : "Fechado" }}
						</UiBadge>

						<UiButton variant="ghost" size="sm" @click="modalInfoAberto = true">
							<template #iconLeft>
								<Icon name="lucide:info" class="w-4 h-4" />
							</template>
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

			<!-- Status -->
			<div>
				<h3 class="text-sm font-semibold text-[var(--text-primary)] mb-1">Status</h3>
				<UiBadge :color="estaAberto ? 'success' : 'error'" size="md">
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
