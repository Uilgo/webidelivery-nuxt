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
import type { BannerFormData, TipoConteudoBanner, TipoPosicaoTexto } from "#shared/types/marketing";

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

const { bannersCount, bannerLimitStatus } = useBanners();

// Constantes de limites
const BANNER_LIMITS = {
	MIN: 3,
	IDEAL: 5,
	MAX: 8,
} as const;

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
		cor_texto: props.initialData?.cor_texto || "#ffffff",
		texto_cta: props.initialData?.texto_cta || "",
		texto_posicao: props.initialData?.texto_posicao || "centro",
		texto_cor_fundo: props.initialData?.texto_cor_fundo || "#000000",
	},
});

// ========================================
// ESTADO LOCAL
// ========================================

// Removido: uploadingImage, imagePreview (não mais necessário)

// ========================================
// OPÇÕES DOS SELECTS
// ========================================

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
	return values.tipo_conteudo === "imagem";
});

/**
 * Verifica se deve mostrar campos de texto
 */
const showTextFields = computed(() => {
	return values.tipo_conteudo === "texto";
});

/**
 * Verifica se deve mostrar campos de personalização de cores
 * Sempre true para tipo "texto"
 */
const showColorCustomization = computed(() => {
	return values.tipo_conteudo === "texto";
});

/**
 * Estilo do preview com fallback para design system
 */
const previewBackgroundColor = computed(() => {
	// Se não tem cor de fundo definida ou é branco, usa o design system
	if (!values.cor_fundo || values.cor_fundo === "#ffffff") {
		return "var(--bg-surface)";
	}
	return values.cor_fundo;
});

/**
 * Estilo do preview
 */
const _previewStyle = computed(() => {
	const style: Record<string, string> = {};

	if (values.cor_fundo) {
		style.backgroundColor = values.cor_fundo;
	}

	if (values.cor_texto) {
		style.color = values.cor_texto;
	}

	return style;
});

/**
 * Mensagem contextual baseada no status dos banners
 */
const statusMessage = computed(() => {
	const count = bannersCount.value;

	switch (bannerLimitStatus.value) {
		case "below-min":
			return `Você tem ${count} banner${count !== 1 ? "s" : ""}. Recomendamos criar pelo menos ${BANNER_LIMITS.MIN} para melhor rotação.`;
		case "optimal":
			return `Perfeito! Você está com ${count} banner${count !== 1 ? "s" : ""}, dentro do número ideal.`;
		case "at-max":
			return `Você tem ${count} banner${count !== 1 ? "s" : ""}. Está próximo do limite máximo de ${BANNER_LIMITS.MAX}.`;
		case "over-max":
			return `Atenção! Você atingiu o limite máximo de ${BANNER_LIMITS.MAX} banners.`;
		default:
			return "";
	}
});

// ========================================
// HANDLERS
// ========================================

// Removido: handleImageUpload, handleRemoveImage (não mais necessário)

/**
 * Handler para submissão do formulário
 */
const onSubmit = handleSubmit(
	(formData) => {
		emit("submit", formData as BannerFormData);
	},
	(_errors) => {
		// Silencioso - erros são mostrados automaticamente pelos campos
	},
);

/**
 * Handler para cancelar
 */
const handleCancel = (): void => {
	emit("cancel");
};

// ========================================
// WATCHERS
// ========================================

// Removido: watch de imagem_url (não mais necessário)

// ========================================
// INICIALIZAÇÃO
// ========================================

// Removido: onMounted para imagePreview (não mais necessário)
</script>

