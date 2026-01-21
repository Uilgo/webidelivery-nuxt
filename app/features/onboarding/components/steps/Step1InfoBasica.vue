<script setup lang="ts">
/**
 * 📌 Step1InfoBasica - Etapa 1 do Onboarding
 *
 * Coleta informações básicas do estabelecimento:
 * - Nome do estabelecimento
 * - Slug (URL personalizada)
 * - Descrição (opcional)
 */

import { formatSlug } from "../../../../../lib/formatters/slug";
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
 * Debounce para verificação de slug
 */
let slugCheckTimeout: NodeJS.Timeout;

const handleSlugChange = (slug: string): void => {
	// Limpar timeout anterior
	if (slugCheckTimeout) {
		clearTimeout(slugCheckTimeout);
	}

	// Atualizar valor imediatamente
	formData.value = { ...formData.value, slug };

	// Verificar disponibilidade após delay
	if (slug.trim()) {
		slugCheckTimeout = setTimeout(() => {
			emit("check-slug", slug);
		}, 500);
	}
};

/**
 * Gerar slug automaticamente baseado no nome (usando formatter existente)
 */
const generateSlugFromName = (nome: string): string => {
	return formatSlug(nome);
};

/**
 * Handler para mudança do nome
 */
const handleNameChange = (nome: string): void => {
	formData.value = { ...formData.value, nome };

	// Gerar slug automaticamente se estiver vazio
	if (!formData.value.slug.trim()) {
		const generatedSlug = generateSlugFromName(nome);
		if (generatedSlug) {
			handleSlugChange(generatedSlug);
		}
	}
};
</script>

<template>
	<div class="space-y-6">
		<!-- Cabeçalho da etapa -->
		<div class="text-center">
			<h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Informações Básicas</h3>
			<p class="text-gray-600 dark:text-gray-400">
				Vamos começar com as informações principais do seu estabelecimento
			</p>
		</div>

		<!-- Formulário -->
		<div class="space-y-4">
			<!-- Nome do estabelecimento -->
			<FormField
				label="Nome do estabelecimento"
				description="Como seu estabelecimento será conhecido pelos clientes"
				required
			>
				<Input
					:model-value="formData.nome"
					placeholder="Ex: Pizzaria do João"
					:disabled="false"
					@update:model-value="handleNameChange"
				/>
			</FormField>

			<!-- Slug (URL personalizada) -->
			<FormField
				label="URL personalizada"
				:description="`Seu cardápio ficará disponível em: webidelivery.com.br/${formData.slug || 'seu-slug'}`"
				required
			>
				<div class="space-y-2">
					<Input
						:model-value="formData.slug"
						placeholder="pizzaria-do-joao"
						:disabled="slugValidation.isChecking"
						@update:model-value="handleSlugChange"
					>
						<template #leading>
							<span class="text-gray-500 text-sm">webidelivery.com.br/</span>
						</template>
						<template #trailing>
							<Icon
								v-if="slugValidation.isChecking"
								name="lucide:loader-2"
								class="w-4 h-4 animate-spin text-gray-400"
							/>
							<Icon
								v-else-if="formData.slug && slugValidation.available"
								name="lucide:check-circle"
								class="w-4 h-4 text-green-500"
							/>
							<Icon
								v-else-if="formData.slug && !slugValidation.available"
								name="lucide:x-circle"
								class="w-4 h-4 text-red-500"
							/>
						</template>
					</Input>

					<!-- Feedback da validação do slug -->
					<p
						v-if="slugValidation.message"
						class="text-sm"
						:class="{
							'text-green-600 dark:text-green-400': slugValidation.available,
							'text-red-600 dark:text-red-400':
								!slugValidation.available && !slugValidation.isChecking,
							'text-gray-500 dark:text-gray-400': slugValidation.isChecking,
						}"
					>
						{{ slugValidation.message }}
					</p>
				</div>
			</FormField>

			<!-- Descrição (opcional) -->
			<FormField
				label="Descrição"
				description="Uma breve descrição sobre seu estabelecimento (opcional)"
			>
				<Textarea
					v-model="formData.descricao"
					placeholder="Ex: A melhor pizzaria da região, com ingredientes frescos e massa artesanal..."
					rows="3"
				/>
			</FormField>
		</div>

		<!-- Dicas -->
		<div
			class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
		>
			<div class="flex items-start space-x-3">
				<Icon name="lucide:lightbulb" class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
				<div class="text-sm">
					<p class="font-medium text-blue-900 dark:text-blue-100 mb-1">Dicas importantes:</p>
					<ul class="text-blue-700 dark:text-blue-300 space-y-1">
						<li>• O nome aparecerá no topo do seu cardápio digital</li>
						<li>• A URL personalizada não poderá ser alterada depois</li>
						<li>• Use um nome fácil de lembrar e digitar</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</template>
