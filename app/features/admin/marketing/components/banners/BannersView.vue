<script setup lang="ts">
/**
 * 📌 BannersView
 *
 * Componente de visualização da aba de banners.
 * Exibe lista de banners com opções de CRUD e ordenação.
 */

// Importações dos componentes específicos de banners
import BannerCard from "./BannerCard.vue";
import BannersList from "./BannersList.vue";
import BannerDrawer from "./BannerDrawer.vue";

// Imports dos composables
import { useBanners } from "../../composables/useBanners";
// useMarketing removido pois o filtro é interno no useBanners
import type { MarketingViewMode } from "../../types/marketing";

interface Props {
	showCreateDrawer?: boolean;
	viewMode?: MarketingViewMode;
}

interface Emits {
	"update:showCreateDrawer": [value: boolean];
}

const props = withDefaults(defineProps<Props>(), {
	showCreateDrawer: false,
	viewMode: "card",
});

const emit = defineEmits<Emits>();

// Composables
const {
	banners,
	filteredBanners,
	loading,
	error,
	createBanner,
	updateBanner,
	deleteBanner,
	toggleBannerStatus,
	duplicateBanner,
	reorderBanner,
	refreshBanners,
} = useBanners();

// Filtros sincronizados internamente no useBanners
// watch removido

// Usar viewMode da prop em vez do composable
const currentViewMode = computed(() => props.viewMode);

// ========================================
// ESTADO LOCAL
// ========================================

const showCreateDrawerLocal = ref(false);
const showEditDrawer = ref(false);
const showDeleteModal = ref(false);
const selectedBanner = ref<string | null>(null);

// ========================================
// COMPUTADAS
// ========================================

/**
 * Controla o drawer de criação via prop ou estado local
 */
const showCreateDrawerComputed = computed({
	get: () => props.showCreateDrawer || showCreateDrawerLocal.value,
	set: (value: boolean) => {
		showCreateDrawerLocal.value = value;
		emit("update:showCreateDrawer", value);
	},
});

/**
 * Obtém o banner selecionado completo
 */
const selectedBannerData = computed(() => {
	if (!selectedBanner.value) return null;
	return banners.value.find((b) => b.id === selectedBanner.value);
});

// ========================================
// HANDLERS
// ========================================

/**
 * Handler para editar banner
 */
const handleEdit = (bannerId: string): void => {
	selectedBanner.value = bannerId;
	showEditDrawer.value = true;
};

/**
 * Handler para excluir banner
 */
const handleDelete = (bannerId: string): void => {
	selectedBanner.value = bannerId;
	showDeleteModal.value = true;
};

/**
 * Handler para confirmar exclusão
 */
const handleConfirmDelete = async (): Promise<void> => {
	if (!selectedBanner.value) return;

	try {
		await deleteBanner(selectedBanner.value);
		showDeleteModal.value = false;
		selectedBanner.value = null;
	} catch (error) {
		console.error("Erro ao excluir banner:", error);
	}
};

/**
 * Handler para duplicar banner
 */
const handleDuplicate = async (bannerId: string): Promise<void> => {
	try {
		await duplicateBanner(bannerId);
	} catch (error) {
		console.error("Erro ao duplicar banner:", error);
	}
};

/**
 * Handler para alternar status
 */
const handleToggleStatus = async (bannerId: string): Promise<void> => {
	try {
		await toggleBannerStatus(bannerId);
	} catch (error) {
		console.error("Erro ao alterar status:", error);
	}
};

/**
 * Handler para reordenar banner
 */
const handleReorder = async (bannerId: string, newOrder: number): Promise<void> => {
	try {
		await reorderBanner(bannerId, newOrder);
	} catch (error) {
		console.error("Erro ao reordenar banner:", error);
	}
};
</script>

