<script setup lang="ts">
/**
 * 📌 ConviteModal
 *
 * Modal para criar novo convite de equipe.
 * Permite selecionar cargo e adicionar descrição opcional.
 */

import type { CargoEquipe, CriarConviteData } from "../../types/equipe";
import { criarConviteSchema } from "#shared/schemas/equipe";
import CargoSelect from "../shared/CargoSelect.vue";

// Tipo interno para o formulário (permite undefined)
interface FormData {
	cargo_pretendido?: CargoEquipe;
	descricao?: string;
}

interface Props {
	modelValue: boolean;
	cargosDisponiveis: CargoEquipe[];
	loading?: boolean;
}

interface Emits {
	"update:modelValue": [value: boolean];
	criar: [dados: CriarConviteData];
}

const props = withDefaults(defineProps<Props>(), {
	loading: false,
});

const emit = defineEmits<Emits>();

// Estado do formulário
const form = reactive<FormData>({
	cargo_pretendido: undefined,
	descricao: "",
});

// Computed para garantir que descricao seja sempre string
const descricaoValue = computed({
	get: () => form.descricao || "",
	set: (value: string) => {
		form.descricao = value;
	},
});

// Estado de validação
const errors = ref<Record<string, string>>({});

// Watch para resetar formulário quando modal abre/fecha
watch(
	() => props.modelValue,
	(isOpen) => {
		if (!isOpen) {
			// Limpa formulário quando fecha
			form.cargo_pretendido = undefined;
			form.descricao = "";
			errors.value = {};
		}
	},
);

// Função para validar formulário
const validarFormulario = (): boolean => {
	errors.value = {};

	const resultado = criarConviteSchema.safeParse(form);
	if (!resultado.success) {
		resultado.error.issues.forEach((issue) => {
			const campo = issue.path[0] as string;
			errors.value[campo] = issue.message;
		});
		return false;
	}

	return true;
};

// Função para criar convite
const handleCriar = async () => {
	if (!validarFormulario()) return;

	// Validação adicional para cargo obrigatório
	if (!form.cargo_pretendido) {
		errors.value.cargo_pretendido = "Cargo é obrigatório";
		return;
	}

	// Prepara dados para envio (converte para tipo correto)
	const dados: CriarConviteData = {
		cargo_pretendido: form.cargo_pretendido,
	};

	if (form.descricao?.trim()) {
		dados.descricao = form.descricao.trim();
	}

	emit("criar", dados);
};

// Função para fechar modal
const handleClose = () => {
	emit("update:modelValue", false);
};
</script>

<template>
	<UiModal
		:model-value="modelValue"
		size="xl"
		:scrollable="false"
		@update:model-value="emit('update:modelValue', $event)"
	>
		<template #header>
			<div class="flex items-center gap-4">
				<!-- Ícone com gradiente -->
				<div
					class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-lg shadow-primary-500/25"
				>
					<Icon name="lucide:user-plus" class="w-6 h-6 text-white" />
				</div>
				<div>
					<h3 class="text-xl font-bold text-gray-900 dark:text-white">Convidar Membro</h3>
					<p class="text-sm text-gray-500 dark:text-gray-400">
						Gere um código de convite para adicionar um novo membro à equipe
					</p>
				</div>
			</div>
		</template>

		<template #default>
			<div class="space-y-5">
				<!-- Info Cards em Grid -->
				<div class="grid grid-cols-4 gap-3">
					<div
						class="flex items-center gap-2.5 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border border-blue-100 dark:border-blue-800/30"
					>
						<div
							class="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center"
						>
							<Icon name="lucide:hash" class="w-4 h-4 text-blue-600 dark:text-blue-400" />
						</div>
						<div class="min-w-0">
							<p class="text-xs font-medium text-blue-900 dark:text-blue-100 truncate">
								Código único
							</p>
							<p class="text-[10px] text-blue-600 dark:text-blue-400">EQUIPE-XXXXXX</p>
						</div>
					</div>

					<div
						class="flex items-center gap-2.5 p-3 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 border border-amber-100 dark:border-amber-800/30"
					>
						<div
							class="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center"
						>
							<Icon name="lucide:clock" class="w-4 h-4 text-amber-600 dark:text-amber-400" />
						</div>
						<div class="min-w-0">
							<p class="text-xs font-medium text-amber-900 dark:text-amber-100 truncate">
								Expira em
							</p>
							<p class="text-[10px] text-amber-600 dark:text-amber-400">7 dias</p>
						</div>
					</div>

					<div
						class="flex items-center gap-2.5 p-3 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 border border-green-100 dark:border-green-800/30"
					>
						<div
							class="w-8 h-8 rounded-lg bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center"
						>
							<Icon name="lucide:share-2" class="w-4 h-4 text-green-600 dark:text-green-400" />
						</div>
						<div class="min-w-0">
							<p class="text-xs font-medium text-green-900 dark:text-green-100 truncate">
								Compartilhe
							</p>
							<p class="text-[10px] text-green-600 dark:text-green-400">Com o convidado</p>
						</div>
					</div>

					<div
						class="flex items-center gap-2.5 p-3 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 border border-purple-100 dark:border-purple-800/30"
					>
						<div
							class="w-8 h-8 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center"
						>
							<Icon name="lucide:log-in" class="w-4 h-4 text-purple-600 dark:text-purple-400" />
						</div>
						<div class="min-w-0">
							<p class="text-xs font-medium text-purple-900 dark:text-purple-100 truncate">
								Cadastro
							</p>
							<p class="text-[10px] text-purple-600 dark:text-purple-400">Página da equipe</p>
						</div>
					</div>
				</div>

				<!-- Formulário em Grid Horizontal -->
				<div class="grid grid-cols-2 gap-4">
					<!-- Campo Cargo -->
					<UiFormField
						label="Cargo do novo membro"
						:error="errors.cargo_pretendido"
						description="Função que o convidado terá"
					>
						<CargoSelect
							v-model="form.cargo_pretendido"
							:cargos-disponiveis="cargosDisponiveis"
							placeholder="Selecione o cargo"
							:error="!!errors.cargo_pretendido"
						/>
					</UiFormField>

					<!-- Campo Descrição -->
					<UiFormField
						label="Descrição (opcional)"
						:error="errors.descricao"
						description="Para identificar este convite"
					>
						<UiInput
							v-model="descricaoValue"
							placeholder="Ex: Novo atendente turno manhã"
							icon="lucide:tag"
						/>
					</UiFormField>
				</div>
			</div>
		</template>

		<template #footer>
			<div class="flex items-center justify-between">
				<p class="text-xs text-gray-400 dark:text-gray-500">
					<Icon name="lucide:info" class="w-3.5 h-3.5 inline mr-1" />
					O código só pode ser usado uma vez
				</p>
				<div class="flex gap-3">
					<UiButton variant="ghost" :disabled="loading" @click="handleClose">
						<Icon name="lucide:x" class="w-4 h-4 mr-1.5" />
						Cancelar
					</UiButton>
					<UiButton :loading="loading" @click="handleCriar">
						<Icon name="lucide:send" class="w-4 h-4 mr-1.5" />
						Gerar Convite
					</UiButton>
				</div>
			</div>
		</template>
	</UiModal>
</template>
