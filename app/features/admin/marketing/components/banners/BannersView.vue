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
import { useMarketing } from "../../composables/useMarketing";

interface Props {
	showCreateDrawer?: boolean;
}

interface Emits {
	"update:showCreateDrawer": [value: boolean];
}

const props = withDefaults(defineProps<Props>(), {
	showCreateDrawer: false,
});

const emit = defineEmits<Emits>();

// Composables
const {
	banners,
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

const { viewMode } = useMarketing();

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

		<!-- Estado vazio -->
		<UiCard v-else-if="banners.length === 0" class="p-12">
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

		<!-- Lista de banners -->
		<div v-else>
			<!-- Visualização em cards -->
			<div v-if="viewMode === 'card'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				<BannerCard
					v-for="banner in banners"
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
					:banners="banners"
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
		<UiModal v-model="showDeleteModal">
			<template #header>
				<h3 class="text-lg font-semibold">Excluir Banner</h3>
			</template>

			<template #content>
				<p class="text-[var(--text-muted)]">
					Tem certeza que deseja excluir este banner? Esta ação não pode ser desfeita.
				</p>
			</template>

			<template #footer>
				<div class="flex gap-3 justify-end">
					<UiButton variant="outline" @click="showDeleteModal = false"> Cancelar </UiButton>
					<UiButton variant="solid" color="error" @click="handleConfirmDelete"> Excluir </UiButton>
				</div>
			</template>
		</UiModal>
	</div>
</template>
