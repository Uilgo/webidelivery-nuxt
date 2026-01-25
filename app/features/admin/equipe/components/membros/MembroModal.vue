<script setup lang="ts">
/**
 * 📌 MembroModal
 *
 * Modal para editar informações de um membro da equipe.
 * Permite alterar cargo e status (ativo/inativo).
 */

import type { Membro, CargoEquipe, EditarMembroData } from "../../types/equipe";
import { editarMembroSchema } from "#shared/schemas/equipe";
import { formatarCargo } from "../../utils/cargo-helpers";
import CargoSelect from "../shared/CargoSelect.vue";

interface Props {
	modelValue: boolean;
	membro: Membro | null;
	cargosDisponiveis: CargoEquipe[];
	loading?: boolean;
}

interface Emits {
	"update:modelValue": [value: boolean];
	salvar: [membroId: string, cargoMembro: CargoEquipe, dados: EditarMembroData];
}

const props = withDefaults(defineProps<Props>(), {
	loading: false,
});

const emit = defineEmits<Emits>();

// Estado do formulário
const form = reactive<EditarMembroData>({
	cargo: undefined,
	ativo: undefined,
});

// Estado de validação
const errors = ref<Record<string, string>>({});

// Computed properties
const nomeCompleto = computed(() => {
	if (!props.membro) return "";
	return `${props.membro.nome} ${props.membro.sobrenome}`;
});

const cargoAtual = computed(() => {
	if (!props.membro) return "";
	return formatarCargo(props.membro.cargo as CargoEquipe);
});

// Watch para resetar formulário quando modal abre/fecha
watch(
	() => props.modelValue,
	(isOpen) => {
		if (isOpen && props.membro) {
			// Inicializa formulário com dados atuais
			form.cargo = props.membro.cargo as CargoEquipe;
			form.ativo = props.membro.ativo;
		} else {
			// Limpa formulário quando fecha
			form.cargo = undefined;
			form.ativo = undefined;
		}
		errors.value = {};
	},
);

// Função para validar formulário
const validarFormulario = (): boolean => {
	errors.value = {};

	const resultado = editarMembroSchema.safeParse(form);
	if (!resultado.success) {
		resultado.error.issues.forEach((issue) => {
			const campo = issue.path[0] as string;
			errors.value[campo] = issue.message;
		});
		return false;
	}

	return true;
};

// Função para salvar
const handleSalvar = async () => {
	if (!props.membro) return;

	if (!validarFormulario()) return;

	// Só envia campos que foram alterados
	const dadosAlterados: EditarMembroData = {};

	if (form.cargo !== props.membro.cargo) {
		dadosAlterados.cargo = form.cargo;
	}

	if (form.ativo !== props.membro.ativo) {
		dadosAlterados.ativo = form.ativo;
	}

	// Se nada foi alterado, apenas fecha o modal
	if (Object.keys(dadosAlterados).length === 0) {
		emit("update:modelValue", false);
		return;
	}

	emit("salvar", props.membro.id, props.membro.cargo as CargoEquipe, dadosAlterados);
};

// Função para fechar modal
const handleClose = () => {
	emit("update:modelValue", false);
};

// Opções de status (convertendo boolean para string para compatibilidade com UiSelect)
const opcoesStatus = [
	{ value: "true", label: "Ativo" },
	{ value: "false", label: "Inativo" },
];

// Computed para converter o valor boolean para string no v-model
const statusString = computed({
	get: () => {
		if (form.ativo === undefined) return null;
		return form.ativo ? "true" : "false";
	},
	set: (value: string | number | null) => {
		if (value === null) {
			form.ativo = undefined;
		} else {
			form.ativo = value === "true";
		}
	},
});
</script>

<template>
	<UiModal :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
		<template #header>
			<div class="flex items-center gap-3">
				<Icon name="lucide:edit" class="w-5 h-5 text-gray-600 dark:text-gray-400" />
				<div>
					<h3 class="text-lg font-semibold text-gray-900 dark:text-white">Editar Membro</h3>
					<p class="text-sm text-gray-600 dark:text-gray-400">
						{{ nomeCompleto }}
					</p>
				</div>
			</div>
		</template>

		<template #default>
			<div v-if="membro" class="space-y-6">
				<!-- Informações Atuais -->
				<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
					<h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Informações Atuais</h4>
					<div class="grid grid-cols-2 gap-4 text-sm">
						<div>
							<span class="text-gray-600 dark:text-gray-400">Cargo:</span>
							<span class="ml-2 font-medium">{{ cargoAtual }}</span>
						</div>
						<div>
							<span class="text-gray-600 dark:text-gray-400">Status:</span>
							<span class="ml-2 font-medium">
								{{ membro.ativo ? "Ativo" : "Inativo" }}
							</span>
						</div>
					</div>
				</div>

				<!-- Formulário de Edição -->
				<div class="space-y-4">
					<!-- Campo Cargo -->
					<UiFormField
						label="Cargo"
						:error="errors.cargo"
						description="Selecione o novo cargo para o membro"
					>
						<CargoSelect
							v-model="form.cargo"
							:cargos-disponiveis="cargosDisponiveis"
							:error="!!errors.cargo"
						/>
					</UiFormField>

					<!-- Campo Status -->
					<UiFormField
						label="Status"
						:error="errors.ativo"
						description="Defina se o membro está ativo ou inativo"
					>
						<UiSelect
							v-model="statusString"
							:options="opcoesStatus"
							placeholder="Selecione o status"
						/>
					</UiFormField>
				</div>
			</div>
		</template>

		<template #footer>
			<div class="flex justify-end gap-3">
				<UiButton variant="outline" :disabled="loading" @click="handleClose"> Cancelar </UiButton>
				<UiButton :loading="loading" @click="handleSalvar"> Salvar Alterações </UiButton>
			</div>
		</template>
	</UiModal>
</template>
