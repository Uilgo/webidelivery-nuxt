<script setup lang="ts">
/**
 * 📌 AvatarUpload
 *
 * Componente de upload de avatar com compressão automática.
 * Comprime e redimensiona imagens para 256x256px e ~50KB.
 * Otimizado especificamente para avatars circulares.
 */

import imageCompression from "browser-image-compression";

interface Props {
	modelValue: string;
	label?: string;
	hint?: string;
	error?: string;
	/** Tamanho do preview em pixels (default: 120) */
	size?: number;
	/** Tamanho máximo da imagem em pixels (default: 256) */
	maxSize?: number;
	/** Tamanho máximo em KB (default: 50) */
	maxSizeKB?: number;
	/** Se está desabilitado */
	disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	label: undefined,
	hint: undefined,
	error: undefined,
	size: 120,
	maxSize: 256,
	maxSizeKB: 50,
	disabled: false,
});

const emit = defineEmits<{
	"update:modelValue": [value: string];
}>();

// Estados
const activeTab = ref("upload");
const tempUrl = ref("");
const fileInputRef = ref<HTMLInputElement | null>(null);
const isCompressing = ref(false);
const showPreviewModal = ref(false);
const imageSize = ref<number | null>(null);
const imageSource = ref<"upload" | "url">("upload");

// Calcula o tamanho do base64 em bytes
const calculateBase64Size = (base64: string): number => {
	const base64Data = base64.split(",")[1] || base64;
	return Math.round((base64Data.length * 3) / 4);
};

// Formata o tamanho para exibição
const formattedSize = computed(() => {
	if (!imageSize.value) return null;
	if (imageSize.value < 1024) return `${imageSize.value} B`;
	return `${(imageSize.value / 1024).toFixed(1)} KB`;
});

// Tabs
const tabs = [
	{ key: "upload", id: "upload", label: "Upload", icon: "lucide:upload" },
	{ key: "url", id: "url", label: "URL", icon: "lucide:link" },
];

/**
 * Comprime uma imagem File e retorna base64
 */
const compressImage = async (file: File): Promise<string> => {
	const options = {
		maxSizeMB: props.maxSizeKB / 1024,
		maxWidthOrHeight: props.maxSize,
		useWebWorker: true,
		fileType: "image/webp" as const,
		initialQuality: 0.9,
	};

	const compressedFile = await imageCompression(file, options);

	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (e) => resolve(e.target?.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(compressedFile);
	});
};

/**
 * Baixa imagem de URL e comprime
 */
