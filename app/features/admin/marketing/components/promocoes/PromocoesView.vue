<script setup lang="ts">
/**
 * 📌 PromocoesView
 *
 * Componente de visualização da aba de promoções.
 * Exibe lista de promoções com opções de CRUD e ordenação.
 */

// Importações dos componentes específicos de promoções
import PromocaoCard from "./PromocaoCard.vue";
import PromocoesList from "./PromocoesList.vue";
import PromocaoDrawer from "./PromocaoDrawer.vue";

// Imports dos composables
import { usePromocoes } from "../../composables/usePromocoes";
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
	promocoes,
	loading,
	error,
	createPromocao,
	updatePromocao,
	deletePromocao,
	togglePromocaoStatus,
	duplicatePromocao,
	reorderPromocao,
	extendPromocao,
	refreshPromocoes,
} = usePromocoes();

const { viewMode } = useMarketing();

// ========================================
// ESTADO LOCAL
// ========================================

const showCreateDrawerLocal = ref(false);
const showEditDrawer = ref(false);
const showDeleteModal = ref(false);
const showExtendModal = ref(false);
const selectedPromocao = ref<string | null>(null);
const extendDate = ref("");

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
 * Handler para editar promoção
 */
const handleEdit = (promocaoId: string): void => {
	selectedPromocao.value = promocaoId;
	showEditDrawer.value = true;
};

/**
 * Handler para excluir promoção
 */
const handleDelete = (promocaoId: string): void => {
	selectedPromocao.value = promocaoId;
	showDeleteModal.value = true;
};

/**
 * Handler para confirmar exclusão
 */
const handleConfirmDelete = async (): Promise<void> => {
	if (!selectedPromocao.value) return;

	try {
		await deletePromocao(selectedPromocao.value);
		showDeleteModal.value = false;
		selectedPromocao.value = null;
	} catch (error) {
		console.error("Erro ao excluir promoção:", error);
	}
};

/**
 * Handler para duplicar promoção
 */
const handleDuplicate = async (promocaoId: string): Promise<void> => {
	try {
		await duplicatePromocao(promocaoId);
	} catch (error) {
		console.error("Erro ao duplicar promoção:", error);
	}
};

/**
 * Handler para alternar status
 */
const handleToggleStatus = async (promocaoId: string): Promise<void> => {
	try {
		await togglePromocaoStatus(promocaoId);
	} catch (error) {
		console.error("Erro ao alterar status:", error);
	}
};

/**
 * Handler para reordenar promoção
 */
const handleReorder = async (promocaoId: string, newOrder: number): Promise<void> => {
	try {
		await reorderPromocao(promocaoId, newOrder);
	} catch (error) {
		console.error("Erro ao reordenar promoção:", error);
	}
};

/**
 * Handler para estender promoção
 */
const handleExtend = (promocaoId: string): void => {
	selectedPromocao.value = promocaoId;

	// Definir data padrão para 30 dias a partir de hoje
	const hoje = new Date();
	hoje.setDate(hoje.getDate() + 30);
	extendDate.value = hoje.toISOString().split("T")[0];

	showExtendModal.value = true;
};

/**
 * Handler para confirmar extensão
 */
const handleConfirmExtend = async (): Promise<void> => {
	if (!selectedPromocao.value || !extendDate.value) return;

	try {
		await extendPromocao(selectedPromocao.value, extendDate.value);
		showExtendModal.value = false;
		selectedPromocao.value = null;
		extendDate.value = "";
	} catch (error) {
		console.error("Erro ao estender promoção:", error);
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
					Erro ao carregar promoções
				</h3>
				<p class="text-[var(--text-muted)] mb-4">{{ error }}</p>
				<UiButton @click="refreshPromocoes">
					<Icon name="lucide:refresh-cw" class="w-4 h-4 mr-2" />
					Tentar novamente
				</UiButton>
			</div>
		</UiCard>

		<!-- Estado vazio -->
		<UiCard v-else-if="promocoes.length === 0" class="p-12">
			<div class="text-center">
				<Icon name="lucide:percent" class="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)]" />
				<h3 class="text-lg font-medium text-[var(--text-primary)] mb-2">Nenhuma promoção criada</h3>
				<p class="text-[var(--text-muted)] mb-6">
					Crie sua primeira promoção para aumentar as vendas e atrair clientes
				</p>
				<UiButton @click="showCreateDrawerComputed = true">
					<Icon name="lucide:plus" class="w-4 h-4 mr-2" />
					Criar primeira promoção
				</UiButton>
			</div>
		</UiCard>

		<!-- Lista de promoções -->
		<div v-else>
			<!-- Visualização em cards -->
			<div v-if="viewMode === 'card'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				<PromocaoCard
					v-for="promocao in promocoes"
					:key="promocao.id"
					:promocao="promocao"
					@edit="handleEdit"
					@delete="handleDelete"
					@duplicate="handleDuplicate"
					@toggle-status="handleToggleStatus"
					@reorder="handleReorder"
					@extend="handleExtend"
				/>
			</div>

			<!-- Visualização em lista -->
			<div v-else>
				<PromocoesList
					:promocoes="promocoes"
					@edit="handleEdit"
					@delete="handleDelete"
					@duplicate="handleDuplicate"
					@toggle-status="handleToggleStatus"
					@reorder="handleReorder"
					@extend="handleExtend"
				/>
			</div>
		</div>

		<!-- Drawer de criação -->
		<PromocaoDrawer
			v-model="showCreateDrawerComputed"
			mode="create"
			@save-create="createPromocao"
		/>

		<!-- Drawer de edição -->
		<PromocaoDrawer
			v-model="showEditDrawer"
			mode="edit"
			:promocao-id="selectedPromocao"
			@save-edit="updatePromocao"
		/>

		<!-- Modal de confirmação de exclusão -->
		<UiModal v-model="showDeleteModal">
			<template #header>
				<h3 class="text-lg font-semibold">Excluir Promoção</h3>
			</template>

			<template #content>
				<p class="text-[var(--text-muted)]">
					Tem certeza que deseja excluir esta promoção? Esta ação não pode ser desfeita.
				</p>
			</template>

			<template #footer>
				<div class="flex gap-3 justify-end">
					<UiButton variant="outline" @click="showDeleteModal = false"> Cancelar </UiButton>
					<UiButton variant="solid" color="error" @click="handleConfirmDelete"> Excluir </UiButton>
				</div>
			</template>
		</UiModal>

		<!-- Modal de extensão de promoção -->
		<UiModal v-model="showExtendModal">
			<template #header>
				<h3 class="text-lg font-semibold">Estender Promoção</h3>
			</template>

			<template #content>
				<div class="space-y-4">
					<p class="text-[var(--text-muted)]">
						Defina uma nova data de término para esta promoção:
					</p>

					<div>
						<label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
							Nova Data de Término
						</label>
						<input
							v-model="extendDate"
							type="date"
							class="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
							:min="new Date().toISOString().split('T')[0]"
						/>
					</div>
				</div>
			</template>

			<template #footer>
				<div class="flex gap-3 justify-end">
					<UiButton variant="outline" @click="showExtendModal = false"> Cancelar </UiButton>
					<UiButton variant="solid" :disabled="!extendDate" @click="handleConfirmExtend">
						Estender
					</UiButton>
				</div>
			</template>
		</UiModal>
	</div>
</template>
