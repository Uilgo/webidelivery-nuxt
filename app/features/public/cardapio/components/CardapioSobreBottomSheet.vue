<script setup lang="ts">
/**
 * 📌 CardapioSobreBottomSheet
 * Bottom Sheet moderno com informações do estabelecimento para mobile
 */

import type { Estabelecimento } from "../types/cardapio-publico";

interface Props {
	modelValue: boolean;
	estabelecimento: Estabelecimento;
}

interface Emits {
	(e: "update:modelValue", value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isOpen = computed({
	get: () => props.modelValue,
	set: (value: boolean) => emit("update:modelValue", value),
});

// Status aberto/fechado
const estaAberto = computed(() => props.estabelecimento.aberto);

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
	return valor ? `R$ ${valor.toFixed(2)}` : null;
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
	<UiBottomSheet v-model="isOpen" :snap-points="[85]" :show-handle="true">
		<!-- Header com Logo e Nome -->
		<template #header>
			<div class="px-4 py-4 border-b border-[var(--cardapio-border)]">
				<div class="flex items-center gap-3">
					<!-- Logo -->
					<div
						class="size-16 rounded-xl overflow-hidden bg-[var(--cardapio-secondary)] shadow-md shrink-0 ring-2 ring-[var(--cardapio-primary)] ring-opacity-20"
					>
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

					<!-- Nome + Status -->
					<div class="flex-1 min-w-0">
						<h2 class="text-lg font-bold text-[var(--cardapio-text)] leading-tight mb-1">
							{{ estabelecimento.nome }}
						</h2>
						<div
							class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
							:class="
								estaAberto
									? 'bg-[var(--cardapio-success)] bg-opacity-10 text-[var(--cardapio-success)]'
									: 'bg-[var(--cardapio-danger)] bg-opacity-10 text-[var(--cardapio-danger)]'
							"
						>
							<span
								class="size-1.5 rounded-full"
								:class="
									estaAberto
										? 'bg-[var(--cardapio-success)] animate-pulse'
										: 'bg-[var(--cardapio-danger)]'
								"
							/>
							{{ estaAberto ? "Aberto agora" : "Fechado no momento" }}
						</div>
					</div>
				</div>
			</div>
		</template>

		<!-- Conteúdo -->
		<div class="px-4 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
			<!-- Descrição -->
			<div v-if="estabelecimento.descricao" class="space-y-2.5">
				<div class="flex items-center gap-2.5">
					<div
						class="size-9 rounded-xl bg-[var(--cardapio-primary)] bg-opacity-10 flex items-center justify-center shrink-0"
					>
						<Icon name="lucide:file-text" class="w-4 h-4 text-[var(--cardapio-primary)]" />
					</div>
					<h3 class="text-base font-bold text-[var(--cardapio-text)]">Sobre</h3>
				</div>
				<p class="text-sm text-[var(--cardapio-text-muted)] leading-relaxed">
					{{ estabelecimento.descricao }}
				</p>
			</div>

			<!-- Informações em Cards -->
			<div class="space-y-3">
				<!-- Tempo de Entrega -->
				<div
					class="flex items-center gap-3 p-4 rounded-2xl bg-[var(--cardapio-secondary)] border-2 border-[var(--cardapio-border)]"
				>
					<div
						class="size-12 rounded-xl bg-[var(--cardapio-primary)] bg-opacity-10 flex items-center justify-center shrink-0"
					>
						<Icon name="lucide:clock" class="w-6 h-6 text-[var(--cardapio-primary)]" />
					</div>
					<div class="flex-1">
						<p class="text-xs text-[var(--cardapio-text-muted)] font-medium mb-0.5">
							Tempo de Entrega
						</p>
						<p class="text-lg font-bold text-[var(--cardapio-text)]">{{ tempoEntrega }}</p>
					</div>
				</div>

				<!-- Frete Grátis -->
				<div
					v-if="valorEntregaGratis"
					class="flex items-center gap-3 p-4 rounded-2xl bg-[var(--cardapio-success)] bg-opacity-10 border-2 border-[var(--cardapio-success)] border-opacity-30"
				>
					<div
						class="size-12 rounded-xl bg-[var(--cardapio-success)] bg-opacity-20 flex items-center justify-center shrink-0"
					>
						<Icon name="lucide:truck" class="w-6 h-6 text-[var(--cardapio-success)]" />
					</div>
					<div class="flex-1">
						<p class="text-xs text-[var(--cardapio-success)] font-medium mb-0.5">Frete Grátis</p>
						<p class="text-lg font-bold text-[var(--cardapio-success)]">
							Acima de {{ valorEntregaGratis }}
						</p>
					</div>
				</div>
			</div>

			<!-- Ações -->
			<div class="space-y-3">
				<div class="flex items-center gap-2.5">
					<div
						class="size-9 rounded-xl bg-[var(--cardapio-primary)] bg-opacity-10 flex items-center justify-center shrink-0"
					>
						<Icon name="lucide:zap" class="w-4 h-4 text-[var(--cardapio-primary)]" />
					</div>
					<h3 class="text-base font-bold text-[var(--cardapio-text)]">Ações Rápidas</h3>
				</div>

				<div class="space-y-2.5">
					<!-- WhatsApp -->
					<button
						v-if="estabelecimento.whatsapp"
						type="button"
						class="w-full flex items-center gap-3 px-4 py-4 rounded-2xl font-semibold text-sm bg-[var(--cardapio-success)] text-white shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
						@click="abrirWhatsApp"
					>
						<Icon name="lucide:message-circle" class="w-5 h-5 shrink-0" />
						<span class="flex-1 text-left">Falar no WhatsApp</span>
						<Icon name="lucide:arrow-right" class="w-5 h-5 shrink-0" />
					</button>

					<!-- Compartilhar -->
					<button
						type="button"
						class="w-full flex items-center gap-3 px-4 py-4 rounded-2xl font-semibold text-sm bg-[var(--cardapio-primary)] text-white shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
						@click="compartilhar"
					>
						<Icon name="lucide:share-2" class="w-5 h-5 shrink-0" />
						<span class="flex-1 text-left">Compartilhar Cardápio</span>
						<Icon name="lucide:arrow-right" class="w-5 h-5 shrink-0" />
					</button>
				</div>
			</div>
		</div>
	</UiBottomSheet>
</template>
