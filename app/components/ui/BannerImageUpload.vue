<script setup lang="ts">
/**
 * 📌 BannerImageUpload
 * Componente com editor de crop para banners 16:9
 */

import imageCompression from "browser-image-compression";
import { Cropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";

interface Props {
	modelValue: string;
	label?: string;
	error?: string;
	disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	label: "Imagem do Banner",
	error: undefined,
	disabled: false,
});

const emit = defineEmits<{
	"update:modelValue": [value: string];
}>();

// Constantes - Proporção 16:9 (padrão universal)
const MIN_WIDTH = 1280;
const MIN_HEIGHT = 720; // 16:9
const RECOMMENDED_WIDTH = 1920;
const RECOMMENDED_HEIGHT = 1080; // 16:9
const MAX_SIZE_KB = 300;
const SAFE_ZONE_PERCENT = 70;

const BREAKPOINTS = [
	{ name: "Mobile XS", width: 320, label: "320px" },
	{ name: "Mobile SM", width: 375, label: "375px" },
	{ name: "Mobile MD", width: 428, label: "428px" },
	{ name: "Tablet", width: 768, label: "768px" },
	{ name: "Desktop", width: 1024, label: "1024px" },
	{ name: "Desktop XL", width: 1440, label: "1440px" },
	{ name: "Full HD", width: 1920, label: "1920px" },
] as const;

type Breakpoint = (typeof BREAKPOINTS)[number];

// Estado
const fileInputRef = ref<HTMLInputElement | null>(null);
const cropperRef = ref<InstanceType<typeof Cropper> | null>(null);
const isProcessing = ref(false);
const showCropModal = ref(false);
const showPreviewModal = ref(false);
const selectedBreakpoint = ref<Breakpoint>(BREAKPOINTS[6]);
const imageSize = ref<number | null>(null);
const imageDimensions = ref<{ width: number; height: number } | null>(null);
const showSafeZone = ref(true);
const tempImageSrc = ref<string>("");
const imageLoaded = ref(false); // Novo: controla se a imagem foi carregada no cropper

// Tabs para escolher modo de inserção
const activeTab = ref<"upload" | "url">("upload");
const tempUrl = ref("");

const tabs = [
	{ key: "upload", id: "upload", label: "Upload", icon: "lucide:upload" },
	{ key: "url", id: "url", label: "URL", icon: "lucide:link" },
];

// Computadas
const formattedSize = computed(() => {
	if (!imageSize.value) return null;
	if (imageSize.value < 1024) return `${imageSize.value} B`;
	return `${(imageSize.value / 1024).toFixed(1)} KB`;
});

const sizeStatus = computed(() => {
	if (!imageSize.value) return null;
	const sizeKB = imageSize.value / 1024;
	if (sizeKB <= MAX_SIZE_KB) return "success";
	if (sizeKB <= MAX_SIZE_KB * 1.5) return "warning";
	return "error";
});

const safeZoneDimensions = computed(() => {
	const width = SAFE_ZONE_PERCENT;
	const height = SAFE_ZONE_PERCENT;
	const offsetX = (100 - width) / 2;
	const offsetY = (100 - height) / 2;

	return {
		width: `${width}%`,
		height: `${height}%`,
		left: `${offsetX}%`,
		top: `${offsetY}%`,
	};
});

// Funções auxiliares
const calculateBase64Size = (base64: string): number => {
	const base64Data = base64.split(",")[1] || base64;
	return Math.round((base64Data.length * 3) / 4);
};

const canvasToBase64 = (canvas: HTMLCanvasElement): Promise<string> => {
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (!blob) {
					reject(new Error("Erro ao converter canvas"));
					return;
				}

				const reader = new FileReader();
				reader.onload = (e) => resolve(e.target?.result as string);
				reader.onerror = reject;
				reader.readAsDataURL(blob);
			},
			"image/webp",
			0.9,
		);
	});
};

