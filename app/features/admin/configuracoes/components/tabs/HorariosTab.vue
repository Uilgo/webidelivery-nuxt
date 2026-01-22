<script setup lang="ts">
/**
 * 📌 HorariosTab
 *
 * Tab de configuração de horários de funcionamento.
 * Layout 2 colunas: Visão Geral (40%) | Editor (60%)
 */

import type { HorarioFuncionamento } from "#shared/types/estabelecimentos";
import { useHorariosFuncionamento } from "../../composables/useHorariosFuncionamento";
import WeekOverview from "~/components/ui/WeekOverview.vue";
import DayEditor from "~/components/ui/DayEditor.vue";
import ExcecoesHorarioDrawer from "../shared/ExcecoesHorarioDrawer.vue";
import { DIAS_SEMANA_LABELS } from "#shared/constants/estabelecimento";

// Composable de horários
const { horarios, excecoes, loading, saving, salvarHorarios } = useHorariosFuncionamento();

// Estado do drawer de exceções
const drawerExcecoesAberto = ref(false);

// Estado do editor
const editorState = ref({
	diaSelecionado: "segunda" as string, // Sempre ter um dia selecionado
});

// Nome completo do dia selecionado
const nomeDiaCompleto = computed((): string => {
	return DIAS_SEMANA_LABELS[editorState.value.diaSelecionado] || editorState.value.diaSelecionado;
});

// Horário do dia selecionado para edição
const horarioSelecionado = computed(() => {
	return horarios.value.find((h) => h.dia_semana === editorState.value.diaSelecionado) || null;
});

// Verificar se pelo menos um dia está aberto
const temDiaAberto = computed((): boolean => {
	return horarios.value.some((horario) => horario.aberto);
});

