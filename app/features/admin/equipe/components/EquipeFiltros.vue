<script setup lang="ts">
/**
 * 📌 EquipeFiltros
 *
 * Componente de filtros para a lista de membros.
 * Inclui filtros por cargo, status, busca e ordenação.
 */

import { useEquipe } from "../composables/useEquipe";
import { CARGO_LABELS } from "../utils/cargo-helpers";
import type { CargoEquipe, StatusMembro, OrdenacaoMembros } from "../types/equipe";

interface Emits {
	convidarMembro: [];
	refresh: [];
}

const emit = defineEmits<Emits>();

// Composable principal
const {
	filtros,
	ordenacao,
	termoBusca,
	temFiltrosAtivos,
	contadorFiltros,
	podeAcessarEquipe,
	cargosDisponiveis,
	setFiltroCargo,
	setFiltroStatus,
	setBusca,
	setOrdenacao,
	limparFiltros,
} = useEquipe();

// Opções de filtro de cargo
const opcoesCargoFiltro = computed(() => [
	{ value: "", label: "Todos os cargos" },
	...Object.entries(CARGO_LABELS).map(([key, label]) => ({
		value: key,
		label,
	})),
]);

// Opções de filtro de status
const opcoesStatusFiltro = [
	{ value: "", label: "Todos os status" },
	{ value: "ativo", label: "Ativos" },
	{ value: "inativo", label: "Inativos" },
];

// Opções de ordenação
const opcoesOrdenacao = [
	{ value: "recente_desc", label: "Mais recentes" },
	{ value: "recente_asc", label: "Mais antigos" },
	{ value: "nome_asc", label: "Nome A-Z" },
	{ value: "nome_desc", label: "Nome Z-A" },
];

// Handlers
const handleCargoChange = (valor: string | number | null) => {
	const cargo = valor === "" || valor === null ? undefined : (valor as CargoEquipe);
	setFiltroCargo(cargo);
};

const handleStatusChange = (valor: string | number | null) => {
	const status = valor === "" || valor === null ? undefined : (valor as StatusMembro);
	setFiltroStatus(status);
};

const handleBuscaChange = (valor: string | number) => {
	setBusca(String(valor));
};

const handleOrdenacaoChange = (valor: string | number | null) => {
	if (valor) {
		setOrdenacao(valor as OrdenacaoMembros);
	}
};

// Handler para convidar membro
const handleConvidarMembro = () => {
	emit("convidarMembro");
};

// Handler para refresh
const isRefreshing = ref(false);

const handleRefresh = async () => {
	isRefreshing.value = true;
	emit("refresh");

	// Rotacionar por 500ms
	setTimeout(() => {
		isRefreshing.value = false;
	}, 500);
};
</script>

<template>
	<UiCard size="sm" variant="outlined">
		<div class="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
			<!-- Input de Busca -->
			<div class="w-full lg:w-64">
				<UiInput
					:model-value="termoBusca"
					placeholder="Buscar por nome ou email..."
					icon="lucide:search"
					@update:model-value="handleBuscaChange"
				/>
			</div>

			<!-- Filtros -->
			<div class="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
				<!-- Filtro por Cargo -->
				<div class="w-full sm:w-40">
					<UiSelect
						:model-value="filtros.cargo || ''"
						:options="opcoesCargoFiltro"
						placeholder="Cargo"
						@update:model-value="handleCargoChange"
					/>
				</div>

				<!-- Filtro por Status -->
				<div class="w-full sm:w-40">
					<UiSelect
						:model-value="filtros.status || ''"
						:options="opcoesStatusFiltro"
						placeholder="Status"
						@update:model-value="handleStatusChange"
					/>
				</div>

				<!-- Ordenação -->
				<div class="w-full sm:w-40">
					<UiSelect
						:model-value="ordenacao"
						:options="opcoesOrdenacao"
						placeholder="Ordenar"
						@update:model-value="handleOrdenacaoChange"
					/>
				</div>

				<!-- Botão Limpar Filtros -->
				<UiButton
					v-if="temFiltrosAtivos"
					variant="outline"
					color="neutral"
					icon="lucide:x"
					size="sm"
					class="flex-shrink-0"
					@click="limparFiltros"
				>
					<span class="hidden sm:inline">Limpar</span>
					<span class="sm:hidden">{{ contadorFiltros }}</span>
				</UiButton>
			</div>

			<!-- Spacer para empurrar botões para a direita -->
			<div class="hidden lg:block lg:flex-1"></div>

			<!-- Botões de Ação (Isolados no canto direito) -->
			<div class="w-full lg:w-auto flex gap-2 lg:ml-auto">
				<!-- Botão Refresh (apenas ícone) -->
				<button
					type="button"
					class="w-10 h-10 rounded-lg text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center flex-shrink-0"
					:class="{ 'animate-spin': isRefreshing }"
					title="Atualizar"
					@click="handleRefresh"
				>
					<Icon name="lucide:refresh-cw" class="w-5 h-5" />
				</button>

				<!-- Botão Convidar -->
				<UiButton
					v-if="podeAcessarEquipe && cargosDisponiveis.length > 0"
					variant="solid"
					color="primary"
					icon="lucide:user-plus"
					class="flex-1 lg:flex-initial flex-shrink-0"
					@click="handleConvidarMembro"
				>
					<span class="hidden sm:inline">Convidar Membro</span>
					<span class="sm:hidden">Convidar</span>
				</UiButton>
			</div>
		</div>
	</UiCard>
</template>
