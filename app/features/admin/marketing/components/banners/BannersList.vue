<script setup lang="ts">
/**
 * 📌 BannersList
 *
 * Lista de banners em formato HORIZONTAL (cards em linha).
 * Mesmo padrão usado em CupomsList - layout horizontal com ações.
 */

import type { BannerCompleto } from "#shared/types/marketing";

interface Props {
	banners: BannerCompleto[];
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
 * Retorna o texto do tipo do banner
 */
const getTipoText = (tipo: string): string => {
	const tipos = {
		carrossel: "Carrossel",
	};
	return tipos[tipo as keyof typeof tipos] || tipo;
};

/**
 * Retorna o texto do tipo de conteúdo
 */
const getTipoConteudoText = (tipo: string): string => {
	const tipos = {
		imagem: "Imagem",
		texto: "Texto",
	};
	return tipos[tipo as keyof typeof tipos] || tipo;
};

/**
 * Retorna configuração do status
 */
const getStatusConfig = (banner: BannerCompleto) => {
	if (!banner.ativo) {
		return { variant: "error" as const, text: "Inativo", icon: "lucide:x-circle" };
	}

	return { variant: "success" as const, text: "Ativo", icon: "lucide:check-circle" };
};

/**
 * Retorna informações sobre o banner
 */
const getBannerInfo = (banner: BannerCompleto): string => {
	const info = [];

	if (banner.link_url) {
		info.push("Com link");
	}

	return info.length > 0 ? info.join(" • ") : "Básico";
};

// ========================================
// HANDLERS
// ========================================

const handleEdit = (bannerId: string): void => {
	emit("edit", bannerId);
};

const handleDelete = (bannerId: string): void => {
	emit("delete", bannerId);
};

const handleDuplicate = (bannerId: string): void => {
	emit("duplicate", bannerId);
};

const handleToggleStatus = (bannerId: string): void => {
	emit("toggle-status", bannerId);
};

const handleReorder = (bannerId: string, direction: "up" | "down"): void => {
	const currentBanner = props.banners.find((b) => b.id === bannerId);
	if (!currentBanner) return;

	const currentOrder = currentBanner.ordem;
	const maxOrder = Math.max(...props.banners.map((b) => b.ordem));

	let newOrder: number;

	if (direction === "up") {
		// Mover para cima (diminuir ordem)
		newOrder = Math.max(1, currentOrder - 1);
	} else {
		// Mover para baixo (aumentar ordem)
		newOrder = Math.min(maxOrder, currentOrder + 1);
	}

	// Só emitir se a ordem realmente mudou
	if (newOrder !== currentOrder) {
		emit("reorder", bannerId, newOrder);
	}
};
</script>

<template>
	<div class="space-y-3">
		<!-- Lista de Cards Horizontais -->
		<div
			v-for="banner in props.banners"
			:key="banner.id"
			class="group relative flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-surface)] hover:opacity-95 cursor-pointer transition-all duration-200 border border-[var(--border-muted)]"
			:class="{ 'opacity-60': !banner.ativo }"
			@click="handleEdit(banner.id)"
		>
			<!-- Preview do Banner (Esquerda) -->
			<div
				class="w-16 h-12 shrink-0 rounded-lg overflow-hidden border border-[var(--border-default)]"
			>
				<!-- Preview com imagem -->
				<div v-if="banner.imagem_url && banner.tipo_conteudo === 'imagem'" class="relative h-full">
					<img
						:src="banner.imagem_url"
						:alt="banner.titulo || 'Banner'"
						class="w-full h-full object-cover"
					/>
				</div>

