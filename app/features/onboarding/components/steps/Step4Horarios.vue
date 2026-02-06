<script setup lang="ts">
/**
 * 📌 Step4Horarios - Etapa 4 do Onboarding (SIMPLIFICADO)
 *
 * Interface simplificada para configuração de horários:
 * - Visão geral da semana em cards compactos
 * - Editor detalhado por dia
 * - UX otimizada e sem confusão de presets
 */

import type { Step4Horarios } from "../../types/onboarding";
import type { HorarioFuncionamento } from "#shared/types/estabelecimentos";
import { DIAS_SEMANA_LABELS } from "#shared/constants/estabelecimento";
import WeekOverview from "~/components/ui/WeekOverview.vue";
import DayEditor from "~/components/ui/DayEditor.vue";

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
 * Estado do editor
 */
const editorState = ref({
	diaSelecionado: null as string | null,
});

/**
 * Nome completo do dia selecionado
 */
const nomeDiaCompleto = computed((): string => {
	if (!editorState.value.diaSelecionado) return "";
	return DIAS_SEMANA_LABELS[editorState.value.diaSelecionado] || editorState.value.diaSelecionado;
});

/**
 * Horário do dia selecionado para edição
 */
const horarioSelecionado = computed(() => {
	if (!editorState.value.diaSelecionado) return null;

	const horario =
		formData.value.horarios.find((h) => h.dia_semana === editorState.value.diaSelecionado) || null;

	return horario;
});

/**
 * Verificar se pelo menos um dia está aberto (validação)
 */
const temDiaAberto = computed((): boolean => {
	return formData.value.horarios.some((horario) => horario.aberto);
});

/**
 * Estatísticas dos horários
 */
const estatisticas = computed(() => {
	const diasAbertos = formData.value.horarios.filter((h) => h.aberto);
	const horarioMaisComum = diasAbertos.reduce(
		(acc, horario) => {
			const key = `${horario.horario_abertura}-${horario.horario_fechamento}`;
			acc[key] = (acc[key] || 0) + 1;
			return acc;
		},
		{} as Record<string, number>,
	);

	const horarioPopular = Object.keys(horarioMaisComum).reduce(
		(a, b) => (horarioMaisComum[a]! > horarioMaisComum[b]! ? a : b),
		"",
	);

	return {
		diasAbertos: diasAbertos.length,
		diasFechados: 7 - diasAbertos.length,
		horarioPopular: horarioPopular || "Não definido",
	};
});

/**
 * Atualizar horário específico
 */
const updateHorario = (diaSemana: string, updates: Partial<HorarioFuncionamento>): void => {
	const newHorarios = formData.value.horarios.map((horario) => {
		if (horario.dia_semana === diaSemana) {
			return { ...horario, ...updates };
		}
		return horario;
	});

	// Type assertion para resolver conflito entre tipos do schema e tipos do banco
	formData.value = { ...formData.value, horarios: newHorarios as typeof formData.value.horarios };
};

/**
 * Selecionar dia para edição
 */
const selecionarDia = (diaSemana: string): void => {
	editorState.value.diaSelecionado = diaSemana;
};

/**
 * Toggle status de um dia
 */
const toggleDia = (diaSemana: string, aberto: boolean): void => {
	updateHorario(diaSemana, { aberto });
};

/**
 * Atualizar horário do dia selecionado
 */
const atualizarHorarioSelecionado = (horario: HorarioFuncionamento): void => {
	updateHorario(horario.dia_semana, horario);
};

/**
 * Fechar editor
 */
const fecharEditor = (): void => {
	editorState.value.diaSelecionado = null;
};
</script>

