<script setup lang="ts">
/**
 * 📌 BannerForm
 *
 * Formulário para criar/editar banners com preview em tempo real.
 * Suporta upload de imagens e personalização visual.
 */

import { toTypedSchema } from "@vee-validate/zod";
import { bannerSchema } from "#shared/schemas/marketing";
import { useBanners } from "../../composables/useBanners";
import type {
	BannerFormData,
	TipoBanner,
	TipoConteudoBanner,
	TipoPosicaoTexto,
} from "#shared/types/marketing";

interface Props {
	initialData?: Partial<BannerFormData>;
	loading?: boolean;
}

interface Emits {
	submit: [data: BannerFormData];
	cancel: [];
}

const props = withDefaults(defineProps<Props>(), {
	initialData: () => ({}),
	loading: false,
});

const emit = defineEmits<Emits>();

// ========================================
// COMPOSABLES
// ========================================

const { uploadBannerImage } = useBanners();

// ========================================
// FORMULÁRIO
// ========================================

const validationSchema = toTypedSchema(bannerSchema);

const { handleSubmit, values, setFieldValue } = useForm({
	validationSchema,
	initialValues: {
		titulo: props.initialData?.titulo || "",
		descricao: props.initialData?.descricao || "",
		tipo: props.initialData?.tipo || "carrossel",
		tipo_conteudo: props.initialData?.tipo_conteudo || "imagem",
		imagem_url: props.initialData?.imagem_url || "",
		link_url: props.initialData?.link_url || "",
		cor_fundo: props.initialData?.cor_fundo || "#ffffff",
		cor_texto: props.initialData?.cor_texto || "#000000",
		texto_cta: props.initialData?.texto_cta || "",
		texto_posicao: props.initialData?.texto_posicao || "centro",
		texto_cor_fundo: props.initialData?.texto_cor_fundo || "#000000",
	},
});

// ========================================
// ESTADO LOCAL
// ========================================

const uploadingImage = ref(false);
const imagePreview = ref<string>("");

// ========================================
// OPÇÕES DOS SELECTS
// ========================================

const tipoOptions = [
	{
		label: "Carrossel",
		value: "carrossel" as TipoBanner,
		description: "Banner rotativo principal",
		icon: "lucide:image",
	},
	{
		label: "Destaque",
		value: "destaque" as TipoBanner,
		description: "Banner de destaque fixo",
		icon: "lucide:star",
	},
	{
		label: "Popup",
		value: "popup" as TipoBanner,
		description: "Banner em popup modal",
		icon: "lucide:square",
	},
];

const tipoConteudoOptions = [
	{
		label: "Apenas Imagem",
		value: "imagem" as TipoConteudoBanner,
		description: "Somente imagem",
		icon: "lucide:image",
	},
	{
		label: "Apenas Texto",
		value: "texto" as TipoConteudoBanner,
		description: "Somente texto",
		icon: "lucide:type",
	},
	{
		label: "Imagem + Texto",
		value: "misto" as TipoConteudoBanner,
		description: "Imagem com texto",
		icon: "lucide:layout-template",
	},
];

const posicaoTextoOptions = [
	{ label: "Centro", value: "centro" as TipoPosicaoTexto },
	{ label: "Esquerda", value: "esquerda" as TipoPosicaoTexto },
	{ label: "Direita", value: "direita" as TipoPosicaoTexto },
	{ label: "Superior", value: "superior" as TipoPosicaoTexto },
	{ label: "Inferior", value: "inferior" as TipoPosicaoTexto },
];

// ========================================
// COMPUTADAS
// ========================================

/**
 * Valor da descrição garantindo que seja sempre string
 */
const descricaoValue = computed({
	get: () => values.descricao || "",
	set: (value: string) => setFieldValue("descricao", value || undefined),
});

/**
 * Verifica se deve mostrar campos de imagem
 */
const showImageFields = computed(() => {
	return values.tipo_conteudo === "imagem" || values.tipo_conteudo === "misto";
});

/**
 * Verifica se deve mostrar campos de texto
 */