// Estatísticas dos horários
const estatisticas = computed(() => {
	const diasAbertos = horarios.value.filter((h) => h.aberto);
	const totalPeriodos = diasAbertos.reduce((acc, h) => acc + (h.periodos?.length || 0), 0);

	// Cálculo de horas totais
	let totalMinutos = 0;
	diasAbertos.forEach((h) => {
		h.periodos?.forEach((p) => {
			const abertura = p.horario_abertura;
			const fechamento = p.horario_fechamento;
			if (!abertura || !fechamento) return;

			const [startH, startM] = abertura.split(":").map(Number);
			const [endH, endM] = fechamento.split(":").map(Number);

			if (startH === undefined || startM === undefined || endH === undefined || endM === undefined)
				return;

			let diff = endH * 60 + endM - (startH * 60 + startM);
			if (diff <= 0) diff += 24 * 60; // Funcionamento noturno
			totalMinutos += diff;
		});
	});

	return {
		diasAbertos: diasAbertos.length,
		diasFechados: 7 - diasAbertos.length,
		totalPeriodos,
		horasSemanais: Math.floor(totalMinutos / 60),
		percentual: Math.round((diasAbertos.length / 7) * 100),
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

// Salvar horários
const handleSave = async () => {
	await salvarHorarios(horarios.value);
};

// Abrir drawer de exceções
const abrirDrawerExcecoes = (): void => {
	drawerExcecoesAberto.value = true;
};

// Próximas exceções (ordenadas por data)
const proximasExcecoes = computed(() => {
	const hoje = new Date();
	hoje.setHours(0, 0, 0, 0);

	return excecoes.value
		.filter((exc) => {
			const dataExcecao = new Date(exc.data + "T00:00:00");
			return dataExcecao >= hoje;
		})
		.sort((a, b) => a.data.localeCompare(b.data))
		.slice(0, 2); // Mostrar apenas as 2 próximas
});

// Formatar data para exibição
const formatarDataExcecao = (data: string): string => {
	const date = new Date(data + "T00:00:00");
	return date.toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});
};
</script>

<template>
	<div class="h-full flex flex-col">
		<!-- Skeleton de Loading -->
		<div v-if="loading" class="space-y-4">
			<UiSkeleton class="h-32 w-full" />
			<UiSkeleton class="h-24 w-full" />
		</div>

		<!-- Layout Principal: 2 Colunas com Cards -->
		<div v-else class="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-5 gap-4">
			<div class="lg:col-span-3 flex min-h-0">
				<UiCard class="flex-1" fill-height no-padding size="lg">
					<template #header>
						<div class="flex items-center gap-2">
							<Icon name="lucide:calendar" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
							<h3 class="text-sm font-semibold text-gray-900 dark:text-white">Visão Geral</h3>
						</div>
					</template>

					<!-- Conteúdo com scroll -->
					<div class="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
						<!-- Visão Geral dos Dias -->
						<div>
							<WeekOverview
								:horarios="horarios"
								:selected-day="editorState.diaSelecionado"
								@select-day="selecionarDia"
								@toggle-day="toggleDia"
							/>
						</div>

						<!-- Estatísticas em Grid Organizado -->
						<div class="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
							<div class="flex items-center gap-2">
								<Icon
									name="lucide:bar-chart-3"
									class="w-4 h-4 text-primary-600 dark:text-primary-400"
								/>
								<h4 class="text-sm font-medium text-gray-900 dark:text-white">
									Resumo da Operação
								</h4>
							</div>

							<!-- Grid de Estatísticas -->
							<div class="space-y-4">
								<div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
									<!-- Dias Abertos -->
									<div
										class="bg-white dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700 rounded-xl p-2.5 text-center"
									>
										<p
											class="text-[9px] uppercase tracking-wider font-semibold text-gray-500 mb-0.5"
										>
											Abertos
										</p>
										<div class="flex items-baseline justify-center gap-1">
											<span class="text-lg font-bold text-gray-900 dark:text-white">{{
												estatisticas.diasAbertos
											}}</span>
											<span class="text-[10px] text-gray-500">/ 7</span>
										</div>
									</div>

									<!-- Horas Semanais -->
									<div
										class="bg-white dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700 rounded-xl p-2.5 text-center"
									>
										<p
											class="text-[9px] uppercase tracking-wider font-semibold text-gray-500 mb-0.5 whitespace-nowrap"
										>
											H. Semanais
										</p>
										<div class="flex items-baseline justify-center gap-1">
											<span class="text-lg font-bold text-gray-900 dark:text-white">{{
												estatisticas.horasSemanais
											}}</span>
											<span class="text-[10px] text-gray-500">hrs</span>
										</div>
									</div>

									<!-- Períodos -->
									<div
										class="bg-white dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700 rounded-xl p-2.5 text-center"
									>
										<p
											class="text-[9px] uppercase tracking-wider font-semibold text-gray-500 mb-0.5"
										>
											Períodos
										</p>
										<span class="text-lg font-bold text-gray-900 dark:text-white">{{
											estatisticas.totalPeriodos
										}}</span>
									</div>

									<!-- Disponibilidade -->
									<div
										class="bg-white dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700 rounded-xl p-2.5 text-center"
									>
										<p
											class="text-[9px] uppercase tracking-wider font-semibold text-gray-500 mb-0.5 whitespace-nowrap"
										>
											Disponibilidade
										</p>
										<span class="text-lg font-bold text-primary-600 dark:text-primary-400"
											>{{ estatisticas.percentual }}%</span
										>
									</div>
								</div>

								<!-- Alertas e Dicas -->
								<div class="space-y-2">
									<!-- Próximas Datas Especiais -->
									<div
										class="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/50 rounded-xl p-3"
									>
										<div class="flex items-center justify-between mb-2">
											<div class="flex items-center gap-2">
												<Icon name="lucide:calendar-clock" class="w-4 h-4 text-amber-500" />
												<span class="text-xs font-semibold text-gray-900 dark:text-white"
													>Datas Especiais ({{ excecoes.length }})</span
												>
											</div>
											<button
												type="button"
												class="text-[10px] text-primary-600 font-bold hover:underline"
												@click="abrirDrawerExcecoes"
											>
												Gerenciar
											</button>
										</div>

										<!-- Lista de próximas exceções -->
										<div v-if="proximasExcecoes.length > 0" class="space-y-3">
											<div
												v-for="excecao in proximasExcecoes"
												:key="excecao.id"
												class="flex items-center justify-between bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700"
											>
												<div class="flex flex-col gap-1">
													<span class="text-sm font-bold text-gray-800 dark:text-gray-200">{{
														excecao.nome
													}}</span>
													<span class="text-xs text-gray-500">{{
														formatarDataExcecao(excecao.data)
													}}</span>
												</div>
												<span
													:class="[
														'px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide',
														excecao.aberto
															? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
															: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
													]"
													>{{ excecao.aberto ? "H. Especial" : "Fechado" }}</span
												>
											</div>
										</div>

										<!-- Estado vazio -->
										<div
											v-else
											class="text-center py-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700"
										>
											<p class="text-[11px] text-gray-500">Nenhuma exceção cadastrada</p>
											<button
												type="button"
												class="text-[10px] text-primary-600 font-bold hover:underline mt-1"
												@click="abrirDrawerExcecoes"
											>
												Adicionar feriados e datas especiais
											</button>
										</div>
									</div>

									<div
										v-if="!temDiaAberto"
										class="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 rounded-xl p-3 flex items-center gap-3"
									>
										<Icon name="lucide:alert-triangle" class="w-5 h-5 text-red-500" />
										<p class="text-xs text-red-700 dark:text-red-300 font-medium">
											Atenção: Seu estabelecimento está configurado como fechado todos os dias.
										</p>
									</div>

									<div
										class="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-800/50 rounded-xl p-3 flex items-start gap-3"
									>
										<Icon name="lucide:lightbulb" class="w-5 h-5 text-blue-500 flex-shrink-0" />
										<div class="space-y-1">
											<p class="text-xs text-blue-800 dark:text-blue-200 font-semibold italic">
												Dica de Sucesso:
											</p>
											<p class="text-[11px] text-blue-700/80 dark:text-blue-300/80 leading-relaxed">
												Mantenha seus horários atualizados para evitar cancelamentos. Clientes
												valorizam estabelecimentos que cumprem os horários informados, especialmente
												em feriados.
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</UiCard>
			</div>

			<div class="lg:col-span-2 flex min-h-0">
				<UiCard class="flex-1" fill-height no-padding size="lg">
					<template #header>
						<div class="flex items-center gap-2">
							<Icon name="lucide:edit" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
							<h3 class="text-sm font-semibold text-gray-900 dark:text-white">
								Configurar {{ nomeDiaCompleto }}
							</h3>
						</div>
					</template>

					<!-- Conteúdo com scroll -->
					<div class="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
						<!-- Editor de Horário -->
						<div v-if="horarioSelecionado">
							<DayEditor
								:horario="horarioSelecionado"
								:visible="true"
								@update:horario="atualizarHorarioSelecionado"
							/>
						</div>

						<!-- Estado vazio -->
						<div v-else class="flex items-center justify-center py-12">
							<div class="text-center">
								<Icon name="lucide:clock" class="w-12 h-12 text-gray-400 mx-auto mb-3" />
								<p class="text-sm text-gray-600 dark:text-gray-400">
									Selecione um dia para configurar
								</p>
							</div>
						</div>
					</div>

					<!-- Botão de Salvar - FIXO NO FOOTER -->
					<template #footer>
						<div class="p-0">
							<UiButton
								:loading="saving"
								:disabled="saving || !temDiaAberto"
								class="w-full"
								size="lg"
								@click="handleSave"
							>
								<template #iconLeft>
									<Icon name="lucide:save" class="w-4 h-4" />
								</template>
								{{ saving ? "Salvando..." : "Salvar Horários" }}
							</UiButton>
						</div>
					</template>
				</UiCard>
			</div>
		</div>

		<!-- Drawer de Exceções de Horários -->
		<ExcecoesHorarioDrawer v-model="drawerExcecoesAberto" />
	</div>
</template>
