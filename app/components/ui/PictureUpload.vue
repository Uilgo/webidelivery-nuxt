<script setup lang="ts">
/**
 * 📌 PictureUpload
 *
 * Componente de upload de imagem com compressão automática.
 * Comprime e redimensiona imagens para 512x512px e ~100KB.
 * Suporta upload de arquivo e inserção via URL.
 */

import imageCompression from "browser-image-compression";

interface Props {
	modelValue: string;
	label?: string;
	hint?: string;
	error?: string;
	/** Cor de fundo do preview (light ou dark) */
	previewBg?: "light" | "dark";
	/** Tamanho máximo em pixels (default: 512) */
	maxSize?: number;
	/** Tamanho máximo em KB (default: 100) */
	maxSizeKB?: number;
	/** Se está desabilitado */
	disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	label: undefined,
	hint: undefined,
	error: undefined,
	previewBg: "light",
	maxSize: 512,
	maxSizeKB: 100,
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
const imageSource = ref<"upload" | "url">("upload"); // Origem da imagem atual

// Calcula o tamanho do base64 em bytes
const calculateBase64Size = (base64: string): number => {
	// Remove o prefixo data:image/...;base64,
	const base64Data = base64.split(",")[1] || base64;
	// Calcula o tamanho real (base64 é ~33% maior que o original)
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
		maxSizeMB: props.maxSizeKB / 1024, // Converte KB para MB
		maxWidthOrHeight: props.maxSize,
		useWebWorker: true,
		fileType: "image/webp" as const, // WebP para melhor compressão
		initialQuality: 0.9,
	};

	const compressedFile = await imageCompression(file, options);

	// Converte para base64
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (e) => resolve(e.target?.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(compressedFile);
	});
};

/**
 * Baixa imagem de URL através do proxy e comprime
 */
const compressFromUrl = async (url: string): Promise<string> => {
	try {
		// Usa o proxy do servidor para contornar CORS
		const proxyUrl = `/api/proxy/image?url=${encodeURIComponent(url)}`;
		const response = await fetch(proxyUrl);

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
		}

		const blob = await response.blob();

		// Verifica se é realmente uma imagem
		if (!blob.type.startsWith("image/")) {
			throw new Error("O arquivo baixado não é uma imagem válida");
		}

		const file = new File([blob], "image.jpg", { type: blob.type });
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
		imageSource.value = "url"; // Marca que veio de URL
		emit("update:modelValue", compressed);
		tempUrl.value = "";
	} catch (error) {
		console.error("Erro ao processar imagem:", error);
		// Aqui você pode adicionar um toast de erro se tiver o composable disponível
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
			imageSource.value = "upload"; // Marca que veio de upload
			emit("update:modelValue", compressed);
		} catch (error) {
			console.error("Erro ao comprimir imagem:", error);
		} finally {
			isCompressing.value = false;
		}
	}
	input.value = "";
};

// Ação do botão Alterar - depende da origem da imagem
const handleChangeClick = () => {
	if (props.disabled) return;

	if (imageSource.value === "url") {
		// Se veio de URL, muda para tab URL e limpa a imagem
		activeTab.value = "url";
		removeImage();
	} else {
		// Se veio de upload, abre o seletor de arquivos
		triggerFileInput();
	}
};

// Classes do preview
const previewBgClass = computed(() => (props.previewBg === "dark" ? "bg-gray-900" : "bg-white"));

// Clique no preview - abre modal se tem imagem, senão abre file input
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
	// Pequeno delay para garantir que a hidratação esteja completa
	nextTick(() => {
		isMounted.value = true;
	});
});
</script>

