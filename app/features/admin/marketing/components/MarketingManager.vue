<script setup lang="ts">
/**
 * 📌 MarketingManager
 *
 * Componente orquestrador principal da feature de marketing.
 * Gerencia navegação entre abas, filtros e estado global.
 */

// Imports dos componentes
import MarketingStats from "./MarketingStats.vue";
import MarketingTabs from "./MarketingTabs.vue";
import MarketingFilters from "./shared/MarketingFilters.vue";
import CuponsView from "./cupons/CuponsView.vue";
import BannersView from "./banners/BannersView.vue";
import PromocoesView from "./promocoes/PromocoesView.vue";

// Imports dos composables
import { useMarketing } from "../composables/useMarketing";
import { useCupons } from "../composables/useCupons";
import { useBanners } from "../composables/useBanners";
import { usePromocoes } from "../composables/usePromocoes";

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
	handleRefresh,
} = useMarketing();

const { cuponsCount } = useCupons();
const { bannersCount } = useBanners();
const { promocoesCount } = usePromocoes();

// ========================================
// ESTADO DOS DRAWERS
// ========================================

const showCreateCupomDrawer = ref(false);
const showCreateBannerDrawer = ref(false);
const showCreatePromocaoDrawer = ref(false);

// ========================================
// HANDLERS
// ========================================

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
		case "promocoes":
			showCreatePromocaoDrawer.value = true;
			break;
	}
};
</script>

<template>
	<div class="w-full min-h-screen space-y-6">
		<!-- Navegação por abas -->
		<MarketingTabs :active-tab="activeTab" :tab-counts="tabCounts" @tab-change="handleTabChange" />

		<!-- Header com estatísticas gerais -->
		<MarketingStats
			:cupons-count="cuponsCount"
			:banners-count="bannersCount"
			:promocoes-count="promocoesCount"
		/>

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
				<BannersView v-model:show-create-drawer="showCreateBannerDrawer" />
			</div>

			<!-- Aba Promoções -->
			<div v-if="activeTab === 'promocoes'" class="w-full">
				<PromocoesView v-model:show-create-drawer="showCreatePromocaoDrawer" />
			</div>
		</div>
	</div>
</template>
