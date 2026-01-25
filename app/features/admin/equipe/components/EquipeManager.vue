<script setup lang="ts">
/**
 * 📌 EquipeManager
 *
 * Componente principal que orquestra toda a feature de equipe.
 * Usa o composable useEquipe para gerenciar estado e ações.
 */

import { useEquipe } from "../composables/useEquipe";
import EquipeStats from "./EquipeStats.vue";
import EquipeTabs from "./EquipeTabs.vue";
import EquipeFiltros from "./EquipeFiltros.vue";
import MembrosList from "./membros/MembrosList.vue";
import ConvitesList from "./convites/ConvitesList.vue";
import ConviteModal from "./convites/ConviteModal.vue";
import MembroModal from "./membros/MembroModal.vue";

// Composable principal
const {
	// Estado
	abaAtiva,
	modalConviteAberto,
	modalMembroAberto,
	membroSelecionado,

	// Dados
	membrosFiltrados,
	convitesAtivos,
	convitesExpirados,
	estatisticas,

	// Loading
	loadingMembros,
	loadingConvites,
	loadingActions,

	// Erros
	erroMembros,
	erroConvites,

	// Permissões
	cargosDisponiveis,

	// Métodos - Inicialização
	inicializar,
	refresh,

	// Métodos - Navegação
	setAbaAtiva,
	abrirModalConvite,
	fecharModalConvite,
	abrirModalMembro,
	fecharModalMembro,

	// Métodos - Ações
	criarConvite,
	cancelarConvite,
	editarMembro,
	ativarMembro,
	desativarMembro,
	removerMembro,
} = useEquipe();

// Inicializa dados ao montar o componente
onMounted(async () => {
	await inicializar();
});
</script>

<template>
	<div class="space-y-6">
		<!-- Tabs -->
		<EquipeTabs :aba-ativa="abaAtiva" @change="setAbaAtiva" />

		<!-- Cards de Estatísticas -->
		<EquipeStats :estatisticas="estatisticas" :loading="loadingMembros || loadingConvites" />

		<!-- Filtros (apenas na aba membros) -->
		<EquipeFiltros
			v-if="abaAtiva === 'membros'"
			@convidar-membro="abrirModalConvite"
			@refresh="refresh"
		/>

		<!-- Conteúdo das Abas -->
		<div class="min-h-[400px]">
			<!-- Aba Membros -->
			<div v-if="abaAtiva === 'membros'">
				<MembrosList
					:membros="membrosFiltrados"
					:loading="loadingMembros"
					:error="erroMembros"
					@editar="abrirModalMembro"
					@ativar="ativarMembro"
					@desativar="desativarMembro"
					@remover="removerMembro"
				/>
			</div>

			<!-- Aba Convites -->
			<div v-else-if="abaAtiva === 'convites'">
				<ConvitesList
					:convites="convitesAtivos"
					:convites-expirados="convitesExpirados"
					:loading="loadingConvites"
					:error="erroConvites"
					@cancelar="cancelarConvite"
				/>
			</div>
		</div>

		<!-- Modal Criar Convite -->
		<ConviteModal
			:model-value="modalConviteAberto"
			:cargos-disponiveis="cargosDisponiveis"
			:loading="loadingActions"
			@update:model-value="modalConviteAberto ? fecharModalConvite() : null"
			@criar="criarConvite"
		/>

		<!-- Modal Editar Membro -->
		<MembroModal
			:model-value="modalMembroAberto"
			:membro="membroSelecionado"
			:cargos-disponiveis="cargosDisponiveis"
			:loading="loadingActions"
			@update:model-value="modalMembroAberto ? fecharModalMembro() : null"
			@salvar="editarMembro"
		/>
	</div>
</template>
