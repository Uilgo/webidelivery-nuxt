<script setup lang="ts">
/**
 * 📌 CargoSelect
 *
 * Componente de seleção de cargo que respeita hierarquia de permissões.
 * Exibe apenas os cargos que o usuário pode atribuir.
 */

import type { CargoEquipe } from "../../types/equipe";
import { formatarCargo, iconeCargo } from "../../utils/cargo-helpers";

interface Props {
	modelValue?: CargoEquipe;
	cargosDisponiveis: CargoEquipe[];
	placeholder?: string;
	error?: boolean;
	disabled?: boolean;
}

interface Emits {
	"update:modelValue": [cargo: CargoEquipe | undefined];
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: undefined,
	placeholder: "Selecione um cargo",
	error: false,
	disabled: false,
});

const emit = defineEmits<Emits>();

// Opções do select baseadas nos cargos disponíveis (convertendo para string)
const opcoes = computed(() => [
	{ value: "", label: props.placeholder }, // Valor vazio para placeholder
	...props.cargosDisponiveis.map((cargo) => ({
		value: cargo, // Mantém como string (CargoEquipe é string)
		label: formatarCargo(cargo),
		icon: iconeCargo(cargo),
	})),
]);

// Computed para converter entre CargoEquipe e string
const valorString = computed({
	get: () => {
		return props.modelValue || "";
	},
	set: (value: string | number | null) => {
		if (!value || value === "" || value === null) {
			emit("update:modelValue", undefined);
		} else {
			emit("update:modelValue", value as CargoEquipe);
		}
	},
});

// Handler para mudança de valor
const handleChange = (value: string | number | null) => {
	valorString.value = value;
};
</script>

<template>
	<UiSelect
		:model-value="valorString"
		:options="opcoes"
		:placeholder="placeholder"
		:error="error"
		:disabled="disabled"
		@update:model-value="handleChange"
	>
		<template #option="{ option }">
			<div v-if="option.value" class="flex items-center gap-2">
				<Icon :name="option.icon" class="w-4 h-4" />
				<span>{{ option.label }}</span>
			</div>
			<span v-else class="text-gray-500">{{ option.label }}</span>
		</template>
	</UiSelect>
</template>
