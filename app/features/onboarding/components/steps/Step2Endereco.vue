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
import { formatCEP } from "~/lib/formatters/cep";
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
const novaCidade = ref("");

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
		// Não bloquear o usuário se a API falhar - ele pode preencher manualmente
		cepError.value = "CEP não encontrado. Preencha os campos manualmente.";
	} finally {
		isLoadingCep.value = false;
	}
};

/**
 * Handler para mudança do CEP
 */
const handleCepChange = (cep: string): void => {
	// Sempre armazenar CEP sem formatação no modelo
	const cepLimpo = cep.replace(/\D/g, "");
	formData.value = { ...formData.value, endereco_cep: cepLimpo };

	// Buscar automaticamente quando CEP estiver completo
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
		label: ESTADOS_LABELS[uf] || uf,
	})),
];

/**
 * Gerenciamento de cidades atendidas
 */
const adicionarCidade = () => {
	const cidade = novaCidade.value.trim();
	if (!cidade) return;

	// Inicializar array se não existir
	if (!formData.value.cidades_atendidas) {
		formData.value = { ...formData.value, cidades_atendidas: [] };
	}

	// Verificar se cidade já existe
	if (formData.value.cidades_atendidas.includes(cidade)) {
		return;
	}

	// Adicionar cidade
	formData.value = {
		...formData.value,
		cidades_atendidas: [...formData.value.cidades_atendidas, cidade],
	};

	novaCidade.value = "";
};

const removerCidade = (cidade: string) => {
	if (!formData.value.cidades_atendidas) return;

	formData.value = {
		...formData.value,
		cidades_atendidas: formData.value.cidades_atendidas.filter((c) => c !== cidade),
	};
};
</script>

<template>
	<div class="space-y-4">
		<!-- Linha 1: CEP + Número + Complemento (3 colunas) -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<!-- CEP -->
			<UiFormField label="CEP" required>
				<UiInput
					:model-value="formatCEP(formData.endereco_cep || '')"
					placeholder="00000-000"
					:disabled="isLoadingCep"
					maxlength="9"
					@update:model-value="(value: string | number) => handleCepChange(String(value))"
				>
					<template #iconRight>
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
				</UiInput>
				<template v-if="cepError" #error>
					{{ cepError }}
				</template>
			</UiFormField>

			<!-- Número -->
			<UiFormField label="Número" required>
				<UiInput v-model="formData.endereco_numero" placeholder="123" :disabled="isLoadingCep" />
			</UiFormField>

			<!-- Complemento -->
			<UiFormField label="Complemento">
				<UiInput
					v-model="formData.endereco_complemento"
					placeholder="Apto 45, Bloco B"
					:disabled="isLoadingCep"
				/>
			</UiFormField>
		</div>

		<!-- Linha 2: Rua (full width) -->
		<UiFormField label="Rua/Logradouro" required>
			<UiInput
				v-model="formData.endereco_rua"
				placeholder="Ex: Rua das Flores"
				:disabled="isLoadingCep"
			/>
		</UiFormField>

		<!-- Linha 3: Bairro + Cidade + Estado (3 colunas) -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<!-- Bairro -->
			<UiFormField label="Bairro" required>
				<UiInput v-model="formData.endereco_bairro" placeholder="Centro" :disabled="isLoadingCep" />
			</UiFormField>

			<!-- Cidade -->
			<UiFormField label="Cidade" required>
				<UiInput
					v-model="formData.endereco_cidade"
					placeholder="São Paulo"
					:disabled="isLoadingCep"
				/>
			</UiFormField>

			<!-- Estado -->
			<UiFormField label="Estado" required>
				<UiSelect
					v-model="formData.endereco_estado"
					:options="estados"
					placeholder="Selecione o estado"
					:disabled="isLoadingCep"
				/>
				<template v-if="!formData.endereco_estado" #error> Estado é obrigatório </template>
			</UiFormField>
		</div>

		<!-- Linha 4: Referência (full width) -->
		<UiFormField label="Ponto de referência">
			<UiInput
				v-model="formData.endereco_referencia"
				placeholder="Ex: Próximo ao shopping, em frente à praça"
				:disabled="isLoadingCep"
			/>
		</UiFormField>

		<!-- Linha 5: Cidades Atendidas (NOVO) -->
		<div class="space-y-3">
			<div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
				<Icon name="lucide:map-pin" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
				<h4 class="text-sm font-bold text-gray-700 dark:text-gray-300">
					Cidades Atendidas
					<span class="text-red-500">*</span>
				</h4>
			</div>

			<!-- Alerta se não tem cidades -->
			<div
				v-if="!formData.cidades_atendidas || formData.cidades_atendidas.length === 0"
				class="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
			>
				<div class="flex items-center gap-2">
					<Icon name="lucide:alert-triangle" class="w-4 h-4 text-amber-600" />
					<span class="text-sm font-medium text-amber-800 dark:text-amber-200">
						Adicione pelo menos 1 cidade onde você faz entregas
					</span>
				</div>
			</div>

			<!-- Input para adicionar cidade -->
			<div class="flex gap-2">
				<UiInput
					v-model="novaCidade"
					placeholder="Digite o nome da cidade"
					class="flex-1"
					@keyup.enter="adicionarCidade"
				/>
				<UiButton
					type="button"
					variant="solid"
					class="bg-primary text-white"
					@click="adicionarCidade"
				>
					<Icon name="lucide:plus" class="w-4 h-4 mr-2" />
					Adicionar
				</UiButton>
			</div>

			<p class="text-xs text-gray-500">💡 Informe as cidades onde você realiza entregas</p>

			<!-- Lista de cidades -->
			<div v-if="formData.cidades_atendidas && formData.cidades_atendidas.length" class="space-y-2">
				<div
					v-for="cidade in formData.cidades_atendidas"
					:key="cidade"
					class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-100 dark:border-gray-700/50"
				>
					<div class="flex items-center gap-2">
						<Icon name="lucide:map-pin" class="w-4 h-4 text-primary-500" />
						<span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ cidade }}</span>
					</div>
					<button
						type="button"
						class="text-gray-400 hover:text-red-500 transition-colors"
						@click="removerCidade(cidade)"
					>
						<Icon name="lucide:trash-2" class="w-4 h-4" />
					</button>
				</div>
			</div>
		</div>

		<!-- Dica compacta -->
		<div
			class="relative bg-[var(--primary-light)] border-l-4 border-[var(--primary)] rounded-lg p-3 shadow-sm"
		>
			<div class="flex items-center gap-3">
				<div
					class="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center"
				>
					<Icon name="lucide:map-pin" class="w-4 h-4 text-[var(--primary-foreground)]" />
				</div>
				<p class="text-[var(--text-secondary)] text-sm">
					<span class="font-semibold text-[var(--text-primary)]">Dica:</span>
					Endereço completo melhora a experiência de entrega
				</p>
			</div>
		</div>
	</div>
</template>