const compressImage = async (file: File): Promise<string> => {
	const options = {
		maxSizeMB: MAX_SIZE_KB / 1024,
		maxWidthOrHeight: RECOMMENDED_WIDTH,
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

// Handlers
const triggerFileInput = (): void => {
	if (props.disabled || isProcessing.value) return;
	fileInputRef.value?.click();
};

const handleFileSelect = async (event: Event): Promise<void> => {
	const input = event.target as HTMLInputElement;
	const file = input.files?.[0];

	if (!file) return;

	try {
		const url = URL.createObjectURL(file);
		tempImageSrc.value = url;
		showCropModal.value = true;
	} catch (error) {
		console.error("Erro ao carregar imagem:", error);
		alert(
			`Erro ao carregar imagem: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
		);
	} finally {
		input.value = "";
	}
};

/**
 * Baixa imagem de URL através do proxy e abre o crop
 */
const loadImageFromUrl = async (): Promise<void> => {
	if (!tempUrl.value) return;

	isProcessing.value = true;

	try {
		// Usa o proxy do servidor para contornar CORS
		const proxyUrl = `/api/proxy/fetch?url=${encodeURIComponent(tempUrl.value)}`;

		// Usa XMLHttpRequest para evitar interceptores do Nuxt/fetch
		const blob = await new Promise<Blob>((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.open("GET", proxyUrl, true);
			xhr.responseType = "blob";

			xhr.onload = () => {
				if (xhr.status === 200) {
					resolve(xhr.response as Blob);
				} else {
					reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
				}
			};

			xhr.onerror = () => reject(new Error("Erro na requisição"));
			xhr.send();
		});

		// Verifica se é realmente uma imagem
		if (!blob.type.startsWith("image/")) {
			throw new Error("O arquivo baixado não é uma imagem válida");
		}

		// Verifica se o blob não está vazio
		if (blob.size === 0 || blob.size < 100) {
			throw new Error(`Imagem muito pequena ou vazia (${blob.size} bytes)`);
		}

		// Cria URL temporária
		const url = URL.createObjectURL(blob);

		// Define a imagem e aguarda um tick antes de abrir o modal
		tempImageSrc.value = url;

		// Aguarda o próximo tick para garantir que o DOM foi atualizado
		await nextTick();

		// Abre o modal
		showCropModal.value = true;

		// Limpa o input
		tempUrl.value = "";
	} catch (error) {
		console.error("Erro ao baixar imagem:", error);
		alert(
			`Erro ao processar imagem: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
		);
	} finally {
		isProcessing.value = false;
	}
};

const applyCrop = async (): Promise<void> => {
	if (!cropperRef.value) return;

	isProcessing.value = true;

	try {
		const { canvas } = cropperRef.value.getResult();

		if (!canvas) {
			throw new Error("Erro ao processar crop");
		}

		// Cria um novo canvas com o tamanho ideal (1920x1080)
		const targetCanvas = document.createElement("canvas");
		targetCanvas.width = RECOMMENDED_WIDTH;
		targetCanvas.height = RECOMMENDED_HEIGHT;

		const ctx = targetCanvas.getContext("2d");
		if (!ctx) {
			throw new Error("Erro ao criar contexto do canvas");
		}

		// Desenha a imagem cropada redimensionada para o tamanho ideal
		ctx.drawImage(canvas, 0, 0, RECOMMENDED_WIDTH, RECOMMENDED_HEIGHT);

		// Armazena dimensões finais
		imageDimensions.value = { width: RECOMMENDED_WIDTH, height: RECOMMENDED_HEIGHT };

		// Converte canvas para base64
		const base64 = await canvasToBase64(targetCanvas);

		// Comprime
		const blob = await fetch(base64).then((r) => r.blob());
		const file = new File([blob], "banner.webp", { type: "image/webp" });

		const compressed = await compressImage(file);
		imageSize.value = calculateBase64Size(compressed);

		// Emite valor
		emit("update:modelValue", compressed);

		showCropModal.value = false;
		URL.revokeObjectURL(tempImageSrc.value);
		tempImageSrc.value = "";
	} catch (error) {
		console.error("Erro ao processar crop:", error);
		alert(
			`Erro ao processar imagem: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
		);
	} finally {
		isProcessing.value = false;
	}
};

const cancelCrop = (): void => {
	showCropModal.value = false;
	imageLoaded.value = false;
	URL.revokeObjectURL(tempImageSrc.value);
	tempImageSrc.value = "";
};

const handleRemove = (): void => {
	if (props.disabled) return;
	emit("update:modelValue", "");
	imageSize.value = null;
	imageDimensions.value = null;
};

const handlePreviewClick = (): void => {
	if (!props.modelValue || isProcessing.value || props.disabled) return;
	showPreviewModal.value = true;
};

// Watchers
watch(
	() => props.modelValue,
	(newValue) => {
		if (newValue) {
			imageSize.value = calculateBase64Size(newValue);
		} else {
			imageSize.value = null;
			imageDimensions.value = null;
		}
	},
	{ immediate: true },
);

// Lifecycle
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

		<!-- Tabs para escolher modo de inserção -->
		<UiTabs v-model="activeTab" :tabs="tabs" size="sm" />

		<!-- Preview e Controles -->
		<div class="flex flex-col sm:flex-row items-start gap-4">
			<!-- Preview Container -->
			<div class="flex flex-col items-center gap-2 flex-shrink-0">
				<!-- Preview da imagem (16:9 - padrão universal) -->
				<div class="relative">
					<div
						:class="[
							'relative flex h-[135px] w-[240px] shrink-0 items-center justify-center rounded-lg border-2 transition-all overflow-hidden bg-[var(--bg-muted)]',
							modelValue
								? 'border-[var(--border-default)] cursor-pointer hover:border-[var(--primary)]'
								: 'border-dashed border-[var(--border-default)]',
							error ? 'border-error-500' : '',
							!modelValue &&
								!isProcessing &&
								!disabled &&
								'cursor-pointer hover:border-[var(--primary)]',
							disabled && 'opacity-60 cursor-not-allowed',
						]"
						@click="handlePreviewClick"
					>
						<!-- Loading -->
						<div v-if="isProcessing" class="flex flex-col items-center gap-2">
							<Icon name="lucide:loader-2" class="size-8 animate-spin text-[var(--primary)]" />
							<span class="text-xs text-[var(--text-muted)]">Processando...</span>
						</div>

						<!-- Imagem -->
						<img
							v-else-if="modelValue"
							:src="modelValue"
							alt="Preview do banner"
							class="absolute inset-0 w-full h-full object-cover"
						/>

						<!-- Placeholder -->
						<div v-else class="flex flex-col items-center gap-2">
							<Icon name="lucide:image-plus" class="size-8 text-[var(--text-muted)]" />
							<span class="text-xs text-[var(--text-muted)] text-center px-2">
								Clique para selecionar
							</span>
						</div>

						<!-- Ícone de zoom -->
						<div
							v-if="modelValue && !isProcessing"
							class="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-all"
						>
							<Icon
								name="lucide:zoom-in"
								class="size-6 text-white opacity-0 hover:opacity-100 transition-opacity"
							/>
						</div>
					</div>

					<!-- Botão remover -->
					<button
						v-if="modelValue && !isProcessing && !disabled"
						type="button"
						class="absolute -right-2 -top-2 z-10 flex size-6 items-center justify-center rounded-full bg-error-500 text-white shadow-md hover:bg-error-600 transition-colors"
						title="Remover imagem"
						@click.stop="handleRemove"
					>
						<Icon name="lucide:x" class="size-3.5" />
					</button>
				</div>

				<!-- Info abaixo do preview -->
				<div class="text-center space-y-0.5">
					<p class="text-xs text-[var(--text-muted)]">Proporção 16:9</p>
					<p v-if="imageDimensions" class="text-xs font-medium text-[var(--text-secondary)]">
						{{ imageDimensions.width }}x{{ imageDimensions.height }}px
					</p>
				</div>
			</div>

			<!-- Coluna de informações -->
			<div class="flex flex-col gap-3 flex-1 min-w-0">
				<!-- Tab Upload: Botão de upload -->
				<button
					v-if="activeTab === 'upload'"
					type="button"
					:disabled="isProcessing || disabled"
					class="flex items-center justify-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-muted)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--primary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50"
					@click="triggerFileInput"
				>
					<Icon name="lucide:upload" class="size-4" />
					<span>{{ modelValue ? "Alterar Imagem" : "Selecionar Imagem" }}</span>
				</button>

				<!-- Tab URL: Input de URL -->
				<div v-if="activeTab === 'url'" class="flex flex-col sm:flex-row items-stretch gap-2">
					<UiInput
						v-model="tempUrl"
						placeholder="https://exemplo.com/banner.jpg"
						icon="lucide:link"
						class="flex-1 min-w-0"
						:disabled="isProcessing || disabled"
					/>
					<UiButton
						:disabled="!tempUrl || isProcessing || disabled"
						:loading="isProcessing"
						icon="lucide:check"
						class="h-auto shrink-0 px-3"
						@click="loadImageFromUrl"
					>
						Aplicar
					</UiButton>
				</div>

				<!-- Especificações -->
				<div class="space-y-1.5 text-xs">
					<div class="flex items-center gap-2 text-[var(--text-muted)]">
						<Icon name="lucide:check-circle-2" class="size-3.5 text-success-600" />
						<span>Formatos: PNG, JPG, WebP, SVG</span>
					</div>
					<div class="flex items-center gap-2 text-[var(--text-muted)]">
						<Icon name="lucide:check-circle-2" class="size-3.5 text-success-600" />
						<span>Recomendado: {{ RECOMMENDED_WIDTH }}x{{ RECOMMENDED_HEIGHT }}px</span>
					</div>
					<div class="flex items-center gap-2 text-[var(--text-muted)]">
						<Icon name="lucide:check-circle-2" class="size-3.5 text-success-600" />
						<span>Mínimo após crop: {{ MIN_WIDTH }}x{{ MIN_HEIGHT }}px</span>
					</div>
					<div class="flex items-center gap-2 text-[var(--text-muted)]">
						<Icon name="lucide:check-circle-2" class="size-3.5 text-success-600" />
						<span>Proporção: 16:9 (padrão universal)</span>
					</div>
					<div
						class="flex items-center gap-2 text-[var(--info)] mt-2 pt-2 border-t border-[var(--border-muted)]"
					>
						<Icon name="lucide:info" class="size-3.5 flex-shrink-0" />
						<span>Banner exibido como faixa horizontal no cardápio</span>
					</div>
				</div>

				<!-- Tamanho do arquivo -->
				<div v-if="formattedSize" class="flex items-center gap-2">
					<Icon
						:name="
							sizeStatus === 'success'
								? 'lucide:check-circle-2'
								: sizeStatus === 'warning'
									? 'lucide:alert-triangle'
									: 'lucide:alert-octagon'
						"
						:class="[
							'size-4',
							sizeStatus === 'success' && 'text-success-600',
							sizeStatus === 'warning' && 'text-warning-600',
							sizeStatus === 'error' && 'text-error-600',
						]"
					/>
					<span
						:class="[
							'text-xs font-medium',
							sizeStatus === 'success' && 'text-success-600',
							sizeStatus === 'warning' && 'text-warning-600',
							sizeStatus === 'error' && 'text-error-600',
						]"
					>
						Tamanho: {{ formattedSize }}
					</span>
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

		<!-- Modal de Crop (z-index 110 - maior que drawer 100) -->
		<Teleport v-if="isMounted && showCropModal" to="body">
			<Transition
				name="modal-overlay"
				enter-active-class="transition-opacity duration-200 ease-out"
				enter-from-class="opacity-0"
				enter-to-class="opacity-100"
				leave-active-class="transition-opacity duration-150 ease-in"
				leave-from-class="opacity-100"
				leave-to-class="opacity-0"
			>
				<div
					v-if="showCropModal"
					class="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm"
					@click="cancelCrop"
				></div>
			</Transition>

			<Transition
				name="modal-content"
				enter-active-class="transition-all duration-200 ease-out"
				enter-from-class="opacity-0 scale-95"
				enter-to-class="opacity-100 scale-100"
				leave-active-class="transition-all duration-150 ease-in"
				leave-from-class="opacity-100 scale-100"
				leave-to-class="opacity-0 scale-95"
			>
				<div
					v-if="showCropModal"
					class="fixed z-[110] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg shadow-xl max-h-[85vh] w-full mx-4 max-w-lg overflow-hidden flex flex-col"
					role="dialog"
					aria-modal="true"
					@click.stop
				>
					<!-- Header -->
					<div class="px-6 py-4 border-b border-[var(--border-muted)] flex-shrink-0">
						<div class="flex items-center justify-between">
							<h2 class="text-heading-4 text-[var(--text-primary)]">Ajustar Imagem (16:9)</h2>
							<button
								type="button"
								class="ml-4 p-2 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors duration-200 focus-ring flex items-center justify-center"
								@click="cancelCrop"
							>
								<Icon name="lucide:x" class="w-5 h-5" />
							</button>
						</div>
					</div>

					<!-- Content -->
					<div class="px-6 py-4 flex-1 overflow-y-auto custom-scrollbar">
						<div class="space-y-4">
							<!-- Info -->
							<UiCard variant="outlined" class="bg-[var(--info-light)] border-[var(--info)]">
								<div class="flex gap-3">
									<Icon name="lucide:info" class="size-5 text-[var(--info)] flex-shrink-0 mt-0.5" />
									<div class="space-y-1">
										<p class="text-sm font-medium text-[var(--text-primary)]">
											Ajuste a área do banner
										</p>
										<p class="text-xs text-[var(--text-secondary)]">
											Selecione a área que deseja exibir no banner. A proporção 16:9 (padrão
											universal) será mantida automaticamente.
										</p>
									</div>
								</div>
							</UiCard>

							<!-- Cropper -->
							<div
								class="border-2 border-[var(--border-default)] rounded-lg overflow-hidden bg-[var(--bg-surface)]"
							>
								<Cropper
									ref="cropperRef"
									:src="tempImageSrc"
									:stencil-props="{
										aspectRatio: 16 / 9,
										movable: true,
										resizable: true,
									}"
									:resize-image="{
										adjustStencil: false,
									}"
									:default-size="{
										width: 400,
										height: 225,
									}"
									class="h-[280px]"
								/>
							</div>
						</div>
					</div>

					<!-- Footer -->
					<div
						class="px-6 py-4 border-t border-[var(--border-muted)] flex-shrink-0 bg-[var(--bg-surface)] rounded-b-lg"
					>
						<div class="flex gap-3 justify-end">
							<UiButton variant="outline" :disabled="isProcessing" @click="cancelCrop">
								Cancelar
							</UiButton>
							<UiButton variant="solid" :loading="isProcessing" @click="applyCrop">
								Aplicar Crop
							</UiButton>
						</div>
					</div>
				</div>
			</Transition>
		</Teleport>

		<!-- Modal de Preview -->
		<UiModal
			v-if="isMounted && showPreviewModal"
			v-model="showPreviewModal"
			title="Preview do Banner"
			size="xl"
		>
			<div class="space-y-4">
				<!-- Seletor de Breakpoint -->
				<div class="flex flex-wrap items-center gap-2">
					<span class="text-sm font-medium text-[var(--text-primary)]">Visualizar em:</span>
					<div class="flex flex-wrap gap-2">
						<button
							v-for="breakpoint in BREAKPOINTS"
							:key="breakpoint.width"
							type="button"
							:class="[
								'px-3 py-1.5 text-xs font-medium rounded-lg border transition-all',
								selectedBreakpoint.width === breakpoint.width
									? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]'
									: 'border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:bg-[var(--bg-hover)]',
							]"
							@click="selectedBreakpoint = breakpoint"
						>
							{{ breakpoint.label }}
						</button>
					</div>
				</div>

				<!-- Toggle Safe Zone -->
				<div class="flex items-center gap-2">
					<UiSwitch v-model="showSafeZone" />
					<label
						class="text-sm text-[var(--text-secondary)] cursor-pointer"
						@click="showSafeZone = !showSafeZone"
					>
						Mostrar Safe Zone (70% central)
					</label>
				</div>

				<!-- Preview Container -->
				<div class="border-2 border-[var(--border-default)] rounded-lg p-4 bg-gray-50">
					<div
						class="mx-auto relative overflow-hidden rounded-lg shadow-lg"
						:style="{ maxWidth: `${selectedBreakpoint.width}px` }"
					>
						<!-- Imagem -->
						<img
							v-if="modelValue"
							:src="modelValue"
							:alt="`Preview em ${selectedBreakpoint.label}`"
							class="w-full h-auto object-cover"
						/>

						<!-- Safe Zone Overlay -->
						<div
							v-if="showSafeZone"
							class="absolute border-2 border-dashed border-success-500 bg-success-500/10 pointer-events-none"
							:style="{
								width: safeZoneDimensions.width,
								height: safeZoneDimensions.height,
								left: safeZoneDimensions.left,
								top: safeZoneDimensions.top,
							}"
						>
							<div
								class="absolute top-2 left-2 bg-success-600 text-white text-xs px-2 py-1 rounded"
							>
								Safe Zone
							</div>
						</div>
					</div>

					<!-- Info do breakpoint -->
					<div class="mt-3 text-center">
						<p class="text-sm font-medium text-[var(--text-primary)]">
							{{ selectedBreakpoint.name }}
						</p>
						<p class="text-xs text-[var(--text-muted)]">
							Largura: {{ selectedBreakpoint.width }}px
						</p>
					</div>
				</div>

				<!-- Dica sobre Safe Zone -->
				<UiCard variant="outlined" class="bg-[var(--info-light)] border-[var(--info)]">
					<div class="flex gap-3">
						<Icon name="lucide:info" class="size-5 text-[var(--info)] flex-shrink-0 mt-0.5" />
						<div class="space-y-1">
							<p class="text-sm font-medium text-[var(--text-primary)]">Sobre a Safe Zone</p>
							<p class="text-xs text-[var(--text-secondary)]">
								A área destacada (70% central) garante que textos e botões importantes fiquem
								visíveis em todos os dispositivos. Posicione elementos críticos dentro desta zona.
							</p>
						</div>
					</div>
				</UiCard>
			</div>

			<template #footer>
				<UiButton variant="outline" @click="showPreviewModal = false">Fechar</UiButton>
			</template>
		</UiModal>
	</div>
</template>