const compressFromUrl = async (url: string): Promise<string> => {
	try {
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const blob = await response.blob();

		if (!blob.type.startsWith("image/")) {
			throw new Error("O arquivo baixado não é uma imagem válida");
		}

		const file = new File([blob], "avatar.jpg", { type: blob.type });
		return compressImage(file);
	} catch (error) {
		console.error("Erro ao baixar/processar imagem:", error);
		throw new Error(
			`Erro ao processar imagem: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
		);
	}
};

// Aplica URL com compressão
const applyUrl = async () => {
	if (!tempUrl.value) return;

	isCompressing.value = true;
	try {
		const compressed = await compressFromUrl(tempUrl.value);
		imageSize.value = calculateBase64Size(compressed);
		imageSource.value = "url";
		emit("update:modelValue", compressed);
		tempUrl.value = "";
	} catch (error) {
		console.error("Erro ao processar imagem:", error);
		alert(
			`Erro: ${error instanceof Error ? error.message : "Não foi possível processar a imagem"}`,
		);
	} finally {
		isCompressing.value = false;
	}
};

// Remove imagem
const removeImage = () => {
	emit("update:modelValue", "");
	imageSize.value = null;
	imageSource.value = "upload";
};

// Trigger input de arquivo
const triggerFileInput = () => {
	if (props.disabled) return;
	fileInputRef.value?.click();
};

// Handle seleção de arquivo com compressão
const handleFileSelect = async (event: Event) => {
	const input = event.target as HTMLInputElement;
	const file = input.files?.[0];
	if (file) {
		isCompressing.value = true;
		try {
			const compressed = await compressImage(file);
			imageSize.value = calculateBase64Size(compressed);
			imageSource.value = "upload";
			emit("update:modelValue", compressed);
		} catch (error) {
			console.error("Erro ao comprimir imagem:", error);
		} finally {
			isCompressing.value = false;
		}
	}
	input.value = "";
};

// Ação do botão Alterar
const handleChangeClick = () => {
	if (props.disabled) return;

	if (imageSource.value === "url") {
		activeTab.value = "url";
		removeImage();
	} else {
		triggerFileInput();
	}
};

// Clique no preview
const handlePreviewClick = () => {
	if (isCompressing.value || props.disabled) return;
	if (props.modelValue) {
		showPreviewModal.value = true;
	} else if (activeTab.value === "upload") {
		triggerFileInput();
	}
};

// Sincroniza tamanho quando modelValue muda
watch(
	() => props.modelValue,
	(newValue) => {
		if (newValue) {
			imageSize.value = calculateBase64Size(newValue);
		} else {
			imageSize.value = null;
		}
	},
	{ immediate: true },
);

// Estado para controlar hidratação SSR-friendly
const isMounted = ref(false);

onMounted(() => {
	nextTick(() => {
		isMounted.value = true;
	});
});
</script>

<template>
	<div class="space-y-3">
		<!-- Label -->
		<label v-if="label" class="block text-sm font-medium text-[var(--text-primary)]">
			{{ label }}
		</label>

		<!-- Tabs -->
		<UiTabs v-model="activeTab" :tabs="tabs" size="sm" />

		<!-- Layout: Preview + Controles -->
		<div class="flex flex-col sm:flex-row items-start gap-4">
			<!-- Preview do Avatar (circular) -->
			<div class="flex flex-col items-center gap-2 flex-shrink-0">
				<div class="relative">
					<!-- Container circular do avatar -->
					<div
						:class="[
							'relative flex items-center justify-center rounded-full border-2 transition-all overflow-hidden bg-[var(--bg-muted)]',
							modelValue ? 'border-[var(--border-default)] cursor-pointer' : 'border-dashed',
							error ? 'border-error-500' : 'border-[var(--border-default)]',
							!modelValue &&
								!isCompressing &&
								!disabled &&
								'cursor-pointer hover:border-[var(--primary)]',
							disabled && 'opacity-60 cursor-not-allowed',
						]"
						:style="{ width: `${size}px`, height: `${size}px` }"
						@click="handlePreviewClick"
					>
						<!-- Loading -->
						<div v-if="isCompressing" class="flex flex-col items-center">
							<Icon name="lucide:loader-2" class="size-6 animate-spin text-[var(--primary)]" />
							<span class="mt-1 text-xs text-[var(--text-muted)]">Processando...</span>
						</div>

						<!-- Avatar -->
						<img
							v-else-if="modelValue"
							:src="modelValue"
							alt="Avatar"
							class="absolute inset-0 w-full h-full object-cover"
						/>

						<!-- Placeholder -->
						<div v-else class="flex flex-col items-center">
							<Icon name="lucide:user" class="size-8 text-[var(--text-muted)]" />
							<span class="mt-1 text-xs text-[var(--text-muted)] text-center px-2">Avatar</span>
						</div>

						<!-- Overlay de hover -->
						<div
							v-if="modelValue && !isCompressing"
							class="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-all hover:bg-black/40"
						>
							<Icon
								name="lucide:camera"
								class="size-6 text-white opacity-0 hover:opacity-100 transition-opacity"
							/>
						</div>
					</div>

					<!-- Botão remover -->
					<button
						v-if="modelValue && !isCompressing && !disabled"
						type="button"
						class="absolute -right-1 -top-1 z-10 flex size-6 items-center justify-center rounded-full bg-error-500 text-white shadow-md hover:bg-error-600 transition-colors"
						title="Remover avatar"
						@click.stop="removeImage"
					>
						<Icon name="lucide:x" class="size-3.5" />
					</button>
				</div>

				<!-- Texto abaixo do preview -->
				<div class="text-center space-y-0.5">
					<p v-if="hint" class="text-xs text-[var(--text-muted)]">{{ hint }}</p>
					<p v-else class="text-xs text-[var(--text-muted)]">{{ maxSize }}x{{ maxSize }}px</p>
					<p v-if="formattedSize" class="text-xs font-medium text-[var(--text-secondary)]">
						{{ formattedSize }}
					</p>
				</div>
			</div>

			<!-- Controles -->
			<div class="flex flex-col gap-3 flex-1 min-w-0">
				<!-- Tab Upload: Botão -->
				<button
					v-if="activeTab === 'upload' || modelValue"
					type="button"
					:disabled="isCompressing || disabled"
					class="flex items-center justify-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--primary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50"
					@click="handleChangeClick"
				>
					<Icon
						:name="modelValue && imageSource === 'url' ? 'lucide:link' : 'lucide:camera'"
						class="size-4"
					/>
					<span>{{ modelValue ? "Alterar Avatar" : "Selecionar Avatar" }}</span>
				</button>

				<!-- Tab URL: Input -->
				<div
					v-if="activeTab === 'url' && !modelValue"
					class="flex flex-col sm:flex-row items-stretch gap-2"
				>
					<UiInput
						v-model="tempUrl"
						placeholder="https://exemplo.com/avatar.jpg"
						icon="lucide:link"
						class="flex-1 min-w-0"
						:disabled="isCompressing || disabled"
					/>
					<UiButton
						:disabled="!tempUrl || isCompressing || disabled"
						:loading="isCompressing"
						icon="lucide:check"
						class="h-auto shrink-0 px-3"
						@click="applyUrl"
					/>
				</div>

				<!-- Especificações -->
				<div class="space-y-1 text-xs text-[var(--text-muted)]">
					<p>PNG, JPG ou WebP</p>
					<p>Otimizado: {{ maxSize }}x{{ maxSize }}px</p>
					<p>Máximo: {{ maxSizeKB }}KB</p>
				</div>
			</div>
		</div>

		<!-- Input file oculto -->
		<input
			ref="fileInputRef"
			type="file"
			accept="image/*"
			class="hidden"
			:disabled="disabled"
			@change="handleFileSelect"
		/>

		<!-- Erro -->
		<p v-if="error" class="text-xs text-error-500 flex items-center gap-1.5">
			<Icon name="lucide:alert-circle" class="size-3.5" />
			{{ error }}
		</p>

		<!-- Modal de Preview -->
		<UiModal
			v-if="isMounted && showPreviewModal"
			v-model="showPreviewModal"
			title="Preview do Avatar"
			size="sm"
		>
			<div class="flex flex-col items-center gap-4">
				<!-- Avatar em tamanho maior -->
				<div
					class="flex items-center justify-center rounded-full border-2 border-[var(--border-default)] overflow-hidden bg-[var(--bg-muted)]"
					style="width: 200px; height: 200px"
				>
					<img
						v-if="modelValue"
						:src="modelValue"
						alt="Preview do avatar"
						class="w-full h-full object-cover"
					/>
				</div>

				<!-- Info -->
				<div class="text-center space-y-1">
					<p class="text-sm font-medium text-[var(--text-primary)]">Avatar otimizado</p>
					<p class="text-xs text-[var(--text-muted)]">{{ maxSize }}x{{ maxSize }}px</p>
					<p v-if="formattedSize" class="text-xs text-[var(--text-secondary)]">
						Tamanho: {{ formattedSize }}
					</p>
				</div>
			</div>

			<template #footer>
				<UiButton variant="outline" @click="showPreviewModal = false">Fechar</UiButton>
			</template>
		</UiModal>
	</div>
</template>
