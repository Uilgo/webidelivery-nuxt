<script setup lang="ts">
/**
 * 📌 LogoUploadTabs
 *
 * Componente para upload de logos com tabs para alternar entre Logo Claro e Logo Escuro.
 * Elimina a necessidade de scroll no card de identidade visual.
 */

interface Props {
	logoClaro?: string;
	logoEscuro?: string;
}

interface Emits {
	"update:logo-claro": [value: string];
	"update:logo-escuro": [value: string];
}

const props = withDefaults(defineProps<Props>(), {
	logoClaro: "",
	logoEscuro: "",
});

const emit = defineEmits<Emits>();

// Computed para garantir que sempre seja string
const logoClaroValue = computed(() => props.logoClaro || "");
const logoEscuroValue = computed(() => props.logoEscuro || "");

// Handlers para emitir mudanças
const handleLogoClaroChange = (value: string): void => {
	emit("update:logo-claro", value);
};

const handleLogoEscuroChange = (value: string): void => {
	emit("update:logo-escuro", value);
};
</script>

<template>
	<div class="space-y-4">
		<!-- Cabeçalho -->
		<div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
			<Icon name="lucide:palette" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
			<h3 class="text-sm font-semibold text-gray-900 dark:text-white">Identidade Visual</h3>
		</div>

		<!-- Tabs para alternar entre Logo Claro e Logo Escuro -->
		<UiTabs
			:tabs="[
				{ key: 'claro', label: 'Modo Claro', icon: 'lucide:sun' },
				{ key: 'escuro', label: 'Modo Escuro', icon: 'lucide:moon' },
			]"
			default-tab="claro"
		>
			<template #default="{ activeTab }">
				<!-- Conteúdo da tab ativa -->
				<div class="space-y-4">
					<!-- Logo Claro -->
					<div v-if="activeTab === 'claro'">
						<UiPictureUpload
							:model-value="logoClaroValue"
							label="Logo Claro"
							hint="Para tema claro"
							preview-bg="light"
							:max-size="200"
							:max-size-k-b="100"
							@update:model-value="handleLogoClaroChange"
						/>
					</div>

					<!-- Logo Escuro -->
					<div v-if="activeTab === 'escuro'">
						<UiPictureUpload
							:model-value="logoEscuroValue"
							label="Logo Escuro"
							hint="Para tema escuro"
							preview-bg="dark"
							:max-size="200"
							:max-size-k-b="100"
							@update:model-value="handleLogoEscuroChange"
						/>
					</div>

					<!-- Dica sobre logos -->
					<div
						class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3"
					>
						<p class="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
							<Icon name="lucide:lightbulb" class="w-4 h-4 flex-shrink-0" />
							<span>PNG ou JPG • Recomendado: 200x200px • Fundo transparente</span>
						</p>
					</div>
				</div>
			</template>
		</UiTabs>
	</div>
</template>
