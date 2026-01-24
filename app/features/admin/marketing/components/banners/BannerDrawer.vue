<script setup lang="ts">
/**
 * 📌 BannerDrawer
 *
 * Drawer para criar/editar banners.
 * Integra com BannerForm e gerencia estado de loading.
 */

import BannerForm from "./BannerForm.vue";
import { useBanners } from "../../composables/useBanners";
import type { BannerFormData } from "#shared/types/marketing";

interface Props {
	modelValue: boolean;
	mode: "create" | "edit";
	bannerId?: string | null;
}

interface Emits {
	"update:modelValue": [value: boolean];
	"save-create": [data: BannerFormData];
	"save-edit": [id: string, data: BannerFormData];
}

const props = withDefaults(defineProps<Props>(), {
	bannerId: null,
});

const emit = defineEmits<Emits>();

// ========================================
// COMPOSABLES
// ========================================

const { getBannerById } = useBanners();

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
	return props.mode === "create" ? "Criar Banner" : "Editar Banner";
});

/**
 * Banner sendo editado (se aplicável)
 */
const currentBanner = computed(() => {
	if (props.mode === "edit" && props.bannerId) {
		return getBannerById(props.bannerId).value;
	}
	return undefined;
});

/**
 * Dados iniciais do formulário
 */
const initialFormData = computed(() => {
	if (props.mode === "edit" && currentBanner.value) {
		return {
			titulo: currentBanner.value.titulo,
			descricao: currentBanner.value.descricao || undefined,
			tipo: currentBanner.value.tipo,
			tipo_conteudo: currentBanner.value.tipo_conteudo,
			imagem_url: currentBanner.value.imagem_url || undefined,
			link_url: currentBanner.value.link_url || undefined,
			cor_fundo: currentBanner.value.cor_fundo || undefined,
			cor_texto: currentBanner.value.cor_texto || undefined,
			texto_cta: currentBanner.value.texto_cta || undefined,
			texto_posicao: currentBanner.value.texto_posicao || undefined,
			texto_cor_fundo: currentBanner.value.texto_cor_fundo || undefined,
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
const handleSubmit = async (data: BannerFormData): Promise<void> => {
	try {
		loading.value = true;

		if (props.mode === "create") {
			emit("save-create", data);
		} else if (props.mode === "edit" && props.bannerId) {
			emit("save-edit", props.bannerId, data);
		}

		// Fechar drawer após sucesso
		isOpen.value = false;
	} catch (error) {
		console.error("Erro ao salvar banner:", error);
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
		<div v-if="mode === 'edit' && bannerId && !currentBanner" class="space-y-4">
			<UiSkeleton class="h-12 w-full" />
			<UiSkeleton class="h-20 w-full" />
			<UiSkeleton class="h-12 w-full" />
		</div>

		<!-- Formulário -->
		<div v-else>
			<BannerForm
				:initial-data="initialFormData"
				:loading="loading"
				@submit="handleSubmit"
				@cancel="handleCancel"
			/>
		</div>
	</UiDrawer>
</template>
