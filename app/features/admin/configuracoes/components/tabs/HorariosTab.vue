<script setup lang="ts">
/**
 * 📌 HorariosTab
 *
 * Tab de configuração de horários de funcionamento.
 * Design premium de duas colunas (Resumo + Editor).
 */

import { useHorariosFuncionamento } from "../../composables/useHorariosFuncionamento";
import { useToast } from "~/composables/ui/useToast";
import WeekOverview from "@/components/ui/WeekOverview.vue";
import DayEditor from "@/components/ui/DayEditor.vue";
import ExcecoesHorarioDrawer from "../shared/ExcecoesHorarioDrawer.vue";
import type {
	HorarioFuncionamento,
	HorarioExcecao,
	PeriodoFuncionamento,
} from "#shared/types/estabelecimentos";

// Composable de horários
const { horarios, excecoes, loading, saving, salvarHorarios } = useHorariosFuncionamento();
const { success } = useToast();

// Armazenar valores iniciais para comparação
const valoresIniciais = ref<HorarioFuncionamento[] | null>(null);

/**
 * Computed para detectar se houve mudanças nos horários
 */
const hasChanges = computed(() => {
	if (!valoresIniciais.value) return false;
	return JSON.stringify(horarios.value) !== JSON.stringify(valoresIniciais.value);
});

// Estado do drawer de exceções
const drawerExcecoesAberto = ref(false);

// Ref para o DayEditor
const dayEditorRef = ref<InstanceType<typeof DayEditor> | null>(null);

// Estado do editor
const editorState = ref({
	diaSelecionado: "segunda_feira",
	mostrarExcecoes: false,
});

// Computed para estatísticas (Implementado localmente pois não está no composable)
const estatisticas = computed(() => {
	const diasAbertos = (horarios.value as HorarioFuncionamento[]).filter((h) => h.aberto).length;
	const totalPeriodos = (horarios.value as HorarioFuncionamento[]).reduce(
		(acc: number, h: HorarioFuncionamento) => acc + (h.periodos?.length || 0),
		0,
	);

	// Calcular horas semanais aproximadas
	let totalMinutos = 0;
	(horarios.value as HorarioFuncionamento[]).forEach((h: HorarioFuncionamento) => {
		if (h.aberto && h.periodos) {
			h.periodos.forEach((p: PeriodoFuncionamento) => {
				if (p.horario_abertura && p.horario_fechamento) {
					const [h1, m1] = p.horario_abertura.split(":").map(Number);
					const [h2, m2] = p.horario_fechamento.split(":").map(Number);
					if (h1 !== undefined && m1 !== undefined && h2 !== undefined && m2 !== undefined) {
						totalMinutos += h2 * 60 + m2 - (h1 * 60 + m1);
					}
				}
			});
		}
	});

	const horasSemanais = Math.round(totalMinutos / 60);
	const percentual = Math.round((diasAbertos / 7) * 100);

	return {
		diasAbertos,
		totalPeriodos,
		horasSemanais,
		percentual,
	};
});

// Computed para próximas exceções (Implementado localmente)
const proximasExcecoes = computed(() => {
	const hoje = new Date();
	hoje.setHours(0, 0, 0, 0);

	return (excecoes.value as HorarioExcecao[])
		.filter((ex: HorarioExcecao) => new Date(ex.data) >= hoje)
		.sort(
			(a: HorarioExcecao, b: HorarioExcecao) =>
				new Date(a.data).getTime() - new Date(b.data).getTime(),
		)
		.slice(0, 3);
});

// Computed para o nome do dia selecionado
const nomeDiaCompleto = computed(() => {
	const nomes: Record<string, string> = {
		segunda_feira: "Segunda-feira",
		terca_feira: "Terça-feira",
		quarta_feira: "Quarta-feira",
		quinta_feira: "Quinta-feira",
		sexta_feira: "Sexta-feira",
		sabado: "Sábado",
		domingo: "Domingo",
	};
	return nomes[editorState.value.diaSelecionado];
});

