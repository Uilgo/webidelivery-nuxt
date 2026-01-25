<script setup lang="ts">
/**
 * 📌 Step1InfoBasica - Etapa 1 do Onboarding
 *
 * Coleta informações básicas do estabelecimento:
 * - Nome do estabelecimento
 * - Slug (URL personalizada)
 * - Descrição (opcional)
 */

import { formatSlug } from "~/lib/formatters/slug";
import type { Step1InfoBasica } from "../../types/onboarding";

/**
 * Props do componente
 */
interface Props {
	modelValue: Step1InfoBasica;
	slugValidation: {
		isValid: boolean;
		isChecking: boolean;
		message: string;
		available: boolean;
	};
}

/**
 * Emits do componente
 */
interface Emits {
	"update:modelValue": [value: Step1InfoBasica];
	"check-slug": [slug: string];
	"reset-slug-validation": [];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

/**
 * Computed para v-model
 */
const formData = computed({
	get: () => props.modelValue,
	set: (value: Step1InfoBasica) => emit("update:modelValue", value),
});

/**
 * Handler para mudança do slug
 */
const handleSlugChange = (value: string | number): void => {
	const rawValue = String(value);

	// Resetar validação quando slug muda
	emit("reset-slug-validation");

	// Usar o formatter oficial do projeto
	const formattedSlug = formatSlug(rawValue);

	// Atualizar modelo com valor formatado
	formData.value = { ...formData.value, slug: formattedSlug };
};

/**
 * Handler para quando o foco sai do input de slug (validar disponibilidade)
 */
const handleSlugBlur = (): void => {
	const slug = formData.value.slug.trim();

	// Verificar disponibilidade apenas se houver slug
	if (slug) {
		emit("check-slug", slug);
	}
};

/**
 * Verificar slug automaticamente se já existe mas não foi validado
 */
onMounted(() => {
	const slug = formData.value.slug.trim();

	// Se há slug mas não foi validado ainda, validar automaticamente
	if (slug && !props.slugValidation.available && !props.slugValidation.message) {
		emit("check-slug", slug);
	}
});

/**
 * Handler para mudança do nome
 */
const handleNameChange = (value: string | number): void => {
	const nome = String(value);
	formData.value = { ...formData.value, nome };
};
</script>

<template>
	<div class="space-y-4">
		<!-- Grid 2 colunas: Nome + Slug -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<!-- Nome do estabelecimento -->
			<UiFormField label="Nome do estabelecimento" required>
				<UiInput
					:model-value="formData.nome"
					placeholder="Ex: Pizzaria do João"
					@update:model-value="handleNameChange"
				/>
			</UiFormField>

			<!-- Slug (URL personalizada) -->
			<UiFormField label="URL personalizada" required>
				<UiInput
					:model-value="formData.slug"
					placeholder="pizzaria-do-joao"
					:disabled="slugValidation.isChecking"
					@update:model-value="handleSlugChange"
					@blur="handleSlugBlur"
				>
					<template #iconRight>
						<Icon
							v-if="slugValidation.isChecking"
							name="lucide:loader-2"
							class="w-5 h-5 animate-spin text-gray-400"
						/>
						<Icon
							v-else-if="formData.slug && slugValidation.available"
							name="lucide:check-circle"
							class="w-5 h-5 text-green-500"
						/>
						<Icon
							v-else-if="formData.slug && !slugValidation.available"
							name="lucide:x-circle"
							class="w-5 h-5 text-red-500"
						/>
					</template>
				</UiInput>

				<!-- Feedback da validação do slug -->
				<template v-if="slugValidation.message" #help>
					<span
						class="text-sm"
						:class="{
							'text-green-600 dark:text-green-400': slugValidation.available,
							'text-red-600 dark:text-red-400':
								!slugValidation.available && !slugValidation.isChecking,
							'text-gray-500 dark:text-gray-400': slugValidation.isChecking,
						}"
					>
						{{ slugValidation.message }}
					</span>
				</template>
			</UiFormField>
		</div>

		<!-- Descrição (opcional) - Full width -->
		<UiFormField label="Descrição (opcional)">
			<UiTextarea
				:model-value="formData.descricao || ''"
				placeholder="Ex: A melhor pizzaria da região, com ingredientes frescos e massa artesanal..."
				:rows="2"
				@update:model-value="(value: string) => (formData.descricao = value)"
			/>
		</UiFormField>

		<!-- Dicas com destaque -->
		<div
			class="relative bg-[var(--primary-light)] border-l-4 border-[var(--primary)] rounded-lg p-3 shadow-sm mt-4"
		>
			<div class="flex items-start gap-3">
				<div
					class="flex-shrink-0 w-9 h-9 rounded-full bg-[var(--primary)] flex items-center justify-center"
				>
					<Icon name="lucide:lightbulb" class="w-4 h-4 text-[var(--primary-foreground)]" />
				</div>
				<div class="flex-1 min-w-0">
					<p class="font-semibold text-[var(--text-primary)] mb-1.5 text-sm">Dicas importantes:</p>
					<ul class="text-[var(--text-secondary)] space-y-1 text-sm leading-relaxed">
						<li class="flex items-start gap-2">
							<span class="text-[var(--primary)] mt-0.5">•</span>
							<span>O nome aparecerá no topo do seu cardápio digital</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-[var(--primary)] mt-0.5">•</span>
							<span>A URL personalizada não poderá ser alterada depois</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-[var(--primary)] mt-0.5">•</span>
							<span>Use um nome fácil de lembrar e digitar</span>
						</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</template>
