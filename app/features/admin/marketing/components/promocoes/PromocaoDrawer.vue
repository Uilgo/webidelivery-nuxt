<script setup lang="ts">
/**
 * 📌 PromocaoDrawer
 *
 * Drawer para criar/editar promoções.
 * Integra com PromocaoForm e gerencia estado de loading.
 */

import PromocaoForm from "./PromocaoForm.vue";
import { usePromocoes } from "../../composables/usePromocoes";
import type { PromocaoFormData } from "#shared/types/marketing";

interface Props {
	modelValue: boolean;
	mode: "create" | "edit";
	promocaoId?: string | null;
}

interface Emits {
	"update:modelValue": [value: boolean];
	"save-create": [data: PromocaoFormData];
	"save-edit": [id: string, data: PromocaoFormData];
}

const props = withDefaults(defineProps<Props>(), {
	promocaoId: null,
});

const emit = defineEmits<Emits>();

// ========================================
// COMPOSABLES
// ========================================

const { getPromocaoById } = usePromocoes();

// ========================================
// COMPUTADAS
// ========================================

/**
 * Controle do drawer
 */
const isOpen = computed({
	get: () => props.modelValue,
	set: (value: boolean) => emit("update:modelValue", value),
});

/**
 * Título do drawer baseado no modo
 */
const drawerTitle = computed(() => {
	return props.mode === "create" ? "Criar Promoção" : "Editar Promoção";
});

/**
 * Promoção sendo editada (se aplicável)
 */
const currentPromocao = computed(() => {
	if (props.mode === "edit" && props.promocaoId) {
		return getPromocaoById(props.promocaoId).value;
	}
	return undefined;
});

/**
 * Dados iniciais do formulário
 */
const initialFormData = computed(() => {
	if (props.mode === "edit" && currentPromocao.value) {
		return {
			nome: currentPromocao.value.nome,
			descricao: currentPromocao.value.descricao || undefined,
			tipo: currentPromocao.value.tipo,
			desconto: currentPromocao.value.desconto,
			data_inicio: currentPromocao.value.data_inicio.split("T")[0], // Converter para formato de data
			data_fim: currentPromocao.value.data_fim
				? currentPromocao.value.data_fim.split("T")[0]
				: undefined,
		};
	}
	return undefined;
});

// ========================================
// ESTADO LOCAL
// ========================================

const loading = ref(false);

// ========================================
// HANDLERS
// ========================================

/**
 * Handler para submissão do formulário
 */
const handleSubmit = async (data: PromocaoFormData): Promise<void> => {
	try {
		loading.value = true;

		if (props.mode === "create") {
			emit("save-create", data);
		} else if (props.mode === "edit" && props.promocaoId) {
			emit("save-edit", props.promocaoId, data);
		}

		// Fechar drawer após sucesso
		isOpen.value = false;
	} catch (error) {
		console.error("Erro ao salvar promoção:", error);
	} finally {
		loading.value = false;
	}
};

/**
 * Handler para cancelar
 */
const handleCancel = (): void => {
	isOpen.value = false;
};

// ========================================
// WATCHERS
// ========================================

// Reset loading quando drawer fecha
watch(isOpen, (newValue) => {
	if (!newValue) {
		loading.value = false;
	}
});
</script>

<template>
	<UiDrawer v-model="isOpen" size="lg">
		<template #header>
			<h2 class="text-xl font-semibold text-[var(--text-primary)]">
				{{ drawerTitle }}
			</h2>
		</template>

		<!-- Loading state para modo edit -->
		<div v-if="mode === 'edit' && promocaoId && !currentPromocao" class="space-y-4">
			<UiSkeleton class="h-12 w-full" />
			<UiSkeleton class="h-20 w-full" />
			<UiSkeleton class="h-12 w-full" />
			<UiSkeleton class="h-12 w-full" />
			<UiSkeleton class="h-32 w-full" />
		</div>

		<!-- Formulário -->
		<div v-else>
			<PromocaoForm
				:initial-data="initialFormData"
				:loading="loading"
				@submit="handleSubmit"
				@cancel="handleCancel"
			/>
		</div>
	</UiDrawer>
</template>