<template>
	<form class="space-y-6" @submit="onSubmit">
		<!-- Card Informativo de Especificações -->
		<div
			class="flex items-start gap-3 p-4 rounded-lg border-l-4"
			:class="{
				'bg-[var(--warning-light)] border-l-[var(--warning)]': bannerLimitStatus === 'below-min',
				'bg-[var(--success-light)] border-l-[var(--success)]': bannerLimitStatus === 'optimal',
				'bg-[var(--info-light)] border-l-[var(--info)]': bannerLimitStatus === 'at-max',
				'bg-[var(--error-light)] border-l-[var(--error)]': bannerLimitStatus === 'over-max',
			}"
		>
			<!-- Ícone -->
			<Icon
				:name="
					bannerLimitStatus === 'below-min'
						? 'lucide:alert-triangle'
						: bannerLimitStatus === 'optimal'
							? 'lucide:check-circle-2'
							: bannerLimitStatus === 'at-max'
								? 'lucide:info'
								: 'lucide:alert-octagon'
				"
				class="w-5 h-5 shrink-0 mt-0.5"
				:class="{
					'text-[var(--warning)]': bannerLimitStatus === 'below-min',
					'text-[var(--success)]': bannerLimitStatus === 'optimal',
					'text-[var(--info)]': bannerLimitStatus === 'at-max',
					'text-[var(--error)]': bannerLimitStatus === 'over-max',
				}"
			/>

			<!-- Conteúdo -->
			<div class="flex-1 space-y-2">
				<div class="flex items-center justify-between gap-4">
					<p class="text-sm font-medium text-[var(--text-primary)]">
						{{ statusMessage }}
					</p>
					<div class="text-right shrink-0">
						<div
							class="text-lg font-bold"
							:class="{
								'text-[var(--warning)]': bannerLimitStatus === 'below-min',
								'text-[var(--success)]': bannerLimitStatus === 'optimal',
								'text-[var(--info)]': bannerLimitStatus === 'at-max',
								'text-[var(--error)]': bannerLimitStatus === 'over-max',
							}"
						>
							{{ bannersCount }}/{{ BANNER_LIMITS.MAX }}
						</div>
					</div>
				</div>

				<!-- Especificações compactas -->
				<div class="flex items-center gap-4 text-xs text-[var(--text-muted)]">
					<span>Mínimo: {{ BANNER_LIMITS.MIN }}</span>
					<span class="text-[var(--success)]">Ideal: {{ BANNER_LIMITS.IDEAL }}</span>
					<span>Máximo: {{ BANNER_LIMITS.MAX }}</span>
				</div>
			</div>
		</div>

		<!-- Tipo de Conteúdo (MOVIDO PARA O TOPO) -->
		<div class="space-y-4">
			<h3 class="text-lg font-medium text-[var(--text-primary)]">Tipo de Conteúdo</h3>

			<UiFormField name="tipo_conteudo" label="Escolha o tipo de banner" required>
				<div class="grid grid-cols-2 gap-4">
					<div v-for="option in tipoConteudoOptions" :key="option.value" class="relative">
						<input
							:id="`tipo-conteudo-${option.value}`"
							:checked="values.tipo_conteudo === option.value"
							:value="option.value"
							type="radio"
							name="tipo_conteudo"
							class="peer sr-only"
							@change="setFieldValue('tipo_conteudo', option.value)"
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
								class="absolute top-2 right-2 w-4 h-4 rounded-full border-2 border-[var(--border-default)] bg-[var(--bg-surface)] peer-checked:border-[var(--primary)] peer-checked:bg-[var(--primary)] transition-all duration-200"
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

		<!-- Informações Básicas (APENAS para tipo "texto") -->
		<div v-if="showTextFields" class="space-y-4">
			<h3 class="text-lg font-medium text-[var(--text-primary)]">Informações Básicas</h3>

			<!-- Título -->
			<UiFormField name="titulo" label="Título do Banner" required>
				<UiInput
					:model-value="values.titulo"
					placeholder="Ex: Promoção de Verão"
					maxlength="100"
					@update:model-value="setFieldValue('titulo', $event as string)"
				/>
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
		</div>

		<!-- Configurações de Imagem -->
		<div v-if="showImageFields" class="space-y-4">
			<h3 class="text-lg font-medium text-[var(--text-primary)]">Imagem</h3>

			<!-- Upload de Imagem com Preview Inteligente -->
			<UiBannerImageUpload
				:model-value="values.imagem_url || ''"
				label="Imagem do Banner"
				:disabled="props.loading"
				@update:model-value="setFieldValue('imagem_url', $event as string)"
			/>

			<!-- Link do Banner -->
			<UiFormField name="link_url" label="Link de Destino">
				<UiInput name="link_url" placeholder="https://exemplo.com/promocao" type="url" />
			</UiFormField>
		</div>

		<!-- Configurações de Texto -->
		<div v-if="showTextFields" class="space-y-4">
			<h3 class="text-lg font-medium text-[var(--text-primary)]">Personalização Visual</h3>

			<!-- Cores -->
			<div class="space-y-4">
				<!-- Cor de Fundo do Banner (APENAS para tipo "texto") -->
				<UiColorPicker
					v-if="showColorCustomization"
					:model-value="values.cor_fundo || '#ffffff'"
					label="Cor de Fundo do Banner"
					@update:model-value="setFieldValue('cor_fundo', $event as string)"
				/>

				<!-- Cor do Texto -->
				<UiColorPicker
					:model-value="values.cor_texto || '#ffffff'"
					label="Cor do Texto"
					@update:model-value="setFieldValue('cor_texto', $event as string)"
				/>
			</div>

			<!-- Texto CTA -->
			<UiFormField name="texto_cta" label="Texto do Botão (CTA)">
				<UiInput name="texto_cta" placeholder="Ex: Comprar Agora" maxlength="50" />
			</UiFormField>

			<!-- Posição do Texto -->
			<UiFormField name="texto_posicao" label="Posição do Texto">
				<UiSelect
					:model-value="values.texto_posicao || 'centro'"
					:options="posicaoTextoOptions"
					@update:model-value="setFieldValue('texto_posicao', $event as any)"
				/>
			</UiFormField>
		</div>

		<!-- Preview do Banner -->
		<div class="space-y-4">
			<h3 class="text-lg font-medium text-[var(--text-primary)]">Preview</h3>

			<div class="border border-[var(--border-default)] rounded-lg p-4 bg-[var(--bg-muted)]">
				<!-- Preview IDÊNTICO ao banner real do cardápio público -->
				<div
					class="relative h-36 sm:h-40 md:h-44 lg:h-48 rounded-lg overflow-hidden shadow-md flex items-center justify-center"
					:style="{ backgroundColor: previewBackgroundColor }"
				>
					<!-- Imagem de fundo (apenas para tipo "imagem") -->
					<div
						v-if="values.imagem_url && values.tipo_conteudo === 'imagem'"
						class="absolute inset-0 bg-cover bg-center"
						:style="{ backgroundImage: `url(${values.imagem_url})` }"
					></div>

					<!-- Overlay de texto para banners com imagem (se tiver título/descrição) -->
					<div
						v-if="values.tipo_conteudo === 'imagem' && (values.titulo || values.descricao)"
						class="absolute inset-0 bg-black/40 flex items-center justify-center p-4 z-10"
					>
						<div class="text-center text-white max-w-md">
							<h3
								v-if="values.titulo"
								class="text-sm sm:text-base md:text-lg font-bold text-center mb-1"
							>
								{{ values.titulo }}
							</h3>
							<p v-if="values.descricao" class="text-xs sm:text-sm text-center opacity-90">
								{{ values.descricao }}
							</p>
						</div>
					</div>

					<!-- Conteúdo de texto (apenas para tipo "texto") -->
					<div
						v-if="values.tipo_conteudo === 'texto'"
						class="absolute inset-0 flex p-4"
						:class="{
							'items-center justify-center': values.texto_posicao === 'centro',
							'items-center justify-start': values.texto_posicao === 'esquerda',
							'items-center justify-end': values.texto_posicao === 'direita',
							'items-start justify-center pt-6': values.texto_posicao === 'superior',
							'items-end justify-center pb-6': values.texto_posicao === 'inferior',
						}"
					>
						<!-- Texto sem fundo -->
						<div class="flex flex-col items-center justify-center max-w-md">
							<h3
								class="text-sm sm:text-base md:text-lg font-bold text-center"
								:class="{ 'mb-1': values.descricao || values.texto_cta }"
								:style="{ color: values.cor_texto || '#000000' }"
							>
								{{ values.titulo || "Título do Banner" }}
							</h3>
							<p
								v-if="values.descricao || values.texto_cta"
								class="text-xs sm:text-sm text-center"
								:style="{ color: values.cor_texto || '#000000', opacity: 0.9 }"
							>
								{{ values.descricao || values.texto_cta || "Descrição do banner" }}
							</p>
						</div>
					</div>
				</div>

				<!-- Info do preview -->
				<div class="mt-3 text-center">
					<p class="text-xs text-[var(--text-muted)]">
						Preview com dimensões reais do cardápio público (responsivo)
					</p>
				</div>
			</div>
		</div>

		<!-- Ações -->
		<div class="flex gap-3 justify-end pt-6 border-t border-[var(--border-default)]">
			<UiButton type="button" variant="outline" @click="handleCancel"> Cancelar </UiButton>
			<UiButton type="submit" variant="solid" :loading="props.loading">
				{{ props.initialData?.titulo ? "Atualizar" : "Criar" }} Banner
			</UiButton>
		</div>
	</form>
</template>
