<script setup lang="ts">
/**
 * 📌 SectionConfigTabs
 *
 * Renderiza o conteúdo/seção da tab ativa.
 * Recebe a tab ativa e renderiza o componente correspondente.
 */

import DadosEmpresaTab from "./tabs/DadosEmpresaTab.vue";
import HorariosTab from "./tabs/HorariosTab.vue";
import PagamentosTab from "./tabs/PagamentosTab.vue";
import FreteEntregaTab from "./tabs/FreteEntregaTab.vue";
import PersonalizarTab from "./tabs/PersonalizarTab.vue";

interface Props {
	activeTab: string;
}

const props = defineProps<Props>();

/**
 * Mapeamento de tabs para componentes
 */
const tabComponents: Record<string, Component> = {
	"dados-empresa": DadosEmpresaTab,
	horarios: HorariosTab,
	pagamentos: PagamentosTab,
	"frete-entrega": FreteEntregaTab,
	personalizar: PersonalizarTab,
};

/**
 * Componente da tab ativa
 */
const currentComponent = computed(() => {
	return tabComponents[props.activeTab] || HorariosTab;
});
</script>

<template>
	<div class="w-full h-full">
		<!-- Renderiza componente da tab ativa -->
		<component :is="currentComponent" />
	</div>
</template>