<template>
	<div class="space-y-2">
		<!-- Label -->
		<label v-if="label" class="block text-sm font-medium text-[var(--text-primary)]">
			{{ label }}
		</label>

		<!-- Tabs -->
		<UiTabs v-model="activeTab" :tabs="tabs" size="sm" />

		<!-- Layout responsivo: Preview + Coluna lateral -->
		<div class="mt-3 flex flex-col sm:flex-row items-start gap-3">
			<!-- Coluna esquerda: Preview + texto -->
			<div class="flex flex-col items-center gap-2 flex-shrink-0">
				<!-- Container do Preview com botão X -->
				<div class="relative">
					<!-- Preview - tamanho fixo 100x100px -->
					<div
						:class="[
							'relative flex h-[100px] w-[100px] shrink-0 items-center justify-center rounded-xl border-2 transition-all overflow-hidden',
							modelValue ? 'border-[var(--border-default)] cursor-pointer' : 'border-dashed',
							error ? 'border-error-500' : 'border-[var(--border-default)]',
							!modelValue &&
								!isCompressing &&
								!disabled &&
								'cursor-pointer hover:border-[var(--primary)]',
							previewBgClass,
							disabled && 'opacity-60 cursor-not-allowed',
						]"
						@click="handlePreviewClick"
					>
						<!-- Loading -->
						<div v-if="isCompressing" class="flex flex-col items-center">
							<Icon name="lucide:loader-2" class="size-8 animate-spin text-[var(--primary)]" />
							<span class="mt-1 text-xs text-[var(--text-muted)]">Processando...</span>
						</div>

						<!-- Imagem (já comprimida) -->
						<img
							v-else-if="modelValue"
							:src="modelValue"
							alt="Preview"
							class="absolute inset-0 w-full h-full object-cover"
						/>

						<!-- Placeholder Upload -->
						<div v-else class="flex flex-col items-center">
							<Icon name="lucide:image-plus" class="size-8 text-[var(--text-muted)]" />
							<span class="mt-1 text-xs text-[var(--text-muted)]">Selecionar</span>
						</div>

						<!-- Ícone de zoom quando tem imagem -->
						<div
							v-if="modelValue && !isCompressing"
							class="absolute inset-0 flex items-center justify-center rounded-xl bg-black/0 transition-all hover:bg-black/40"
						>
							<Icon
								name="lucide:zoom-in"
								class="size-6 text-white opacity-0 transition-opacity group-hover:opacity-100"
							/>
						</div>
					</div>

					<!-- Botão X vermelho no canto - FORA do container com overflow -->
					<button
						v-if="modelValue && !isCompressing && !disabled"
						type="button"
						class="absolute -right-2 -top-2 z-10 flex size-5 cursor-pointer items-center justify-center rounded-full bg-error-500 text-white shadow-sm hover:bg-error-600"
						title="Remover"
						@click.stop="removeImage"
					>
						<Icon name="lucide:x" class="size-3" />
					</button>
				</div>

				<!-- Texto abaixo do preview -->
				<p v-if="hint" class="text-center text-xs text-[var(--text-muted)]">{{ hint }}</p>
				<p v-else class="text-center text-xs text-[var(--text-muted)]">Fundo transparente</p>
			</div>

			<!-- Coluna direita: Botão/Input URL + textos de sugestão -->
			<div class="flex flex-col gap-2 flex-1 min-w-0">
				<!-- Tab Upload: Botão Alterar/Selecionar -->
				<button
					v-if="activeTab === 'upload' || modelValue"
					type="button"
					:disabled="isCompressing || disabled"
					class="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--primary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50"
					@click="handleChangeClick"
				>
					<Icon
						:name="modelValue && imageSource === 'url' ? 'lucide:link' : 'lucide:upload'"
						class="size-4"
					/>
					<span>{{ modelValue ? "Alterar" : "Selecionar" }}</span>
				</button>

				<!-- Tab URL sem imagem: Input de URL -->
				<div
					v-if="activeTab === 'url' && !modelValue"
					class="flex flex-col sm:flex-row items-stretch gap-2"
				>
					<UiInput
						v-model="tempUrl"
						placeholder="https://exemplo.com/logo.png"
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

				<!-- Textos de sugestão -->
				<div class="space-y-1 text-xs text-[var(--text-muted)]">
					<p>PNG, JPG ou SVG</p>
					<p>Recomendado: {{ maxSize }}x{{ maxSize }}px</p>
					<p v-if="formattedSize" class="font-medium text-[var(--text-secondary)]">
						Tamanho: {{ formattedSize }}
					</p>
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
		<p v-if="error" class="text-xs text-error-500">{{ error }}</p>

		<!-- Modal de Preview - só renderiza quando necessário E após hidratação -->
		<UiModal
			v-if="isMounted && showPreviewModal"
			v-model="showPreviewModal"
			title="Preview da Imagem"
			size="md"
		>
			<div class="flex flex-col items-center gap-4">
				<!-- Imagem em tamanho real (comprimida) -->
				<div
					:class="[
						'flex items-center justify-center rounded-xl border-2 border-[var(--border-default)] p-4',
						previewBgClass,
					]"
				>
					<img
						v-if="modelValue"
						:src="modelValue"
						alt="Preview completo"
						class="max-h-[400px] max-w-[400px] object-contain"
					/>
				</div>

				<!-- Info da imagem -->
				<p class="text-sm text-[var(--text-muted)]">
					Imagem otimizada: {{ maxSize }}x{{ maxSize }}px
				</p>
			</div>

			<template #footer>
				<UiButton variant="outline" @click="showPreviewModal = false">Fechar</UiButton>
			</template>
		</UiModal>
	</div>
</template>
