<script setup lang="ts">
/**
 * 📌 BannerCard
 *
 * Card compacto de banner com preview em destaque e ações rápidas.
 * Segue o mesmo padrão visual do CupomCard.
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
 * Retorna o ícone baseado no tipo de conteúdo
 */
const bannerIcon = computed(() => {
	const icons = {
		imagem: "lucide:image",
		texto: "lucide:type",
	};
	return icons[props.banner.tipo_conteudo] || "lucide:image";
});

/**
 * Retorna o texto do tipo de conteúdo
 */
const tipoConteudoText = computed(() => {
	const texts = {
		imagem: "Imagem",
		texto: "Texto",
	};
	return texts[props.banner.tipo_conteudo] || "Desconhecido";
});

/**
 * Status do banner para badge
 */
const bannerStatus = computed(() => {
	if (!props.banner.ativo) {
		return { text: "Inativo", variant: "default" as const };
	}

	return { text: "Ativo", variant: "success" as const };
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

/**
 * Classes do wrapper
 */
const wrapperClasses = computed(() => {
	return [
		"banner-card-wrapper",
		"relative",
		"transition-all duration-200",
		{
			"opacity-60": !props.banner.ativo,
		},
	];
});

// ========================================
// HANDLERS
// ========================================

const handleEdit = (): void => {
	emit("edit", props.banner.id);
};

const handleDelete = (event: Event): void => {
	event.stopPropagation();
	emit("delete", props.banner.id);
};

const handleDuplicate = (event: Event): void => {
	event.stopPropagation();
	emit("duplicate", props.banner.id);
};

const _handleToggleStatus = (event: Event): void => {
	event.stopPropagation();
	emit("toggle-status", props.banner.id);
};

const handleReorder = (event: Event, direction: "up" | "down"): void => {
	event.stopPropagation();
	const currentOrder = props.banner.ordem;
	const newOrder = direction === "up" ? currentOrder - 1 : currentOrder + 1;

	// Validar se a nova ordem é válida (será validada também no backend)
	if (newOrder < 1) return;

	emit("reorder", props.banner.id, newOrder);
};
</script>

<template>
	<div :class="wrapperClasses">
		<UiCard clickable fill-height size="md" class="banner-card group" @click="handleEdit">
			<template #content>
				<div class="h-full flex flex-col">
					<!-- Área de Preview em Destaque (substitui a imagem) -->
					<div
						class="aspect-[4/3] w-full overflow-hidden rounded-md mb-3 relative flex flex-col items-center justify-center p-4"
						:style="previewStyle"
					>
						<!-- Preview com imagem -->
						<div
							v-if="banner.imagem_url && banner.tipo_conteudo === 'imagem'"
							class="absolute inset-0"
						>
							<img
								:src="banner.imagem_url"
								:alt="banner.titulo || 'Banner'"
								class="w-full h-full object-cover"
							/>
						</div>

						<!-- Preview apenas texto -->
						<div v-else class="relative z-10 text-center">
							<!-- Ícone pequeno no topo -->
							<Icon :name="bannerIcon" class="h-8 w-8 mb-2 mx-auto opacity-90" />

							<!-- Título em destaque -->
							<div class="text-2xl font-black leading-tight mb-1 px-2">
								{{ banner.titulo || "Banner" }}
							</div>

							<!-- Descrição ou CTA -->
							<div
								v-if="banner.descricao || banner.texto_cta"
								class="text-sm font-medium opacity-90"
							>
								{{ banner.descricao || banner.texto_cta }}
							</div>
						</div>

						<!-- Badge do Tipo (Overlay) -->
						<div
							class="absolute bottom-1.5 left-1.5 px-3 py-2 rounded-md bg-black/60 backdrop-blur-[2px] border border-white/10 shadow-sm flex items-center justify-center"
						>
							<span class="text-[10px] font-bold text-white uppercase tracking-wider leading-none">
								{{ tipoConteudoText }}
							</span>
						</div>

						<!-- Ícones de ação (Overlay no canto superior direito) -->
						<div
							class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
						>
							<!-- Reordenar para cima -->
							<button
								type="button"
								class="p-1.5 rounded-md bg-black/60 backdrop-blur-[2px] border border-white/10 hover:bg-black/80 transition-colors flex items-center justify-center"
								title="Mover para cima"
								@click="(e) => handleReorder(e, 'up')"
							>
								<Icon name="lucide:arrow-up" class="h-3.5 w-3.5 text-white" />
							</button>

							<!-- Reordenar para baixo -->
							<button
								type="button"
								class="p-1.5 rounded-md bg-black/60 backdrop-blur-[2px] border border-white/10 hover:bg-black/80 transition-colors flex items-center justify-center"
								title="Mover para baixo"
								@click="(e) => handleReorder(e, 'down')"
							>
								<Icon name="lucide:arrow-down" class="h-3.5 w-3.5 text-white" />
							</button>

							<!-- Duplicar -->
							<button
								type="button"
								class="p-1.5 rounded-md bg-black/60 backdrop-blur-[2px] border border-white/10 hover:bg-black/80 transition-colors flex items-center justify-center"
								title="Duplicar"
								@click="handleDuplicate"
							>
								<Icon name="lucide:copy" class="h-3.5 w-3.5 text-white" />
							</button>

							<!-- Excluir -->
							<button
								type="button"
								class="p-1.5 rounded-md bg-red-600/80 backdrop-blur-[2px] border border-white/10 hover:bg-red-700 transition-colors flex items-center justify-center"
								title="Excluir"
								@click="handleDelete"
							>
								<Icon name="lucide:trash-2" class="h-3.5 w-3.5 text-white" />
							</button>
						</div>
					</div>

					<!-- Conteúdo que cresce -->
					<div class="flex-1 flex flex-col justify-between">
						<!-- Informações do banner -->
						<div class="space-y-2">
							<!-- Cabeçalho com título e status -->
							<div class="flex items-start justify-between gap-2">
								<h3
									class="truncate font-medium text-[var(--text-primary)] text-base flex-1 leading-tight"
								>
									{{ banner.titulo || "Banner sem título" }}
								</h3>
								<UiBadge
									:variant="bannerStatus.variant"
									class="text-xs px-2 py-1 scale-90 shrink-0"
								>
									{{ bannerStatus.text }}
								</UiBadge>
							</div>

							<!-- Layout Flexível de Rodapé -->
							<div class="flex items-end justify-between gap-2 mt-1">
								<!-- Lado Esquerdo: Ordem -->
								<div
									class="flex items-center gap-2 text-sm text-[var(--text-muted)] truncate min-w-0"
								>
									<span class="flex items-center gap-1 truncate">
										<Icon name="lucide:layers" class="h-3.5 w-3.5 shrink-0" />
										<span class="truncate">Ordem: {{ banner.ordem }}</span>
									</span>
								</div>

								<!-- Lado Direito: Ícone de edição -->
								<div class="shrink-0 flex items-center justify-end leading-none">
									<Icon name="lucide:pencil" class="h-3.5 w-3.5 text-[var(--text-muted)]" />
								</div>
							</div>
						</div>
					</div>
				</div>
			</template>
		</UiCard>
	</div>
</template>

<style scoped>
.banner-card-wrapper:hover .banner-card {
	transform: translateY(-1px);
}
</style>
