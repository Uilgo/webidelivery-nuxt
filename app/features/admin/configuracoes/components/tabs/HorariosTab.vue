<script setup lang="ts">
/**
 * 📌 HorariosTab
 *
 * Tab de configuração de horários de funcionamento.
 * Reutiliza 100% dos componentes do onboarding Step4.
 */

import type { HorarioFuncionamento } from "#shared/types/estabelecimentos";
import { useHorariosFuncionamento } from "../../composables/useHorariosFuncionamento";
import ConfiguracaoCard from "../shared/ConfiguracaoCard.vue";
import WeekOverview from "~/components/ui/WeekOverview.vue";
import DayEditor from "~/components/ui/DayEditor.vue";
import { DIAS_SEMANA_LABELS } from "#shared/constants/estabelecimento";

// Composable de horários
const { horarios, loading, saving, salvarHorarios } = useHorariosFuncionamento();

// Estado do editor
const editorState = ref({
	diaSelecionado: null as string | null,
});

// Nome completo do dia selecionado
const nomeDiaCompleto = computed((): string => {
	if (!editorState.value.diaSelecionado) return "";
	return DIAS_SEMANA_LABELS[editorState.value.diaSelecionado] || editorState.value.diaSelecionado;
});

// Horário do dia selecionado para edição
const horarioSelecionado = computed(() => {
	if (!editorState.value.diaSelecionado) return null;
	return horarios.value.find((h) => h.dia_semana === editorState.value.diaSelecionado) || null;
});

// Verificar se pelo menos um dia está aberto
const temDiaAberto = computed((): boolean => {
	return horarios.value.some((horario) => horario.aberto);
});

// Estatísticas dos horários
const estatisticas = computed(() => {
	const diasAbertos = horarios.value.filter((h) => h.aberto);
	return {
		diasAbertos: diasAbertos.length,
		diasFechados: 7 - diasAbertos.length,
	};
});

// Atualizar horário específico
const updateHorario = (diaSemana: string, updates: Partial<HorarioFuncionamento>): void => {
	const newHorarios = horarios.value.map((horario) => {
		if (horario.dia_semana === diaSemana) {
			return { ...horario, ...updates };
		}
		return horario;
	});
	horarios.value = newHorarios;
};

// Selecionar dia para edição
const selecionarDia = (diaSemana: string): void => {
	editorState.value.diaSelecionado = diaSemana;
};

// Toggle status de um dia
const toggleDia = (diaSemana: string, aberto: boolean): void => {
	updateHorario(diaSemana, { aberto });
};

// Atualizar horário do dia selecionado
const atualizarHorarioSelecionado = (horario: HorarioFuncionamento): void => {
	updateHorario(horario.dia_semana, horario);
};

// Fechar editor
const fecharEditor = (): void => {
	editorState.value.diaSelecionado = null;
};

// Salvar horários
const handleSave = async () => {
	await salvarHorarios(horarios.value);
};
</script>

<template>
	<div class="space-y-6">
		<ConfiguracaoCard
			title="Horários de Funcionamento"
			description="Configure os dias e horários em que seu estabelecimento estará aberto para receber pedidos."
			icon="lucide:clock"
			:loading="saving"
			:disabled="!temDiaAberto"
			@save="handleSave"
		>
			<!-- Skeleton de Loading -->
			<div v-if="loading" class="space-y-4">
				<UiSkeleton class="h-32 w-full" />
				<UiSkeleton class="h-24 w-full" />
			</div>

			<!-- Conteúdo -->
			<div v-else class="space-y-6">
				<!-- Visão Geral dos Dias -->
				<WeekOverview
					:horarios="horarios"
					:selected-day="editorState.diaSelecionado"
					@select-day="selecionarDia"
					@toggle-day="toggleDia"
				/>

				<!-- Editor Expandido -->
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

				<!-- Status e Validação -->
				<div class="space-y-4">
					<!-- Validação de Erro -->
					<div
						v-if="!temDiaAberto"
						class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
					>
						<div class="flex items-center space-x-3">
							<Icon name="lucide:alert-triangle" class="w-5 h-5 text-red-600 dark:text-red-400" />
							<div>
								<h4 class="font-semibold text-red-900 dark:text-red-100">
									Configuração Obrigatória
								</h4>
								<p class="text-sm text-red-700 dark:text-red-300">
									Configure pelo menos um dia de funcionamento para salvar
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
									{{ estatisticas.diasAbertos }} dias abertos • {{ estatisticas.diasFechados }} dias
									fechados
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</ConfiguracaoCard>
	</div>
</template>
