<script setup lang="ts">
/**
 * 📌 BannersList
 *
 * Lista de banners em formato tabela.
 * Suporte a ações individuais e ordenação por botões.
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

const _props = defineProps<Props>();
const emit = defineEmits<Emits>();

// ========================================
// COMPUTADAS
// ========================================

/**
 * Retorna o texto do tipo do banner
 */
const getTipoText = (tipo: string): string => {
	const texts = {
		carrossel: "Carrossel",
		destaque: "Destaque",
		popup: "Popup",
	};
	return texts[tipo as keyof typeof texts] || "Desconhecido";
};

/**
 * Retorna o texto do tipo de conteúdo
 */
const getTipoConteudoText = (tipo: string): string => {
	const texts = {
		imagem: "Imagem",
		texto: "Texto",
		misto: "Misto",
	};
	return texts[tipo as keyof typeof texts] || "Desconhecido";
};

// ========================================
// HANDLERS
// ========================================

/**
 * Handler para editar banner
 */
const handleEdit = (bannerId: string): void => {
	emit("edit", bannerId);
};

/**
 * Handler para excluir banner
 */
const handleDelete = (bannerId: string): void => {
	emit("delete", bannerId);
};

/**
 * Handler para duplicar banner
 */
const handleDuplicate = (bannerId: string): void => {
	emit("duplicate", bannerId);
};

/**
 * Handler para alternar status
 */
const handleToggleStatus = (bannerId: string): void => {
	emit("toggle-status", bannerId);
};

/**
 * Handler para reordenar banner
 */
const handleReorder = (bannerId: string, direction: "up" | "down"): void => {
	const currentBanner = _props.banners.find((b) => b.id === bannerId);
	if (!currentBanner) return;

	const currentOrder = currentBanner.ordem;
	const newOrder = direction === "up" ? currentOrder - 1 : currentOrder + 1;

	// Validar se a nova ordem é válida
	if (newOrder < 1 || newOrder > _props.banners.length) return;

	emit("reorder", bannerId, newOrder);
};
</script>

<template>
	<div class="space-y-4">
		<!-- Tabela -->
		<div class="overflow-hidden border border-[var(--border-default)] rounded-lg">
			<table class="w-full">
				<thead class="bg-[var(--bg-muted)]">
					<tr>
						<th class="px-4 py-3 text-left text-sm font-medium text-[var(--text-secondary)]">
							Banner
						</th>
						<th class="px-4 py-3 text-left text-sm font-medium text-[var(--text-secondary)]">
							Tipo
						</th>
						<th class="px-4 py-3 text-left text-sm font-medium text-[var(--text-secondary)]">
							Conteúdo
						</th>
						<th class="px-4 py-3 text-left text-sm font-medium text-[var(--text-secondary)]">
							Ordem
						</th>
						<th class="px-4 py-3 text-left text-sm font-medium text-[var(--text-secondary)]">
							Status
						</th>
						<th class="px-4 py-3 text-left text-sm font-medium text-[var(--text-secondary)] w-32">
							Ações
						</th>
					</tr>
				</thead>

				<tbody class="divide-y divide-[var(--border-muted)]">
					<tr
						v-for="banner in banners"
						:key="banner.id"
						class="group hover:bg-[var(--bg-hover)] transition-colors"
						:class="{ 'opacity-50': !banner.ativo }"
					>
						<!-- Banner Info -->
						<td class="px-4 py-3">
							<div class="flex items-center gap-3">
								<!-- Preview -->
								<div
									class="w-12 h-8 rounded border border-[var(--border-default)] overflow-hidden flex-shrink-0"
								>
									<img
										v-if="banner.imagem_url"
										:src="banner.imagem_url"
										:alt="banner.titulo"
										class="w-full h-full object-cover"
									/>
									<div
										v-else
										class="w-full h-full flex items-center justify-center text-xs"
										:style="{
											backgroundColor: banner.cor_fundo || '#3b82f6',
											color: banner.cor_texto || '#ffffff',
										}"
									>
										T
									</div>
								</div>

								<!-- Título e descrição -->
								<div class="min-w-0 flex-1">
									<div class="font-medium text-[var(--text-primary)] truncate">
										{{ banner.titulo }}
									</div>
									<div v-if="banner.descricao" class="text-sm text-[var(--text-muted)] truncate">
										{{ banner.descricao }}
									</div>
								</div>
							</div>
						</td>

						<!-- Tipo -->
						<td class="px-4 py-3">
							<UiBadge size="sm">
								{{ getTipoText(banner.tipo) }}
							</UiBadge>
						</td>

						<!-- Tipo de Conteúdo -->
						<td class="px-4 py-3">
							<span class="text-sm text-[var(--text-muted)]">
								{{ getTipoConteudoText(banner.tipo_conteudo) }}
							</span>
						</td>

						<!-- Ordem -->
						<td class="px-4 py-3">
							<div class="flex items-center gap-1">
								<span class="text-sm text-[var(--text-muted)]">{{ banner.ordem }}</span>
								<div class="flex flex-col gap-0.5 ml-2">
									<UiButton
										variant="ghost"
										size="sm"
										class="!w-5 !h-5 !p-0"
										@click="handleReorder(banner.id, 'up')"
									>
										<Icon name="lucide:chevron-up" class="w-3 h-3" />
									</UiButton>
									<UiButton
										variant="ghost"
										size="sm"
										class="!w-5 !h-5 !p-0"
										@click="handleReorder(banner.id, 'down')"
									>
										<Icon name="lucide:chevron-down" class="w-3 h-3" />
									</UiButton>
								</div>
							</div>
						</td>

						<!-- Status -->
						<td class="px-4 py-3">
							<UiSwitch
								:model-value="banner.ativo"
								size="sm"
								@update:model-value="handleToggleStatus(banner.id)"
							/>
						</td>

						<!-- Ações -->
						<td class="px-4 py-3">
							<div class="flex items-center gap-1">
								<UiButton
									variant="ghost"
									size="sm"
									class="!w-8 !h-8 !p-0"
									@click="handleDuplicate(banner.id)"
								>
									<Icon name="lucide:copy" class="w-4 h-4" />
								</UiButton>
								<UiButton
									variant="ghost"
									size="sm"
									class="!w-8 !h-8 !p-0"
									@click="handleEdit(banner.id)"
								>
									<Icon name="lucide:edit" class="w-4 h-4" />
								</UiButton>
								<UiButton
									variant="ghost"
									size="sm"
									class="!w-8 !h-8 !p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
									@click="handleDelete(banner.id)"
								>
									<Icon name="lucide:trash" class="w-4 h-4" />
								</UiButton>
							</div>
						</td>
					</tr>
				</tbody>
			</table>
		</div>

		<!-- Estado vazio -->
		<div v-if="banners.length === 0" class="text-center py-12">
			<Icon name="lucide:image" class="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)]" />
			<p class="text-[var(--text-muted)]">Nenhum banner encontrado</p>
		</div>
	</div>
</template>
