<script setup lang="ts">
/**
 * 📌 Step2Endereco - Etapa 2 do Onboarding
 *
 * Coleta informações de endereço do estabelecimento:
 * - CEP (com busca automática)
 * - Rua, número, bairro, cidade, estado
 * - Complemento e referência (opcionais)
 */

import type { Step2Endereco } from "../../types/onboarding";
import { formatCEP } from "../../../../../lib/formatters/cep";
import { ESTADOS_BRASIL, ESTADOS_LABELS } from "#shared/constants/estabelecimento";

/**
 * Props do componente
 */
interface Props {
	modelValue: Step2Endereco;
}

/**
 * Emits do componente
 */
interface Emits {
	"update:modelValue": [value: Step2Endereco];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

/**
 * Estados locais
 */
const isLoadingCep = ref(false);
const cepError = ref<string | null>(null);

/**
 * Computed para v-model
 */
const formData = computed({
	get: () => props.modelValue,
	set: (value: Step2Endereco) => emit("update:modelValue", value),
});

/**
 * Buscar endereço por CEP
 */
const buscarCep = async (cep: string): Promise<void> => {
	// Limpar erro anterior
	cepError.value = null;

	// Validar formato do CEP
	const cepLimpo = cep.replace(/\D/g, "");
	if (cepLimpo.length !== 8) {
		cepError.value = "CEP deve ter 8 dígitos";
		return;
	}

	isLoadingCep.value = true;

	try {
		// Usar a API do servidor para buscar CEP (estrutura correta da API)
		const response = await $fetch<{
			cep: string;
			logradouro: string;
			bairro: string;
			localidade: string;
			uf: string;
			complemento?: string;
			estado?: string;
		}>(`/api/cep/${cepLimpo}`);

		// Preencher campos automaticamente
		formData.value = {
			...formData.value,
			endereco_rua: response.logradouro || formData.value.endereco_rua,
			endereco_bairro: response.bairro || formData.value.endereco_bairro,
			endereco_cidade: response.localidade || formData.value.endereco_cidade,
			endereco_estado: response.uf || formData.value.endereco_estado,
		};
	} catch (error) {
		console.error("Erro ao buscar CEP:", error);
		cepError.value = "Erro ao buscar CEP. Tente novamente.";
	} finally {
		isLoadingCep.value = false;
	}
};

/**
 * Handler para mudança do CEP
 */
const handleCepChange = (cep: string): void => {
	formData.value = { ...formData.value, endereco_cep: cep };

	// Buscar automaticamente quando CEP estiver completo
	const cepLimpo = cep.replace(/\D/g, "");
	if (cepLimpo.length === 8) {
		buscarCep(cep);
	}
};

/**
 * Estados do Brasil (usando constantes existentes)
 */
const estados = [
	{ value: "", label: "Selecione o estado" }, // Opção vazia
	...ESTADOS_BRASIL.map((uf) => ({
		value: uf,
		label: ESTADOS_LABELS[uf],
	})),
];
</script>

<template>
	<div class="space-y-6">
		<!-- Cabeçalho da etapa -->
		<div class="text-center">
			<h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
				Endereço do Estabelecimento
			</h3>
			<p class="text-gray-600 dark:text-gray-400">
				Informe o endereço onde seu estabelecimento está localizado
			</p>
		</div>

		<!-- Formulário -->
		<div class="space-y-4">
			<!-- CEP -->
			<FormField label="CEP" description="Digite o CEP para preenchimento automático" required>
				<Input
					:model-value="formatCEP(formData.endereco_cep || '')"
					placeholder="00000-000"
					:disabled="isLoadingCep"
					maxlength="9"
					@update:model-value="handleCepChange"
				>
					<template #trailing>
						<Icon
							v-if="isLoadingCep"
							name="lucide:loader-2"
							class="w-4 h-4 animate-spin text-gray-400"
						/>
						<Icon
							v-else-if="formData.endereco_cep && !cepError"
							name="lucide:map-pin"
							class="w-4 h-4 text-green-500"
						/>
					</template>
				</Input>
				<p v-if="cepError" class="text-sm text-red-600 dark:text-red-400 mt-1">
					{{ cepError }}
				</p>
			</FormField>

			<!-- Grid de endereço -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- Rua -->
				<div class="md:col-span-2">
					<FormField label="Rua/Logradouro" required>
						<Input
							v-model="formData.endereco_rua"
							placeholder="Ex: Rua das Flores"
							:disabled="isLoadingCep"
						/>
					</FormField>
				</div>

				<!-- Número -->
				<FormField label="Número" required>
					<Input v-model="formData.endereco_numero" placeholder="123" :disabled="isLoadingCep" />
				</FormField>

				<!-- Complemento -->
				<FormField label="Complemento">
					<Input
						v-model="formData.endereco_complemento"
						placeholder="Apto 45, Bloco B"
						:disabled="isLoadingCep"
					/>
				</FormField>

				<!-- Bairro -->
				<FormField label="Bairro" required>
					<Input v-model="formData.endereco_bairro" placeholder="Centro" :disabled="isLoadingCep" />
				</FormField>

				<!-- Cidade -->
				<FormField label="Cidade" required>
					<Input
						v-model="formData.endereco_cidade"
						placeholder="São Paulo"
						:disabled="isLoadingCep"
					/>
				</FormField>

				<!-- Estado -->
				<div class="md:col-span-2">
					<FormField label="Estado" required>
						<Select
							v-model="formData.endereco_estado"
							:options="estados"
							placeholder="Selecione o estado"
							:disabled="isLoadingCep"
						/>
					</FormField>
				</div>

				<!-- Referência -->
				<div class="md:col-span-2">
					<FormField
						label="Ponto de referência"
						description="Ajuda os clientes a encontrar seu estabelecimento"
					>
						<Input
							v-model="formData.endereco_referencia"
							placeholder="Ex: Próximo ao shopping, em frente à praça"
							:disabled="isLoadingCep"
						/>
					</FormField>
				</div>
			</div>
		</div>

		<!-- Dicas -->
		<div
			class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
		>
			<div class="flex items-start space-x-3">
				<Icon name="lucide:map-pin" class="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
				<div class="text-sm">
					<p class="font-medium text-green-900 dark:text-green-100 mb-1">Dica importante:</p>
					<p class="text-green-700 dark:text-green-300">
						Um endereço completo e preciso ajuda os clientes a encontrar seu estabelecimento e
						melhora a experiência de entrega.
					</p>
				</div>
			</div>
		</div>
	</div>
</template>
