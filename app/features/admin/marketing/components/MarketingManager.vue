<script setup lang="ts">
/**
 * 📌 MarketingManager
 *
 * Componente orquestrador principal da feature de marketing.
 * Gerencia navegação entre abas (Cupons e Banners).
 */

// Imports dos componentes
import MarketingTabs from "./MarketingTabs.vue";
import MarketingFilters from "./shared/MarketingFilters.vue";
import CuponsView from "./cupons/CuponsView.vue";
import BannersView from "./banners/BannersView.vue";

// Imports dos composables
import { useMarketing } from "../composables/useMarketing";
import { useCupons } from "../composables/useCupons";
import { useBanners } from "../composables/useBanners";

// Composables
const {
	activeTab,
	tabCounts,
	viewMode,
	currentSearchValue,
	currentSortValue,
	currentFilters,
	handleTabChange,
	handleViewModeChange,
	handleSearch,
	handleSort,
	handleFilter,
} = useMarketing();

// Composables específicos para refresh
const { refreshCupons } = useCupons();
const { refreshBanners } = useBanners();

// ========================================
// ESTADO DOS DRAWERS
// ========================================

const showCreateCupomDrawer = ref(false);
const showCreateBannerDrawer = ref(false);

// ========================================
// HANDLERS
// ========================================

/**
 * Handler para refresh baseado na aba ativa
 */
const handleRefresh = async (): Promise<void> => {
	switch (activeTab.value) {
		case "cupons":
			await refreshCupons();
			break;
		case "banners":
			await refreshBanners();
			break;
	}
};

/**
 * Handler para criar baseado na aba ativa
 */
const handleCreate = (): void => {
	switch (activeTab.value) {
		case "cupons":
			showCreateCupomDrawer.value = true;
			break;
		case "banners":
			showCreateBannerDrawer.value = true;
			break;
	}
};
</script>

<template>
	<div class="w-full min-h-screen space-y-6">
		<!-- Navegação por abas -->
		<MarketingTabs :active-tab="activeTab" :tab-counts="tabCounts" @tab-change="handleTabChange" />

		<!-- Filtros e busca -->
		<MarketingFilters
			:active-tab="activeTab"
			:search-value="currentSearchValue"
			:sort-value="currentSortValue"
			:filters="currentFilters"
			:view-mode="viewMode"
			@search="handleSearch"
			@sort="handleSort"
			@filter="handleFilter"
			@view-mode-change="handleViewModeChange"
			@refresh="handleRefresh"
			@create="handleCreate"
		/>

		<!-- Conteúdo das abas -->
		<div class="w-full min-h-[400px]">
			<!-- Aba Cupons -->
			<div v-if="activeTab === 'cupons'" class="w-full">
				<CuponsView v-model:show-create-drawer="showCreateCupomDrawer" :view-mode="viewMode" />
			</div>

			<!-- Aba Banners -->
			<div v-if="activeTab === 'banners'" class="w-full">
				<BannersView v-model:show-create-drawer="showCreateBannerDrawer" :view-mode="viewMode" />
			</div>
		</div>
	</div>
</template>
