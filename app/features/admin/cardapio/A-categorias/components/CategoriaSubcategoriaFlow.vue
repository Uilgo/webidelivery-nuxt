<script setup lang="ts">
/**
 * 📌 CategoriaSubcategoriaFlow
 *
 * Orquestra o fluxo completo de criação de subcategoria:
 * 1. Abre drawer para criar subcategoria
 * 2. Após criação, verifica se categoria pai tem produtos
 * 3. Se sim, abre modal de migração
 * 4. Emite eventos de sucesso
 */

import type { UUID } from "#shared/types/database";
import type { CategoriaComputada } from "../../../types/categoria";
import { useCategorias } from "../composables/useCategorias";
import { useCategoriasMigracao } from "../composables/useCategoriasMigracao";
import CategoriaDrawer from "./CategoriaDrawer.vue";
import CategoriaMigrarProdutosModal from "./CategoriaMigrarProdutosModal.vue";

interface Props {
	/** Controla visibilidade do fluxo */
	modelValue: boolean;
	/** Categoria pai para criar subcategoria */
	categoriaPai: CategoriaComputada | null;
}

interface Emits {
	/** Atualiza visibilidade do fluxo */
	"update:modelValue": [value: boolean];
	/** Emitido quando fluxo é concluído com sucesso */
	success: [];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Composables
const { openCreateSubcategoria, isModalOpen, selectedCategoria } = useCategorias();
const { verificarProdutos } = useCategoriasMigracao();

// Estados do fluxo
const isOpen = computed({
	get: () => props.modelValue,
	set: (value: boolean) => emit("update:modelValue", value),
});

const isMigrationModalOpen = ref(false);
const subcategoriaCriada = ref<{ id: UUID; nome: string } | null>(null);

/**
 * Inicia o fluxo quando abre
 */
watch(
	() => props.modelValue,
	(isOpen) => {
		if (isOpen && props.categoriaPai) {
			// Abre drawer para criar subcategoria
			openCreateSubcategoria(props.categoriaPai);
		} else if (!isOpen) {
			// Reset do estado quando fecha
			subcategoriaCriada.value = null;
			isMigrationModalOpen.value = false;
		}
	},
	{ immediate: true },
);

/**
 * Handler para sucesso na criação da subcategoria
 */
const handleSubcategoriaCreated = async (): Promise<void> => {
	if (!props.categoriaPai || !selectedCategoria.value) return;

	// Armazena dados da subcategoria criada
	subcategoriaCriada.value = {
		id: selectedCategoria.value.id,
		nome: selectedCategoria.value.nome,
	};

	// Verifica se categoria pai tem produtos para migrar
	const temProdutos = await verificarProdutos(props.categoriaPai.id);

	if (temProdutos) {
		// Abre modal de migração
		isMigrationModalOpen.value = true;
	} else {
		// Finaliza fluxo se não há produtos para migrar
		handleFlowComplete();
	}
};

/**
 * Handler para sucesso na migração
 */
const handleMigrationSuccess = (): void => {
	isMigrationModalOpen.value = false;
	handleFlowComplete();
};

/**
 * Handler para cancelar migração
 */
const handleMigrationCancel = (): void => {
	isMigrationModalOpen.value = false;
	handleFlowComplete();
};

/**
 * Finaliza o fluxo com sucesso
 */
const handleFlowComplete = (): void => {
	emit("success");
	isOpen.value = false;
};
</script>

<template>
	<div>
		<!-- Drawer de criação de subcategoria -->
		<CategoriaDrawer
			v-model="isModalOpen"
			:is-edicao="false"
			:categoria="null"
			@success="handleSubcategoriaCreated"
		/>

		<!-- Modal de migração de produtos -->
		<CategoriaMigrarProdutosModal
			v-if="props.categoriaPai && subcategoriaCriada"
			v-model="isMigrationModalOpen"
			:categoria-origem-id="props.categoriaPai.id"
			:categoria-origem-nome="props.categoriaPai.nome"
			:subcategoria-destino-id="subcategoriaCriada.id"
			:subcategoria-destino-nome="subcategoriaCriada.nome"
			@success="handleMigrationSuccess"
			@cancel="handleMigrationCancel"
		/>
	</div>
</template>
