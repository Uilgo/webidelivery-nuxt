<script setup lang="ts">
/**
 * 📌 Step4Horarios - Etapa 4 do Onboarding
 *
 * Configuração dos horários de funcionamento:
 * - Dias da semana com horários de abertura e fechamento
 * - Possibilidade de marcar dias como fechados
 * - Validação para pelo menos um dia aberto
 */

import { DIAS_SEMANA_LABELS } from "#shared/constants/estabelecimento";
import type { Step4Horarios } from "../../types/onboarding";
import type { HorarioFuncionamento } from "#shared/types/estabelecimentos";

/**
 * Props do componente
 */
interface Props {
	modelValue: Step4Horarios;
}

/**
 * Emits do componente
 */
interface Emits {
	"update:modelValue": [value: Step4Horarios];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

/**
 * Computed para v-model
 */
const formData = computed({
	get: () => props.modelValue,
	set: (value: Step4Horarios) => emit("update:modelValue", value),
});

/**
 * Labels dos dias da semana (usando constantes existentes)
 */
const diasSemanaLabels = DIAS_SEMANA_LABELS;

/**
 * Opções de horários (intervalos de 30 minutos)
 */
const horariosOptions = computed(() => {
	const options = [];
	for (let hour = 0; hour < 24; hour++) {
		for (let minute = 0; minute < 60; minute += 30) {
			const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
			options.push({
				value: timeString,
				label: timeString,
			});
		}
	}
	return options;
});

/**
 * Atualizar horário específico
 */
const updateHorario = (index: number, updates: Partial<HorarioFuncionamento>): void => {
	const newHorarios = [...formData.value.horarios];
	const currentHorario = newHorarios[index];
	if (currentHorario) {
		newHorarios[index] = { ...currentHorario, ...updates };
		formData.value = { ...formData.value, horarios: newHorarios };
	}
};

/**
 * Toggle dia aberto/fechado
 */
const toggleDia = (index: number): void => {
	const horario = formData.value.horarios[index];
	if (horario) {
		updateHorario(index, { aberto: !horario.aberto });
	}
};

/**
 * Aplicar horário para todos os dias
 */
const aplicarParaTodos = (abertura: string, fechamento: string): void => {
	const newHorarios = formData.value.horarios.map((horario) => ({
		...horario,
		horario_abertura: abertura,
		horario_fechamento: fechamento,
		aberto: true,
	}));
	formData.value = { ...formData.value, horarios: newHorarios };
};

/**
 * Aplicar horário para dias úteis (segunda a sexta)
 */
const aplicarDiasUteis = (abertura: string, fechamento: string): void => {
	const diasUteis = ["segunda", "terca", "quarta", "quinta", "sexta"];
	const newHorarios = formData.value.horarios.map((horario) => {
		if (diasUteis.includes(horario.dia_semana)) {
			return {
				...horario,
				horario_abertura: abertura,
				horario_fechamento: fechamento,
				aberto: true,
			};
		}
		return horario;
	});
	formData.value = { ...formData.value, horarios: newHorarios };
};

/**
 * Verificar se pelo menos um dia está aberto
 */
const temDiaAberto = computed((): boolean => {
	return formData.value.horarios.some((horario) => horario.aberto);
});

/**
 * Estados para aplicação rápida
 */
const quickApplyAbertura = ref("08:00");
const quickApplyFechamento = ref("18:00");
</script>

<template>
	<div class="space-y-6">
		<!-- Cabeçalho da etapa -->
		<div class="text-center">
			<h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
				Horários de Funcionamento
			</h3>
			<p class="text-gray-600 dark:text-gray-400">
				Configure os dias e horários que seu estabelecimento funciona
			</p>
		</div>

		<!-- Aplicação rápida -->
		<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
			<h4 class="font-medium text-gray-900 dark:text-white mb-3">Aplicação Rápida</h4>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="flex items-end space-x-2">
					<FormField label="Abertura" class="flex-1">
						<Select v-model="quickApplyAbertura" :options="horariosOptions" placeholder="08:00" />
					</FormField>
					<FormField label="Fechamento" class="flex-1">
						<Select v-model="quickApplyFechamento" :options="horariosOptions" placeholder="18:00" />
					</FormField>
				</div>
				<div class="flex items-end space-x-2">
					<UiButton
						variant="outline"
						size="sm"
						class="flex-1"
						@click="aplicarDiasUteis(quickApplyAbertura, quickApplyFechamento)"
					>
						Aplicar Dias Úteis
					</UiButton>
					<UiButton
						variant="outline"
						size="sm"
						class="flex-1"
						@click="aplicarParaTodos(quickApplyAbertura, quickApplyFechamento)"
					>
						Aplicar Todos
					</UiButton>
				</div>
			</div>
		</div>

		<!-- Lista de horários -->
		<div class="space-y-3">
			<div
				v-for="(horario, index) in formData.horarios"
				:key="horario.dia_semana"
				class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
			>
				<div class="flex items-center justify-between mb-3">
					<div class="flex items-center space-x-3">
						<Switch :model-value="horario.aberto" @update:model-value="toggleDia(index)" />
						<span class="font-medium text-gray-900 dark:text-white">
							{{ diasSemanaLabels[horario.dia_semana] }}
						</span>
					</div>
					<span v-if="!horario.aberto" class="text-sm text-gray-500 dark:text-gray-400">
						Fechado
					</span>
				</div>

				<!-- Horários (apenas se aberto) -->
				<div v-if="horario.aberto" class="grid grid-cols-2 gap-4">
					<FormField label="Abertura">
						<Select
							:model-value="horario.horario_abertura"
							:options="horariosOptions"
							placeholder="08:00"
							@update:model-value="
								(value: string) => updateHorario(index, { horario_abertura: value })
							"
						/>
					</FormField>
					<FormField label="Fechamento">
						<Select
							:model-value="horario.horario_fechamento"
							:options="horariosOptions"
							placeholder="18:00"
							@update:model-value="
								(value: string) => updateHorario(index, { horario_fechamento: value })
							"
						/>
					</FormField>
				</div>
			</div>
		</div>

		<!-- Validação -->
		<div
			v-if="!temDiaAberto"
			class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
		>
			<div class="flex items-center space-x-3">
				<Icon name="lucide:alert-triangle" class="w-5 h-5 text-red-600 dark:text-red-400" />
				<p class="text-sm text-red-700 dark:text-red-300">
					Você precisa configurar pelo menos um dia de funcionamento.
				</p>
			</div>
		</div>

		<!-- Dicas -->
		<div
			class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
		>
			<div class="flex items-start space-x-3">
				<Icon name="lucide:clock" class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
				<div class="text-sm">
					<p class="font-medium text-blue-900 dark:text-blue-100 mb-1">Dicas importantes:</p>
					<ul class="text-blue-700 dark:text-blue-300 space-y-1">
						<li>• Os clientes só poderão fazer pedidos nos horários configurados</li>
						<li>• Você pode alterar os horários a qualquer momento depois</li>
						<li>• Configure horários realistas para evitar problemas</li>
						<li>• Considere tempo de preparo e entrega</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</template>