<template>
	<div class="space-y-6">
		<!-- Card 1: Visão Geral da Semana com Editor Integrado -->
		<UiCard>
			<template #header>
				<div class="flex items-center space-x-3">
					<div
						class="w-8 h-8 bg-[var(--primary-light)] rounded-lg flex items-center justify-center"
					>
						<Icon name="lucide:calendar" class="w-4 h-4 text-[var(--primary)]" />
					</div>
					<div>
						<h3 class="text-lg font-semibold text-gray-900 dark:text-white">Horários da Semana</h3>
						<p class="text-sm text-gray-600 dark:text-gray-400">
							Configuramos um horário comercial padrão. Clique nos cards para personalizar
						</p>
					</div>
				</div>
			</template>

			<!-- Visão Geral dos Dias -->
			<WeekOverview
				:horarios="formData.horarios"
				:selected-day="editorState.diaSelecionado"
				@select-day="selecionarDia"
				@toggle-day="toggleDia"
			/>

			<!-- Dica sobre Preset Inicial -->
			<div
				v-if="!editorState.diaSelecionado"
				class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mt-4"
			>
				<div class="flex items-center space-x-2">
					<Icon name="lucide:check-circle" class="w-4 h-4 text-green-600 dark:text-green-400" />
					<p class="text-sm text-green-700 dark:text-green-300">
						<strong>Horário comercial pré-configurado:</strong> Segunda a Sexta das 08:00 às 18:00.
						Personalize conforme sua necessidade clicando nos cards.
					</p>
				</div>
			</div>

			<!-- Editor Expandido (aparece abaixo do WeekOverview quando um dia é selecionado) -->
			<Transition
				enter-active-class="transition-all duration-300 ease-out"
				enter-from-class="opacity-0 transform -translate-y-4"
				enter-to-class="opacity-100 transform translate-y-0"
				leave-active-class="transition-all duration-200 ease-in"
				leave-from-class="opacity-100 transform translate-y-0"
				leave-to-class="opacity-0 transform -translate-y-4"
			>
				<div
					v-if="horarioSelecionado"
					class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
				>
					<!-- Indicador de Expansão -->
					<div class="flex items-center justify-center mb-4">
						<div
							class="flex items-center space-x-2 text-sm text-[var(--primary)] bg-[var(--primary-light)] px-3 py-1 rounded-full"
						>
							<Icon name="lucide:arrow-up" class="w-3 h-3" />
							<span>Editando {{ nomeDiaCompleto }}</span>
							<Icon name="lucide:arrow-up" class="w-3 h-3" />
						</div>
					</div>

					<!-- Cabeçalho do Editor -->
					<div class="flex items-center justify-between mb-4">
						<div class="flex items-center space-x-3">
							<div
								class="w-8 h-8 bg-[var(--primary-light)] rounded-lg flex items-center justify-center"
							>
								<Icon name="lucide:edit" class="w-4 h-4 text-[var(--primary)]" />
							</div>
							<div>
								<h4 class="text-lg font-semibold text-gray-900 dark:text-white">
									Configurar {{ nomeDiaCompleto }}
								</h4>
								<p class="text-sm text-gray-600 dark:text-gray-400">
									Defina os horários de funcionamento para este dia
								</p>
							</div>
						</div>
						<UiButton variant="ghost" size="sm" @click="fecharEditor">
							<Icon name="lucide:x" class="w-4 h-4" />
						</UiButton>
					</div>

					<!-- Conteúdo do Editor -->
					<DayEditor
						:horario="horarioSelecionado"
						:visible="!!editorState.diaSelecionado"
						@update:horario="atualizarHorarioSelecionado"
						@close="fecharEditor"
					/>
				</div>
			</Transition>
		</UiCard>

		<!-- Card 2: Status e Validação -->
		<UiCard>
			<template #header>
				<div class="flex items-center space-x-3">
					<div
						class="w-8 h-8 bg-[var(--primary-light)] rounded-lg flex items-center justify-center"
					>
						<Icon
							:name="temDiaAberto ? 'lucide:check-circle' : 'lucide:alert-triangle'"
							class="w-4 h-4"
							:class="temDiaAberto ? 'text-green-600' : 'text-red-600'"
						/>
					</div>
					<div>
						<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
							{{ temDiaAberto ? "Configuração Válida" : "Configuração Pendente" }}
						</h3>
						<p class="text-sm text-gray-600 dark:text-gray-400">
							{{
								temDiaAberto
									? "Seus horários estão configurados"
									: "Configure pelo menos um dia para continuar"
							}}
						</p>
					</div>
				</div>
			</template>

			<div class="space-y-4">
				<!-- Validação de Erro -->
				<div
					v-if="!temDiaAberto"
					class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
				>
					<div class="flex items-center space-x-3">
						<Icon name="lucide:alert-triangle" class="w-5 h-5 text-red-600 dark:text-red-400" />
						<div>
							<h4 class="font-semibold text-red-900 dark:text-red-100">Configuração Obrigatória</h4>
							<p class="text-sm text-red-700 dark:text-red-300">
								Configure pelo menos um dia de funcionamento para continuar
							</p>
						</div>
					</div>
				</div>

				<!-- Resumo de Sucesso -->
				<div
					v-else
					class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
				>
					<div class="flex items-center space-x-3">
						<Icon name="lucide:check-circle" class="w-5 h-5 text-green-600 dark:text-green-400" />
						<div>
							<h4 class="font-semibold text-green-900 dark:text-green-100">
								Horários Configurados
							</h4>
							<p class="text-sm text-green-700 dark:text-green-300">
								{{ estatisticas.diasAbertos }} dias abertos • Horário mais comum:
								{{ estatisticas.horarioPopular }}
							</p>
						</div>
					</div>
				</div>

				<!-- Dicas Importantes -->
				<div class="bg-[var(--primary-light)] border border-[var(--primary)] rounded-lg p-4">
					<div class="flex items-start space-x-3">
						<div
							class="w-6 h-6 bg-[var(--primary)] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
						>
							<Icon name="lucide:lightbulb" class="w-3 h-3 text-white" />
						</div>
						<div>
							<h4 class="font-semibold text-[var(--primary-dark)] mb-2">Como usar:</h4>
							<ul class="text-sm text-[var(--primary-dark)] space-y-1">
								<li>
									• <strong>Clique no círculo verde/vermelho</strong> para abrir/fechar rapidamente
								</li>
								<li>• <strong>Clique no card do dia</strong> para expandir o editor abaixo</li>
								<li>• Configure horários realistas para melhor experiência do cliente</li>
								<li>• Você pode alterar os horários a qualquer momento depois</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</UiCard>
	</div>
</template>