// Obter o horário do dia selecionado (Fix implicit any)
const horarioSelecionado = computed(() => {
	return (horarios.value as HorarioFuncionamento[]).find(
		(h: HorarioFuncionamento) => h.dia_semana === editorState.value.diaSelecionado,
	);
});

// Ações
const selecionarDia = (dia: string) => {
	editorState.value.diaSelecionado = dia;
};

const toggleDia = async (dia: string) => {
	const index = horarios.value.findIndex((h) => h.dia_semana === dia);
	if (index !== -1) {
		const novosHorarios = [...horarios.value];
		const horarioAtual = novosHorarios[index];
		if (horarioAtual) {
			novosHorarios[index] = {
				...horarioAtual,
				aberto: !horarioAtual.aberto,
			} as HorarioFuncionamento;

			// Verificar se houve mudanças antes de salvar
			if (JSON.stringify(novosHorarios) === JSON.stringify(valoresIniciais.value)) {
				success({
					title: "Nenhuma alteração",
					description: "Não há alterações para salvar",
				});
				return;
			}

			const sucesso = await salvarHorarios(novosHorarios);

			// Atualizar valores iniciais se salvou com sucesso
			if (sucesso) {
				valoresIniciais.value = JSON.parse(JSON.stringify(novosHorarios));
			}
		}
	}
};

const salvarHorario = async (horarioAtualizado: HorarioFuncionamento) => {
	const index = horarios.value.findIndex((h) => h.dia_semana === horarioAtualizado.dia_semana);
	if (index !== -1) {
		const novosHorarios = [...horarios.value];
		novosHorarios[index] = horarioAtualizado;

		// Verificar se houve mudanças antes de salvar
		if (JSON.stringify(novosHorarios) === JSON.stringify(valoresIniciais.value)) {
			success({
				title: "Nenhuma alteração",
				description: "Não há alterações para salvar",
			});
			return;
		}

		const sucesso = await salvarHorarios(novosHorarios);

		// Atualizar valores iniciais se salvou com sucesso
		if (sucesso) {
			valoresIniciais.value = JSON.parse(JSON.stringify(novosHorarios));
		}
	}
};

// Watch para armazenar valores iniciais quando horários carregarem
watch(
	horarios,
	(newHorarios) => {
		if (newHorarios && newHorarios.length > 0 && !valoresIniciais.value) {
			// Fazer deep copy para evitar referências
			valoresIniciais.value = JSON.parse(JSON.stringify(newHorarios));
		}
	},
	{ immediate: true, deep: true },
);

const selecionarDiaHandler = (dia: string) => {
	selecionarDia(dia);
};

const abrirDrawerExcecoes = (): void => {
	drawerExcecoesAberto.value = true;
};

const handleSalvarClick = (): void => {
	if (dayEditorRef.value) {
		// @ts-ignore - chamar método interno do componente
		dayEditorRef.value.salvar();
	}
};

const formatarDataExcecao = (dataStr: string) => {
	const data = new Date(dataStr);
	return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
};

const temDiaAberto = computed(() => estatisticas.value.diasAbertos > 0);
</script>

