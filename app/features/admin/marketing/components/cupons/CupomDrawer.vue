<script setup lang="ts">
/**
 * 📌 CupomDrawer
 *
 * Drawer para criar/editar cupons.
 * Integra com CupomForm e gerencia estado de loading.
 */

import CupomForm from "./CupomForm.vue";
import { useCupons } from "../../composables/useCupons";
import type { CupomFormData } from "#shared/types/marketing";

interface Props {
	modelValue: boolean;
	mode: "create" | "edit";
	cupomId?: string | null;
}

interface Emits {
	"update:modelValue": [value: boolean];
	"save-create": [data: CupomFormData];
	"save-edit": [id: string, data: CupomFormData];
}

const props = withDefaults(defineProps<Props>(), {
	cupomId: null,
});

const emit = defineEmits<Emits>();

// ========================================
// COMPOSABLES
// ========================================

const { getCupomById } = useCupons();

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
	return props.mode === "create" ? "Criar Cupom" : "Editar Cupom";
});

/**
 * Cupom sendo editado (se aplicável)
 */
const currentCupom = computed(() => {
	if (props.mode === "edit" && props.cupomId) {
		return getCupomById(props.cupomId).value;
	}
	return undefined;
});

/**
 * Dados iniciais do formulário
 */
const initialFormData = computed(() => {
	if (props.mode === "edit" && currentCupom.value) {
		return {
			codigo: currentCupom.value.codigo,
			tipo: currentCupom.value.tipo,
			valor_desconto: currentCupom.value.valor_desconto,
			valor_minimo: currentCupom.value.valor_minimo || undefined,
			limite_uso: currentCupom.value.limite_uso || undefined,
			data_expiracao: currentCupom.value.data_expiracao
				? currentCupom.value.data_expiracao.split("T")[0]
				: undefined,
			descricao: currentCupom.value.descricao || undefined,
		};
	}
	// Para modo create, retornar undefined em vez de objeto vazio
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
const handleSubmit = async (data: CupomFormData): Promise<void> => {
	try {
		loading.value = true;

		if (props.mode === "create") {
			emit("save-create", data);
		} else if (props.mode === "edit" && props.cupomId) {
			emit("save-edit", props.cupomId, data);
		}

		// Fechar drawer após sucesso
		isOpen.value = false;
	} catch (error) {
		console.error("Erro ao salvar cupom:", error);
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
		<div v-if="mode === 'edit' && cupomId && !currentCupom" class="space-y-4">
			<UiSkeleton class="h-12 w-full" />
			<UiSkeleton class="h-20 w-full" />
			<UiSkeleton class="h-12 w-full" />
			<UiSkeleton class="h-12 w-full" />
			<UiSkeleton class="h-32 w-full" />
		</div>

		<!-- Formulário -->
		<div v-else>
			<CupomForm
				:initial-data="initialFormData"
				:loading="loading"
				@submit="handleSubmit"
				@cancel="handleCancel"
			/>
		</div>
	</UiDrawer>
</template>