const showTextFields = computed(() => {
	return values.tipo_conteudo === "texto" || values.tipo_conteudo === "misto";
});

/**
 * Estilo do preview
 */
const previewStyle = computed(() => {
	const style: Record<string, string> = {};

	if (values.cor_fundo) {
		style.backgroundColor = values.cor_fundo;
	}

	if (values.cor_texto) {
		style.color = values.cor_texto;
	}

	return style;
});

// ========================================
// HANDLERS
// ========================================

/**
 * Handler para upload de imagem
 */
const handleImageUpload = async (event: Event): Promise<void> => {
	const target = event.target as HTMLInputElement;
	const file = target.files?.[0];

	if (!file) return;

	try {
		uploadingImage.value = true;
		const imageUrl = await uploadBannerImage(file);
		setFieldValue("imagem_url", imageUrl);
		imagePreview.value = imageUrl;
	} catch (error) {
		console.error("Erro no upload:", error);
	} finally {
		uploadingImage.value = false;
	}
};

/**
 * Handler para remover imagem
 */
const handleRemoveImage = (): void => {
	setFieldValue("imagem_url", "");
	imagePreview.value = "";
};

/**
 * Handler para submissão do formulário
 */
const onSubmit = handleSubmit((formData) => {
	emit("submit", formData as BannerFormData);
});

/**
 * Handler para cancelar
 */
const handleCancel = (): void => {
	emit("cancel");
};

// ========================================
// WATCHERS
// ========================================

// Sincronizar preview da imagem
watch(
	() => values.imagem_url,
	(newUrl) => {
		if (newUrl && newUrl !== imagePreview.value) {
			imagePreview.value = newUrl;
		}
	},
);

// ========================================
// INICIALIZAÇÃO
// ========================================

onMounted(() => {
	if (props.initialData?.imagem_url) {
		imagePreview.value = props.initialData.imagem_url;
	}
});
</script>