<template>
	<div class="h-full flex flex-col">
		<!-- Skeleton de Loading -->
		<div v-if="loading" class="space-y-4">
			<UiSkeleton class="h-32 w-full" />
			<UiSkeleton class="h-64 w-full" />
		</div>

		<!-- Layout Principal: 2 Colunas -->
		<div v-else class="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-5 gap-4">
			<!-- COLUNA ESQUERDA: RESUMO (3/5) -->
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
								@select-day="selecionarDiaHandler"
								@toggle-day="toggleDia"
							/>
						</div>

						<!-- Estatísticas em Grid Organizado -->
						<div class="space-y-4 pt-4 border-none">
							<div class="flex items-center gap-2">
								<Icon
									name="lucide:bar-chart-3"
									class="w-4 h-4 text-primary-600 dark:text-primary-400"
								/>
								<h4
									class="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider opacity-60"
								>
									Resumo da Operação
								</h4>
							</div>

							<!-- Grid de Estatísticas -->
							<div class="space-y-4">
								<div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
									<!-- Dias Abertos -->
									<div
										class="bg-white dark:bg-gray-800/40 shadow-sm border-none rounded-xl p-3 text-center transition-all hover:shadow-md"
									>
										<p class="text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">
											Abertos
										</p>
										<div class="flex items-baseline justify-center gap-1">
											<span class="text-xl font-bold text-gray-900 dark:text-white">{{
												estatisticas.diasAbertos
											}}</span>
											<span class="text-[10px] text-gray-400">/ 7</span>
										</div>
									</div>

									<!-- Horas Semanais -->
									<div
										class="bg-white dark:bg-gray-800/40 shadow-sm border-none rounded-xl p-3 text-center transition-all hover:shadow-md"
									>
										<p class="text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">
											H. Semanais
										</p>
										<div class="flex items-baseline justify-center gap-1">
											<span class="text-xl font-bold text-gray-900 dark:text-white">{{
												estatisticas.horasSemanais
											}}</span>
											<span class="text-[10px] text-gray-400">hrs</span>
										</div>
									</div>

									<!-- Períodos -->
									<div
										class="bg-white dark:bg-gray-800/40 shadow-sm border-none rounded-xl p-3 text-center transition-all hover:shadow-md"
									>
										<p class="text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">
											Períodos
										</p>
										<span class="text-xl font-bold text-gray-900 dark:text-white">{{
											estatisticas.totalPeriodos
										}}</span>
									</div>

									<!-- Disponibilidade -->
									<div
										class="bg-white dark:bg-gray-800/40 shadow-sm border-none rounded-xl p-3 text-center transition-all hover:shadow-md"
									>
										<p class="text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">
											Status
										</p>
										<span class="text-xl font-bold text-primary-600 dark:text-primary-400"
											>{{ estatisticas.percentual }}%</span
										>
									</div>
								</div>

								<!-- Alertas e Dicas -->
								<div class="space-y-3">
									<!-- Próximas Datas Especiais -->
									<div
										class="bg-amber-50/50 dark:bg-amber-900/10 shadow-sm border-none rounded-xl p-4"
									>
										<div class="flex items-center justify-between mb-3">
											<div class="flex items-center gap-2">
												<Icon name="lucide:calendar-clock" class="w-4 h-4 text-amber-500" />
												<span class="text-sm font-bold text-gray-900 dark:text-white"
													>Datas Especiais</span
												>
											</div>
											<button
												type="button"
												class="text-[10px] bg-primary-600 text-white px-2 py-1 rounded-md font-bold uppercase tracking-wide hover:bg-primary-700 transition-colors"
												@click="abrirDrawerExcecoes"
											>
												Gerenciar
											</button>
										</div>

										<!-- Lista de próximas exceções -->
										<div v-if="proximasExcecoes.length > 0" class="space-y-2">
											<div
												v-for="excecao in proximasExcecoes"
												:key="excecao.id"
												class="flex items-center justify-between bg-white/50 dark:bg-gray-800/50 shadow-sm p-3 rounded-lg border-none"
											>
												<div class="flex flex-col">
													<span class="text-sm font-bold text-gray-800 dark:text-gray-200">{{
														excecao.nome
													}}</span>
													<span class="text-[10px] text-gray-500">{{
														formatarDataExcecao(excecao.data)
													}}</span>
												</div>
												<span
													:class="[
														'px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider',
														excecao.aberto
															? 'bg-orange-100 text-orange-600'
															: 'bg-red-100 text-red-600',
													]"
												>
													{{ excecao.aberto ? "Horário Especial" : "Fechado" }}
												</span>
											</div>
										</div>

										<div
											v-else
											class="text-center py-4 bg-white/30 dark:bg-gray-800/30 rounded-lg border-none shadow-sm"
										>
											<p class="text-[11px] text-gray-500 italic">Nenhuma exceção cadastrada</p>
										</div>
									</div>

									<div
										v-if="!temDiaAberto"
										class="bg-red-50 dark:bg-red-900/10 shadow-sm border-none rounded-xl p-4 flex items-center gap-3"
									>
										<Icon name="lucide:alert-triangle" class="w-5 h-5 text-red-500" />
										<p class="text-xs text-red-700 dark:text-red-300 font-medium">
											Atenção: Seu estabelecimento está configurado como fechado todos os dias.
										</p>
									</div>

									<div
										class="bg-blue-50/50 dark:bg-blue-900/10 shadow-sm border-none rounded-xl p-4 flex items-start gap-3"
									>
										<Icon name="lucide:lightbulb" class="w-5 h-5 text-blue-500 flex-shrink-0" />
										<div class="space-y-1">
											<p class="text-xs text-blue-800 dark:text-blue-200 font-bold">
												Dica de Sucesso:
											</p>
											<p class="text-[11px] text-blue-700/80 dark:text-blue-300/80 leading-relaxed">
												Mantenha seus horários atualizados para evitar cancelamentos e frustração
												dos clientes.
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</UiCard>
			</div>

			<!-- COLUNA DIREITA: EDITOR -->
			<div class="lg:col-span-2 flex min-h-0">
				<UiCard class="flex-1" fill-height no-padding size="lg">
					<template #header>
						<div class="flex items-center gap-2">
							<Icon name="lucide:edit-3" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
							<h3 class="text-sm font-semibold text-gray-900 dark:text-white">
								Configurar {{ nomeDiaCompleto }}
							</h3>
						</div>
					</template>

					<!-- Conteúdo com scroll -->
					<div class="flex-1 min-h-0 overflow-y-auto p-6">
						<!-- Card de Info quando nenhum dia está selecionado -->
						<div v-if="!horarioSelecionado" class="h-full flex items-center justify-center p-8">
							<div
								class="max-w-md w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 text-center"
							>
								<div class="flex justify-center mb-4">
									<div
										class="w-16 h-16 bg-blue-100 dark:bg-blue-800/30 rounded-full flex items-center justify-center"
									>
										<Icon name="lucide:calendar-clock" class="w-8 h-8 text-blue-600" />
									</div>
								</div>
								<h3 class="text-lg font-bold text-blue-900 dark:text-blue-200 mb-2">
									Selecione um Dia
								</h3>
								<p class="text-sm text-blue-700 dark:text-blue-300 leading-relaxed mb-4">
									Clique em um dos dias da semana no painel ao lado para configurar os horários de
									funcionamento.
								</p>
								<div class="space-y-2 text-left">
									<div class="flex items-start gap-2 text-xs text-blue-600 dark:text-blue-400">
										<Icon name="lucide:check-circle-2" class="w-4 h-4 mt-0.5 flex-shrink-0" />
										<span>Defina múltiplos períodos de funcionamento por dia</span>
									</div>
									<div class="flex items-start gap-2 text-xs text-blue-600 dark:text-blue-400">
										<Icon name="lucide:check-circle-2" class="w-4 h-4 mt-0.5 flex-shrink-0" />
										<span>Ative ou desative dias específicos rapidamente</span>
									</div>
									<div class="flex items-start gap-2 text-xs text-blue-600 dark:text-blue-400">
										<Icon name="lucide:check-circle-2" class="w-4 h-4 mt-0.5 flex-shrink-0" />
										<span>Configure horários diferentes para cada dia da semana</span>
									</div>
								</div>
							</div>
						</div>

						<!-- Editor do dia selecionado -->
						<div v-else>
							<DayEditor
								ref="dayEditorRef"
								:horario="horarioSelecionado"
								:visible="true"
								:loading="saving"
								@save="salvarHorario"
							/>
						</div>
					</div>

					<!-- Footer com botão de salvar -->
					<template #footer>
						<div class="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
							<UiButton
								variant="solid"
								color="primary"
								size="md"
								:loading="saving"
								:disabled="!hasChanges || saving || !horarioSelecionado"
								@click="handleSalvarClick"
							>
								<Icon name="lucide:save" class="w-4 h-4 mr-2" />
								{{ saving ? "Salvando..." : "Salvar Horário" }}
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

<style scoped>
.transition-all {
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