				<!-- Preview apenas texto -->
				<div
					v-else
					class="h-full flex items-center justify-center text-center p-1"
					:style="{
						backgroundColor: banner.cor_fundo || '#3b82f6',
						color: banner.cor_texto || '#ffffff',
					}"
				>
					<div class="text-xs font-medium truncate">
						{{ banner.titulo || "Banner" }}
					</div>
				</div>
			</div>

			<!-- Conteúdo Principal (Centro) -->
			<div class="flex-1 min-w-0 flex flex-col gap-1">
				<!-- Título e Tipo -->
				<div class="flex items-center gap-3">
					<h3 class="font-semibold text-[var(--text-primary)] text-lg truncate">
						{{ banner.titulo || "Banner sem título" }}
					</h3>
					<UiBadge size="sm" variant="outline">
						{{ getTipoText(banner.tipo) }}
					</UiBadge>
				</div>

				<!-- Descrição -->
				<p v-if="banner.descricao" class="text-sm text-[var(--text-secondary)] line-clamp-1">
					{{ banner.descricao }}
				</p>

				<!-- Informações adicionais -->
				<div class="flex items-center gap-4 text-sm text-[var(--text-muted)]">
					<!-- Tipo de Conteúdo -->
					<span class="flex items-center gap-1">
						<Icon
							:name="banner.tipo_conteudo === 'imagem' ? 'lucide:image' : 'lucide:type'"
							class="h-3.5 w-3.5"
						/>
						<span>{{ getTipoConteudoText(banner.tipo_conteudo) }}</span>
					</span>

					<!-- Informações extras -->
					<span class="flex items-center gap-1">
						<Icon name="lucide:info" class="h-3.5 w-3.5" />
						<span>{{ getBannerInfo(banner) }}</span>
					</span>

					<!-- Link externo -->
					<span v-if="banner.link_url" class="flex items-center gap-1">
						<Icon name="lucide:external-link" class="h-3.5 w-3.5" />
						<span>Link externo</span>
					</span>
				</div>
			</div>

			<!-- Ordem (Centro-Direita) -->
			<div class="flex-shrink-0 text-center">
				<div class="text-2xl font-bold text-[var(--primary)]">
					{{ banner.ordem }}
				</div>
				<div class="text-xs text-[var(--text-muted)]">ordem</div>
			</div>

			<!-- Status e Ações (Direita) -->
			<div class="flex items-center gap-4 shrink-0">
				<!-- Toggle Status + Badge -->
				<div class="flex items-center gap-3">
					<button
						type="button"
						:class="[
							'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2',
							banner.ativo ? 'bg-[var(--success)]' : 'bg-[var(--border-strong)]',
						]"
						role="switch"
						:aria-checked="banner.ativo"
						:title="banner.ativo ? 'Desativar' : 'Ativar'"
						@click.stop="handleToggleStatus(banner.id)"
					>
						<span
							:class="[
								'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
								banner.ativo ? 'translate-x-5' : 'translate-x-0',
							]"
						></span>
					</button>

					<!-- Badge de Status -->
					<UiBadge :variant="getStatusConfig(banner).variant" size="sm">
						<template #iconLeft>
							<Icon :name="getStatusConfig(banner).icon" class="w-3 h-3" />
						</template>
						{{ getStatusConfig(banner).text }}
					</UiBadge>
				</div>

				<!-- Separador Vertical -->
				<div class="h-8 w-px bg-[var(--border-default)]"></div>

				<!-- Controles de Ordem -->
				<div class="flex flex-col gap-0.5">
					<button
						type="button"
						class="p-1 rounded text-[var(--text-muted)] hover:bg-[var(--bg-active)] hover:text-[var(--text-primary)] transition-all duration-150 flex items-center justify-center"
						title="Mover para cima"
						@click.stop="handleReorder(banner.id, 'up')"
					>
						<Icon name="lucide:chevron-up" class="h-3 w-3" />
					</button>
					<button
						type="button"
						class="p-1 rounded text-[var(--text-muted)] hover:bg-[var(--bg-active)] hover:text-[var(--text-primary)] transition-all duration-150 flex items-center justify-center"
						title="Mover para baixo"
						@click.stop="handleReorder(banner.id, 'down')"
					>
						<Icon name="lucide:chevron-down" class="h-3 w-3" />
					</button>
				</div>

				<!-- Separador Vertical -->
				<div class="h-8 w-px bg-[var(--border-default)]"></div>

				<!-- Botões de Ação -->
				<div class="flex items-center gap-0.5">
					<!-- Duplicar -->
					<button
						type="button"
						class="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-active)] hover:text-[var(--text-primary)] transition-all duration-150 flex items-center justify-center"
						title="Duplicar"
						@click.stop="handleDuplicate(banner.id)"
					>
						<Icon name="lucide:copy" class="h-4 w-4" />
					</button>

					<!-- Editar -->
					<button
						type="button"
						class="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-active)] hover:text-[var(--text-primary)] transition-all duration-150 flex items-center justify-center"
						title="Editar"
						@click.stop="handleEdit(banner.id)"
					>
						<Icon name="lucide:pencil" class="h-4 w-4" />
					</button>

					<!-- Excluir -->
					<button
						type="button"
						class="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-active)] hover:text-red-600 transition-all duration-150 flex items-center justify-center"
						title="Excluir"
						@click.stop="handleDelete(banner.id)"
					>
						<Icon name="lucide:trash-2" class="h-4 w-4" />
					</button>
				</div>
			</div>
		</div>

		<!-- Estado vazio -->
		<div v-if="props.banners.length === 0" class="text-center py-12">
			<Icon name="lucide:image" class="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)]" />
			<p class="text-[var(--text-muted)]">Nenhum banner encontrado</p>
		</div>
	</div>
</template>