<template>
	<form class="space-y-6" @submit="onSubmit">
		<!-- Informações Básicas -->
		<div class="space-y-4">
			<h3 class="text-lg font-medium text-[var(--text-primary)]">Informações Básicas</h3>

			<!-- Título -->
			<UiFormField name="titulo" label="Título do Banner" required>
				<UiInput name="titulo" placeholder="Ex: Promoção de Verão" maxlength="100" />
			</UiFormField>

			<!-- Descrição -->
			<UiFormField name="descricao" label="Descrição">
				<UiTextarea
					v-model="descricaoValue"
					placeholder="Descrição opcional do banner"
					:rows="3"
					:maxlength="200"
				/>
			</UiFormField>

			<!-- Tipo do Banner -->
			<UiFormField name="tipo" label="Tipo do Banner" required>
				<div class="grid grid-cols-3 gap-3">
					<div v-for="option in tipoOptions" :key="option.value" class="relative">
						<input
							:id="`tipo-${option.value}`"
							v-model="values.tipo"
							:value="option.value"
							type="radio"
							name="tipo"
							class="peer sr-only"
						/>
						<label
							:for="`tipo-${option.value}`"
							class="flex flex-col items-center justify-center p-4 border-2 border-[var(--border-default)] rounded-lg cursor-pointer transition-all duration-200 hover:border-[var(--primary)] hover:bg-[var(--primary-light)] peer-checked:border-[var(--primary)] peer-checked:bg-[var(--primary-light)] peer-checked:text-[var(--primary)]"
						>
							<!-- Ícone -->
							<Icon :name="option.icon" class="w-6 h-6 mb-2" />

							<!-- Título -->
							<span class="font-medium text-sm text-center leading-tight">
								{{ option.label }}
							</span>

							<!-- Descrição -->
							<span class="text-xs text-[var(--text-muted)] text-center mt-1">
								{{ option.description }}
							</span>

							<!-- Indicador de seleção -->
							<div
								class="absolute top-2 right-2 w-4 h-4 rounded-full border-2 border-[var(--border-default)] bg-white peer-checked:border-[var(--primary)] peer-checked:bg-[var(--primary)] transition-all duration-200"
							>
								<Icon
									name="lucide:check"
									class="w-2.5 h-2.5 text-white absolute top-0.5 left-0.5 opacity-0 peer-checked:opacity-100 transition-opacity duration-200"
								/>
							</div>
						</label>
					</div>
				</div>
			</UiFormField>

			<!-- Tipo de Conteúdo -->
			<UiFormField name="tipo_conteudo" label="Tipo de Conteúdo" required>
				<div class="grid grid-cols-3 gap-3">
					<div v-for="option in tipoConteudoOptions" :key="option.value" class="relative">
						<input
							:id="`tipo-conteudo-${option.value}`"
							v-model="values.tipo_conteudo"
							:value="option.value"
							type="radio"
							name="tipo_conteudo"
							class="peer sr-only"
						/>
						<label
							:for="`tipo-conteudo-${option.value}`"
							class="flex flex-col items-center justify-center p-4 border-2 border-[var(--border-default)] rounded-lg cursor-pointer transition-all duration-200 hover:border-[var(--primary)] hover:bg-[var(--primary-light)] peer-checked:border-[var(--primary)] peer-checked:bg-[var(--primary-light)] peer-checked:text-[var(--primary)]"
						>
							<!-- Ícone -->
							<Icon :name="option.icon" class="w-6 h-6 mb-2" />

							<!-- Título -->
							<span class="font-medium text-sm text-center leading-tight">
								{{ option.label }}
							</span>

							<!-- Descrição -->
							<span class="text-xs text-[var(--text-muted)] text-center mt-1">
								{{ option.description }}
							</span>

							<!-- Indicador de seleção -->
							<div
								class="absolute top-2 right-2 w-4 h-4 rounded-full border-2 border-[var(--border-default)] bg-white peer-checked:border-[var(--primary)] peer-checked:bg-[var(--primary)] transition-all duration-200"
							>
								<Icon
									name="lucide:check"
									class="w-2.5 h-2.5 text-white absolute top-0.5 left-0.5 opacity-0 peer-checked:opacity-100 transition-opacity duration-200"
								/>
							</div>
						</label>
					</div>
				</div>
			</UiFormField>
		</div>

		<!-- Configurações de Imagem -->
		<div v-if="showImageFields" class="space-y-4">
			<h3 class="text-lg font-medium text-[var(--text-primary)]">Imagem</h3>

			<!-- Upload de Imagem -->
			<div class="space-y-3">
				<label class="block text-sm font-medium text-[var(--text-primary)]">
					Imagem do Banner
				</label>

				<!-- Preview da imagem -->
				<div v-if="imagePreview" class="relative">
					<img
						:src="imagePreview"
						alt="Preview"
						class="w-full h-32 object-cover rounded-lg border border-[var(--border-default)]"
					/>
					<UiButton
						type="button"
						variant="solid"
						size="sm"
						class="absolute top-2 right-2"
						@click="handleRemoveImage"
					>
						<Icon name="lucide:x" class="w-4 h-4" />
					</UiButton>
				</div>

				<!-- Input de upload -->
				<div class="flex items-center gap-3">
					<input
						id="banner-image"
						type="file"
						accept="image/*"
						class="hidden"
						@change="handleImageUpload"
					/>
					<label
						for="banner-image"
						class="cursor-pointer inline-flex items-center px-4 py-2 border border-[var(--border-default)] rounded-lg text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-default)] hover:bg-[var(--bg-hover)] transition-colors"
					>
						<Icon name="lucide:upload" class="w-4 h-4 mr-2" />
						{{ uploadingImage ? "Enviando..." : "Escolher Imagem" }}
					</label>
					<span class="text-xs text-[var(--text-muted)]"> PNG, JPG até 5MB </span>
				</div>
			</div>

			<!-- URL da Imagem (alternativa) -->
			<UiFormField name="imagem_url" label="URL da Imagem (alternativa)">
				<UiInput name="imagem_url" placeholder="https://exemplo.com/imagem.jpg" type="url" />
			</UiFormField>

			<!-- Link do Banner -->
			<UiFormField name="link_url" label="Link de Destino">
				<UiInput name="link_url" placeholder="https://exemplo.com/promocao" type="url" />
			</UiFormField>
		</div>

		<!-- Configurações de Texto -->
		<div v-if="showTextFields" class="space-y-4">
			<h3 class="text-lg font-medium text-[var(--text-primary)]">Personalização Visual</h3>

			<!-- Cores -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<UiFormField name="cor_fundo" label="Cor de Fundo">
					<input
						v-model="values.cor_fundo"
						type="color"
						class="w-full h-12 border border-[var(--border-default)] rounded-lg cursor-pointer"
					/>
				</UiFormField>

				<UiFormField name="cor_texto" label="Cor do Texto">
					<input
						v-model="values.cor_texto"
						type="color"
						class="w-full h-12 border border-[var(--border-default)] rounded-lg cursor-pointer"
					/>
				</UiFormField>
			</div>

			<!-- Texto CTA -->
			<UiFormField name="texto_cta" label="Texto do Botão (CTA)">
				<UiInput name="texto_cta" placeholder="Ex: Comprar Agora" maxlength="50" />
			</UiFormField>

			<!-- Posição do Texto -->
			<UiFormField name="texto_posicao" label="Posição do Texto">
				<UiSelect name="texto_posicao" :options="posicaoTextoOptions" />
			</UiFormField>

			<!-- Cor de Fundo do Texto -->
			<UiFormField name="texto_cor_fundo" label="Cor de Fundo do Texto">
				<input
					v-model="values.texto_cor_fundo"
					type="color"
					class="w-full h-12 border border-[var(--border-default)] rounded-lg cursor-pointer"
				/>
			</UiFormField>
		</div>

		<!-- Preview do Banner -->
		<div class="space-y-4">
			<h3 class="text-lg font-medium text-[var(--text-primary)]">Preview</h3>

			<div class="border border-[var(--border-default)] rounded-lg p-4">
				<div class="relative h-32 rounded-lg overflow-hidden" :style="previewStyle">
					<!-- Preview com imagem -->
					<div v-if="imagePreview && showImageFields" class="relative h-full">
						<img :src="imagePreview" :alt="values.titulo" class="w-full h-full object-cover" />

						<!-- Overlay de texto se for misto -->
						<div
							v-if="values.tipo_conteudo === 'misto' && (values.titulo || values.texto_cta)"
							class="absolute inset-0 flex items-center justify-center"
							:style="{ backgroundColor: values.texto_cor_fundo + '40' }"
						>
							<div class="text-center" :style="{ color: values.cor_texto }">
								<div v-if="values.titulo" class="font-medium text-lg mb-2">
									{{ values.titulo }}
								</div>
								<div
									v-if="values.texto_cta"
									class="px-4 py-2 rounded-lg text-sm font-medium"
									:style="{ backgroundColor: values.texto_cor_fundo, color: values.cor_fundo }"
								>
									{{ values.texto_cta }}
								</div>
							</div>
						</div>
					</div>

					<!-- Preview apenas texto -->
					<div v-else class="h-full flex items-center justify-center text-center p-4">
						<div>
							<div class="font-medium text-lg mb-2">{{ values.titulo || "Título do Banner" }}</div>
							<div
								v-if="values.texto_cta"
								class="px-4 py-2 rounded-lg text-sm font-medium inline-block"
								:style="{ backgroundColor: values.texto_cor_fundo, color: values.cor_fundo }"
							>
								{{ values.texto_cta }}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Ações -->
		<div class="flex gap-3 justify-end pt-6 border-t border-[var(--border-default)]">
			<UiButton type="button" variant="outline" @click="handleCancel"> Cancelar </UiButton>
			<UiButton type="submit" variant="solid" :loading="props.loading">
				{{ props.initialData ? "Atualizar" : "Criar" }} Banner
			</UiButton>
		</div>
	</form>
</template>