<template>
	<div class="w-full space-y-6">
		<!-- Estado de loading -->
		<div v-if="loading" class="space-y-4">
			<UiSkeleton class="h-20 w-full" />
			<UiSkeleton class="h-20 w-full" />
			<UiSkeleton class="h-20 w-full" />
		</div>

		<!-- Estado de erro -->
		<UiCard v-else-if="error" class="p-6">
			<div class="text-center">
				<Icon name="lucide:alert-circle" class="w-12 h-12 mx-auto mb-4 text-red-500" />
				<h3 class="text-lg font-medium text-[var(--text-primary)] mb-2">
					Erro ao carregar banners
				</h3>
				<p class="text-[var(--text-muted)] mb-4">{{ error }}</p>
				<UiButton @click="refreshBanners">
					<Icon name="lucide:refresh-cw" class="w-4 h-4 mr-2" />
					Tentar novamente
				</UiButton>
			</div>
		</UiCard>

		<!-- Estado vazio (sem nenhum banner criado) -->
		<UiCard v-else-if="banners.length === 0 && !loading" class="p-12">
			<div class="text-center">
				<Icon name="lucide:image" class="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)]" />
				<h3 class="text-lg font-medium text-[var(--text-primary)] mb-2">Nenhum banner criado</h3>
				<p class="text-[var(--text-muted)] mb-6">
					Crie seu primeiro banner promocional para atrair mais clientes
				</p>
				<UiButton @click="showCreateDrawerComputed = true">
					<Icon name="lucide:plus" class="w-4 h-4 mr-2" />
					Criar primeiro banner
				</UiButton>
			</div>
		</UiCard>

		<!-- Estado sem resultados (filtro retornou vazio) -->
		<UiCard v-else-if="filteredBanners.length === 0" class="p-12">
			<div class="text-center">
				<Icon name="lucide:search-x" class="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)]" />
				<h3 class="text-lg font-medium text-[var(--text-primary)] mb-2">
					Nenhum banner encontrado
				</h3>
				<p class="text-[var(--text-muted)] mb-6">
					Tente ajustar seus filtros ou busca para encontrar o que procura
				</p>
			</div>
		</UiCard>

		<!-- Lista de banners -->
		<div v-else>
			<!-- Visualização em cards -->
			<div
				v-if="currentViewMode === 'card'"
				class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
			>
				<BannerCard
					v-for="banner in filteredBanners"
					:key="banner.id"
					:banner="banner"
					@edit="handleEdit"
					@delete="handleDelete"
					@duplicate="handleDuplicate"
					@toggle-status="handleToggleStatus"
					@reorder="handleReorder"
				/>
			</div>

			<!-- Visualização em lista -->
			<div v-else>
				<BannersList
					:banners="filteredBanners"
					@edit="handleEdit"
					@delete="handleDelete"
					@duplicate="handleDuplicate"
					@toggle-status="handleToggleStatus"
					@reorder="handleReorder"
				/>
			</div>
		</div>

		<!-- Drawer de criação -->
		<BannerDrawer v-model="showCreateDrawerComputed" mode="create" @save-create="createBanner" />

		<!-- Drawer de edição -->
		<BannerDrawer
			v-model="showEditDrawer"
			mode="edit"
			:banner-id="selectedBanner"
			@save-edit="updateBanner"
		/>

		<!-- Modal de confirmação de exclusão -->
		<!-- Modal de Exclusão -->
		<UiModal v-model="showDeleteModal">
			<template #header>
				<h3 class="text-lg font-semibold">Excluir Banner</h3>
			</template>

			<div class="space-y-4">
				<p class="text-[var(--text-secondary)]">
					Tem certeza que deseja excluir este banner? Esta ação não pode ser desfeita.
				</p>

				<!-- Informações do banner a ser excluído -->
				<div
					v-if="selectedBannerData"
					class="p-4 rounded-lg bg-[var(--bg-muted)] border border-[var(--border-default)]"
				>
					<div class="flex items-center gap-3">
						<!-- Preview do banner -->
						<div
							class="w-16 h-12 shrink-0 rounded-lg overflow-hidden border border-[var(--border-default)]"
						>
							<div
								v-if="
									selectedBannerData.imagem_url && selectedBannerData.tipo_conteudo === 'imagem'
								"
								class="relative h-full"
							>
								<img
									:src="selectedBannerData.imagem_url"
									:alt="selectedBannerData.titulo || 'Banner'"
									class="w-full h-full object-cover"
								/>
							</div>
							<div
								v-else
								class="h-full flex items-center justify-center text-center p-1"
								:style="{
									backgroundColor: selectedBannerData.cor_fundo || '#3b82f6',
									color: selectedBannerData.cor_texto || '#ffffff',
								}"
							>
								<div class="text-xs font-medium truncate">
									{{ selectedBannerData.titulo || "Banner" }}
								</div>
							</div>
						</div>

						<!-- Informações -->
						<div class="flex-1 min-w-0">
							<p class="font-semibold text-[var(--text-primary)] truncate">
								{{ selectedBannerData.titulo || "Banner sem título" }}
							</p>
							<p
								v-if="selectedBannerData.descricao"
								class="text-sm text-[var(--text-muted)] truncate"
							>
								{{ selectedBannerData.descricao }}
							</p>
							<div class="flex items-center gap-2 mt-1">
								<UiBadge size="sm" variant="outline">
									Ordem: {{ selectedBannerData.ordem }}
								</UiBadge>
								<UiBadge size="sm" :variant="selectedBannerData.ativo ? 'success' : 'error'">
									{{ selectedBannerData.ativo ? "Ativo" : "Inativo" }}
								</UiBadge>
							</div>
						</div>
					</div>
				</div>
			</div>

			<template #footer>
				<div class="flex gap-3 justify-end">
					<UiButton variant="outline" @click="showDeleteModal = false"> Cancelar </UiButton>
					<UiButton variant="solid" color="error" @click="handleConfirmDelete"> Excluir </UiButton>
				</div>
			</template>
		</UiModal>
	</div>
</template>
