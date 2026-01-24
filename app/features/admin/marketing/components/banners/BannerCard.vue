<script setup lang="ts">
/**
 * 📌 BannerCard
 *
 * Card de exibição de banner com preview e ações.
 * Suporta diferentes tipos de banner e conteúdo.
 */

import type { BannerCompleto } from "#shared/types/marketing";

interface Props {
	banner: BannerCompleto;
}

interface Emits {
	edit: [id: string];
	delete: [id: string];
	duplicate: [id: string];
	"toggle-status": [id: string];
	reorder: [id: string, newOrder: number];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// ========================================
// COMPUTADAS
// ========================================

/**
 * Retorna o ícone baseado no tipo do banner
 */
const bannerIcon = computed(() => {
	const icons = {
		carrossel: "lucide:image",
		destaque: "lucide:star",
		popup: "lucide:popup",
	};
	return icons[props.banner.tipo] || "lucide:image";
});

/**
 * Retorna a cor do badge baseado no tipo
 */
const tipoBadgeColor = computed(() => {
	const colors = {
		carrossel: "blue",
		destaque: "yellow",
		popup: "purple",
	};
	return colors[props.banner.tipo] || "gray";
});

/**
 * Retorna o texto do tipo de conteúdo
 */
const tipoConteudoText = computed(() => {
	const texts = {
		imagem: "Imagem",
		texto: "Texto",
		misto: "Misto",
	};
	return texts[props.banner.tipo_conteudo] || "Desconhecido";
});

/**
 * Retorna o texto do tipo do banner
 */
const tipoText = computed(() => {
	const texts = {
		carrossel: "Carrossel",
		destaque: "Destaque",
		popup: "Popup",
	};
	return texts[props.banner.tipo] || "Desconhecido";
});

/**
 * Estilo do preview baseado nas cores do banner
 */
const previewStyle = computed(() => {
	const style: Record<string, string> = {};

	if (props.banner.cor_fundo) {
		style.backgroundColor = props.banner.cor_fundo;
	}

	if (props.banner.cor_texto) {
		style.color = props.banner.cor_texto;
	}

	return style;
});

// ========================================
// HANDLERS
// ========================================

const handleEdit = (): void => {
	emit("edit", props.banner.id);
};

const handleDelete = (): void => {
	emit("delete", props.banner.id);
};

const handleDuplicate = (): void => {
	emit("duplicate", props.banner.id);
};

const handleToggleStatus = (): void => {
	emit("toggle-status", props.banner.id);
};

const handleReorder = (direction: "up" | "down"): void => {
	const currentOrder = props.banner.ordem;
	const newOrder = direction === "up" ? currentOrder - 1 : currentOrder + 1;

	// Validar se a nova ordem é válida (será validada também no backend)
	if (newOrder < 1) return;

	emit("reorder", props.banner.id, newOrder);
};
</script>

<template>
	<UiCard class="group hover:shadow-md transition-shadow duration-200">
		<!-- Header do Card -->
		<div class="p-4 border-b border-[var(--border-default)]">
			<div class="flex items-start justify-between">
				<div class="flex items-start gap-3 flex-1 min-w-0">
					<!-- Ícone do tipo -->
					<div
						class="flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--primary-light)] flex items-center justify-center"
					>
						<Icon :name="bannerIcon" class="w-5 h-5 text-[var(--primary)]" />
					</div>

					<!-- Informações principais -->
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2 mb-1">
							<h3 class="font-medium text-[var(--text-primary)] truncate">
								{{ banner.titulo }}
							</h3>
							<UiBadge :color="tipoBadgeColor" size="sm">
								{{ tipoText }}
							</UiBadge>
						</div>

						<p v-if="banner.descricao" class="text-sm text-[var(--text-muted)] line-clamp-2 mb-2">
							{{ banner.descricao }}
						</p>

						<div class="flex items-center gap-4 text-xs text-[var(--text-muted)]">
							<span>{{ tipoConteudoText }}</span>
							<span>Ordem: {{ banner.ordem }}</span>
						</div>
					</div>
				</div>

				<!-- Status Toggle -->
				<UiSwitch :model-value="banner.ativo" size="sm" @update:model-value="handleToggleStatus" />
			</div>
		</div>

		<!-- Preview do Banner -->
		<div class="p-4">
			<div
				class="relative h-24 rounded-lg border-2 border-dashed border-[var(--border-default)] overflow-hidden"
				:style="previewStyle"
			>
				<!-- Preview com imagem -->
				<div v-if="banner.imagem_url && banner.tipo_conteudo !== 'texto'" class="relative h-full">
					<img :src="banner.imagem_url" :alt="banner.titulo" class="w-full h-full object-cover" />

					<!-- Overlay de texto se for misto -->
					<div
						v-if="banner.tipo_conteudo === 'misto' && (banner.titulo || banner.texto_cta)"
						class="absolute inset-0 flex items-center justify-center bg-black/20"
					>
						<div class="text-center text-white">
							<div v-if="banner.titulo" class="font-medium text-sm mb-1">
								{{ banner.titulo }}
							</div>
							<div v-if="banner.texto_cta" class="text-xs px-2 py-1 bg-white/20 rounded">
								{{ banner.texto_cta }}
							</div>
						</div>
					</div>
				</div>

				<!-- Preview apenas texto -->
				<div v-else class="h-full flex items-center justify-center text-center p-2">
					<div>
						<div class="font-medium text-sm mb-1">{{ banner.titulo }}</div>
						<div v-if="banner.texto_cta" class="text-xs opacity-75">
							{{ banner.texto_cta }}
						</div>
					</div>
				</div>

				<!-- Indicador de tipo no canto -->
				<div class="absolute top-2 right-2">
					<UiBadge size="sm" color="white">
						{{ tipoConteudoText }}
					</UiBadge>
				</div>
			</div>
		</div>

		<!-- Footer com ações -->
		<div class="px-4 pb-4">
			<div class="flex items-center justify-between">
				<!-- Controles de ordem -->
				<div class="flex items-center gap-1">
					<UiButton variant="ghost" size="sm" class="!w-8 !h-8 !p-0" @click="handleReorder('up')">
						<Icon name="lucide:chevron-up" class="w-4 h-4" />
					</UiButton>
					<UiButton variant="ghost" size="sm" class="!w-8 !h-8 !p-0" @click="handleReorder('down')">
						<Icon name="lucide:chevron-down" class="w-4 h-4" />
					</UiButton>
				</div>

				<!-- Ações principais -->
				<div class="flex items-center gap-1">
					<UiButton variant="ghost" size="sm" class="!w-8 !h-8 !p-0" @click="handleDuplicate">
						<Icon name="lucide:copy" class="w-4 h-4" />
					</UiButton>
					<UiButton variant="ghost" size="sm" class="!w-8 !h-8 !p-0" @click="handleEdit">
						<Icon name="lucide:edit" class="w-4 h-4" />
					</UiButton>
					<UiButton
						variant="ghost"
						size="sm"
						class="!w-8 !h-8 !p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
						@click="handleDelete"
					>
						<Icon name="lucide:trash" class="w-4 h-4" />
					</UiButton>
				</div>
			</div>
		</div>

		<!-- Indicador de status inativo -->
		<div
			v-if="!banner.ativo"
			class="absolute inset-0 bg-black/10 flex items-center justify-center rounded-lg"
		>
			<UiBadge color="gray">Inativo</UiBadge>
		</div>
	</UiCard>
</template>
