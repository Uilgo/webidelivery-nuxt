<script setup lang="ts">
/**
 * 📌 DayEditor - Editor detalhado de horários do dia
 *
 * Componente para edição detalhada dos horários de funcionamento
 * de um dia específico, com suporte a múltiplos períodos por dia.
 * Permite horários quebrados como: 07:00-12:00, 14:00-17:00, 19:00-22:00
 */

import type { HorarioFuncionamento, PeriodoFuncionamento } from "#shared/types/estabelecimentos";
import { DIAS_SEMANA_LABELS, MAX_PERIODOS_POR_DIA } from "#shared/constants/estabelecimento";
import SelectMenu from "~/components/ui/SelectMenu.vue";

interface Props {
	/** Dados do horário do dia */
	horario: HorarioFuncionamento;
	/** Se o editor está visível */
	visible?: boolean;
}

interface Emits {
	/** Emitido quando os dados são atualizados */
	"update:horario": [horario: HorarioFuncionamento];
	/** Emitido quando o editor deve ser fechado */
	close: [];
}

const props = withDefaults(defineProps<Props>(), {
	visible: false,
});

const emit = defineEmits<Emits>();

/**
 * Opções de horários (intervalos de 15 minutos)
 */
const horariosOptions = computed(() => {
	const options = [];
	for (let hour = 0; hour < 24; hour++) {
		for (let minute = 0; minute < 60; minute += 15) {
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
 * Validar e normalizar horário digitado
 */
const validarHorario = (horario: string): string | null => {
	// Remover espaços e caracteres especiais
	const cleaned = horario.replace(/[^\d:]/g, "");

	// Tentar diferentes formatos
	let match = cleaned.match(/^(\d{1,2}):?(\d{2})$/);
	if (!match) {
		const singleHourMatch = cleaned.match(/^(\d{1,2})$/);
		if (singleHourMatch && singleHourMatch[1]) {
			// Se só digitou a hora, assumir :00
			match = [cleaned, singleHourMatch[1], "00"];
		}
	}

	if (!match || !match[1] || !match[2]) return null;

	const hourStr = match[1];
	const minuteStr = match[2];
	const hour = parseInt(hourStr, 10);
	const minute = parseInt(minuteStr, 10);

	// Validar limites
	if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
		return null;
	}

	// Retornar formato normalizado
	return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
};

/**
 * Estado local do horário (para edição)
 */
const localHorario = ref<HorarioFuncionamento>({
	...props.horario,
	periodos: props.horario.periodos || [],
});

/**
 * Verificar se pode adicionar mais períodos
 */
const podeAdicionarPeriodo = computed(() => {
	const periodosAtuais = localHorario.value.periodos?.length || 0;
	return periodosAtuais < MAX_PERIODOS_POR_DIA;
});

/**
 * Observar mudanças nas props para atualizar estado local
 */
watch(
	() => props.horario,
	(newHorario) => {
		localHorario.value = {
			...newHorario,
			periodos: newHorario.periodos || [],
		};
	},
	{ deep: true, immediate: true },
);

/**
 * Gerar ID único para período
 */
const gerarIdPeriodo = (): string => {
	return `periodo_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Adicionar novo período
 */
const adicionarPeriodo = (): void => {
	// Verificar se já atingiu o limite
	if (!podeAdicionarPeriodo.value) {
		return;
	}

	const novosPeriodos = [...(localHorario.value.periodos || [])];
	novosPeriodos.push({
		id: gerarIdPeriodo(),
		horario_abertura: "08:00",
		horario_fechamento: "18:00",
	});

	localHorario.value = {
		...localHorario.value,
		periodos: novosPeriodos,
		aberto: true,
	};

	emitirMudanca();
};

/**
 * Remover período
 */
const removerPeriodo = (index: number): void => {
	const novosPeriodos = [...(localHorario.value.periodos || [])];
	novosPeriodos.splice(index, 1);

	localHorario.value = {
		...localHorario.value,
		periodos: novosPeriodos,
		aberto: novosPeriodos.length > 0,
	};

	emitirMudanca();
};

/**
 * Atualizar período específico com validação de horário
 */
const atualizarPeriodo = (
	index: number,
	campo: keyof PeriodoFuncionamento,
	valor: string,
): void => {
	let valorFinal = valor;

	// Se for um campo de horário e o valor não está nas opções, tentar validar
	if ((campo === "horario_abertura" || campo === "horario_fechamento") && valor) {
		const horarioExiste = horariosOptions.value.some((opt) => opt.value === valor);
		if (!horarioExiste) {
			const horarioValidado = validarHorario(valor);
			if (horarioValidado) {
				valorFinal = horarioValidado;
			} else {
				// Se não conseguiu validar, não atualizar
				return;
			}
		}
	}

	const novosPeriodos = [...(localHorario.value.periodos || [])];
	novosPeriodos[index] = {
		...novosPeriodos[index],
		[campo]: valorFinal,
	};

	localHorario.value = {
		...localHorario.value,
		periodos: novosPeriodos,
	};

	emitirMudanca();
};

/**
 * Converter horário para minutos (para comparações)
 * Lida com horários noturnos (ex: 22:00-02:00)
 */
const timeToMinutes = (time: string, isEndTime = false): number => {
	const parts = time.split(":").map(Number);
	const hours = parts[0] || 0;
	const minutes = parts[1] || 0;
	let totalMinutes = hours * 60 + minutes;

	// Se é horário de fechamento e é menor que 6:00, assumir que é do dia seguinte
	if (isEndTime && hours < 6) {
		totalMinutes += 24 * 60; // Adicionar 24 horas
	}

	return totalMinutes;
};

/**
 * Validação dos períodos
 */
const validacao = computed(() => {
	if (!localHorario.value.aberto) {
		return { valido: true, erro: null };
	}

	const periodos = localHorario.value.periodos || [];

	if (periodos.length === 0) {
		return {
			valido: false,
			erro: "Adicione pelo menos um horário de funcionamento",
		};
	}

	if (periodos.length > MAX_PERIODOS_POR_DIA) {
		return {
			valido: false,
			erro: `Máximo de ${MAX_PERIODOS_POR_DIA} horários por dia permitido`,
		};
	}

	// Validar cada período
	for (let i = 0; i < periodos.length; i++) {
		const periodo = periodos[i];

		if (!periodo?.horario_abertura || !periodo?.horario_fechamento) {
			return {
				valido: false,
				erro: `Horário ${i + 1}: Horários de abertura e fechamento são obrigatórios`,
			};
		}

		// Converter para minutos para comparação
		const aberturaNumbers = periodo.horario_abertura.split(":").map(Number);
		const fechamentoNumbers = periodo.horario_fechamento.split(":").map(Number);

		if (aberturaNumbers.length !== 2 || fechamentoNumbers.length !== 2) {
			return {
				valido: false,
				erro: `Horário ${i + 1}: Formato de horário inválido`,
			};
		}

		const [aberturaH, aberturaM] = aberturaNumbers;
		const [fechamentoH, fechamentoM] = fechamentoNumbers;

		if (
			aberturaH === undefined ||
			aberturaM === undefined ||
			fechamentoH === undefined ||
			fechamentoM === undefined
		) {
			return {
				valido: false,
				erro: `Horário ${i + 1}: Horários inválidos`,
			};
		}

		const aberturaMinutos = aberturaH * 60 + aberturaM;
		const fechamentoMinutos = fechamentoH * 60 + fechamentoM;

		// Permitir funcionamento noturno (ex: 22:00 - 02:00)
		if (fechamentoMinutos <= aberturaMinutos && fechamentoMinutos > 60) {
			return {
				valido: false,
				erro: `Horário ${i + 1}: Horário de fechamento deve ser após a abertura`,
			};
		}
	}

	// Verificar sobreposição de períodos (apenas aviso, não erro)
	const sobreposicoes = [];
	for (let i = 0; i < periodos.length - 1; i++) {
		for (let j = i + 1; j < periodos.length; j++) {
			const periodo1 = periodos[i];
			const periodo2 = periodos[j];

			if (!periodo1 || !periodo2) continue;

			const inicio1 = periodo1.horario_abertura;
			const fim1 = periodo1.horario_fechamento;
			const inicio2 = periodo2.horario_abertura;
			const fim2 = periodo2.horario_fechamento;

			if (!inicio1 || !fim1 || !inicio2 || !fim2) continue;

			// Converter para minutos para comparação mais precisa
			const inicio1Min = timeToMinutes(inicio1);
			const fim1Min = timeToMinutes(fim1, true);
			const inicio2Min = timeToMinutes(inicio2);
			const fim2Min = timeToMinutes(fim2, true);

			// Verificar sobreposição
			if (
				(inicio2Min >= inicio1Min && inicio2Min < fim1Min) ||
				(fim2Min > inicio1Min && fim2Min <= fim1Min) ||
				(inicio1Min >= inicio2Min && inicio1Min < fim2Min)
			) {
				sobreposicoes.push({ periodo1: i + 1, periodo2: j + 1 });
			}
		}
	}

	return {
		valido: true,
		erro: null,
		avisos:
			sobreposicoes.length > 0
				? `Horários ${sobreposicoes.map((s) => `${s.periodo1} e ${s.periodo2}`).join(", ")} se sobrepõem`
				: null,
	};
});

/**
 * Atualizar status aberto/fechado
 */
const updateAberto = (aberto: boolean): void => {
	localHorario.value = {
		...localHorario.value,
		aberto,
		periodos: aberto ? localHorario.value.periodos || [] : [],
	};

	// Se está abrindo e não tem períodos, adicionar um padrão
	if (aberto && (localHorario.value.periodos || []).length === 0) {
		adicionarPeriodo();
	} else {
		emitirMudanca();
	}
};

/**
 * Emitir mudança
 */
const emitirMudanca = (): void => {
	emit("update:horario", localHorario.value);
};

/**
 * Nome do dia formatado
 */
const nomeDia = computed(() => {
	return DIAS_SEMANA_LABELS[localHorario.value.dia_semana] || localHorario.value.dia_semana;
});

/**
 * Resumo dos horários para exibição
 */
const resumoHorarios = computed(() => {
	const periodos = localHorario.value.periodos || [];

	if (periodos.length === 0) return "Nenhum período configurado";

	return periodos.map((p) => `${p.horario_abertura} às ${p.horario_fechamento}`).join(", ");
});
</script>

<template>
	<div v-if="visible" class="space-y-4">
		<!-- Toggle Principal -->
		<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
			<div class="flex items-center justify-between">
				<div>
					<h4 class="font-semibold text-gray-900 dark:text-white">Status do Dia</h4>
					<p class="text-sm text-gray-600 dark:text-gray-400">
						{{ localHorario.aberto ? "Estabelecimento funcionando" : "Estabelecimento fechado" }}
					</p>
				</div>

				<UiSwitch :model-value="localHorario.aberto" @update:model-value="updateAberto" />
			</div>
		</div>

		<!-- Configuração de Períodos (apenas se aberto) -->
		<div v-if="localHorario.aberto" class="space-y-4">
			<!-- Períodos de Funcionamento -->
			<div>
				<div class="flex items-center justify-between mb-3">
					<h4 class="font-semibold text-sm text-gray-900 dark:text-white">
						Horários de Funcionamento
					</h4>
					<UiButton
						variant="outline"
						size="sm"
						:disabled="!podeAdicionarPeriodo"
						@click="adicionarPeriodo"
					>
						<Icon name="lucide:plus" class="w-4 h-4 mr-1" />
						Adicionar Horário
					</UiButton>
				</div>

				<!-- Aviso de limite -->
				<div
					v-if="!podeAdicionarPeriodo"
					class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-3"
				>
					<div class="flex items-center space-x-2">
						<Icon name="lucide:info" class="w-4 h-4 text-amber-600 dark:text-amber-400" />
						<p class="text-sm text-amber-700 dark:text-amber-300">
							Limite máximo de {{ MAX_PERIODOS_POR_DIA }} horários por dia atingido. Remova um
							horário para adicionar outro.
						</p>
					</div>
				</div>

				<!-- Lista de Períodos -->
				<div class="space-y-3">
					<div
						v-for="(periodo, index) in localHorario.periodos || []"
						:key="periodo.id || index"
						class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
					>
						<div class="flex items-center space-x-3">
							<!-- Horário de Abertura -->
							<div class="flex-1">
								<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
									Das:
								</label>
								<SelectMenu
									:model-value="periodo.horario_abertura"
									:options="horariosOptions"
									placeholder="08:00"
									searchable
									search-placeholder="Digite (ex: 08:30) ou selecione..."
									@update:model-value="
										(value) => value && atualizarPeriodo(index, 'horario_abertura', String(value))
									"
								/>
							</div>

							<!-- Horário de Fechamento -->
							<div class="flex-1">
								<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
									até as:
								</label>
								<SelectMenu
									:model-value="periodo.horario_fechamento"
									:options="horariosOptions"
									placeholder="18:00"
									searchable
									search-placeholder="Digite (ex: 18:30) ou selecione..."
									@update:model-value="
										(value) => value && atualizarPeriodo(index, 'horario_fechamento', String(value))
									"
								/>
							</div>

							<!-- Botão Remover -->
							<div class="mt-6">
								<UiButton
									v-if="(localHorario.periodos || []).length > 1"
									variant="ghost"
									size="sm"
									class="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
									@click="removerPeriodo(index)"
								>
									<Icon name="lucide:trash-2" class="w-4 h-4" />
								</UiButton>
							</div>
						</div>
					</div>

					<!-- Estado vazio -->
					<div
						v-if="(localHorario.periodos || []).length === 0"
						class="text-center py-8 text-gray-500 dark:text-gray-400"
					>
						<Icon name="lucide:clock" class="w-8 h-8 mx-auto mb-2 opacity-50" />
						<p class="text-sm">Nenhum horário configurado</p>
						<p class="text-xs">Clique em "Adicionar Horário" para começar</p>
						<p class="text-xs text-gray-400 mt-1">
							Máximo: {{ MAX_PERIODOS_POR_DIA }} horários por dia
						</p>
					</div>
				</div>
			</div>

			<!-- Validação -->
			<div
				v-if="!validacao.valido"
				class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
			>
				<div class="flex items-center space-x-2">
					<Icon name="lucide:alert-triangle" class="w-4 h-4 text-red-600 dark:text-red-400" />
					<p class="text-sm text-red-700 dark:text-red-300">
						{{ validacao.erro }}
					</p>
				</div>
			</div>

			<!-- Avisos (sobreposições) -->
			<div
				v-else-if="validacao.avisos"
				class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3"
			>
				<div class="flex items-start space-x-2">
					<Icon name="lucide:info" class="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
					<div>
						<p class="text-sm text-amber-700 dark:text-amber-300 font-medium">
							{{ validacao.avisos }}
						</p>
						<p class="text-xs text-amber-600 dark:text-amber-400 mt-1">
							Isso pode ser intencional para diferentes serviços ou turnos.
						</p>
					</div>
				</div>
			</div>

			<!-- Resumo -->
			<div
				v-else
				class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3"
			>
				<div class="flex items-center space-x-2">
					<Icon name="lucide:check-circle" class="w-4 h-4 text-green-600 dark:text-green-400" />
					<div class="flex-1">
						<p class="text-sm text-green-700 dark:text-green-300">
							<strong>{{ nomeDia }}:</strong> {{ resumoHorarios }}
						</p>
						<p
							v-if="(localHorario.periodos || []).length > 1"
							class="text-xs text-green-600 dark:text-green-400 mt-1"
						>
							{{ (localHorario.periodos || []).length }} horários configurados
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Informação para Dia Fechado -->
		<div v-else class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
			<Icon name="lucide:moon" class="w-8 h-8 text-gray-400 mx-auto mb-2" />
			<p class="text-sm text-gray-600 dark:text-gray-400">
				Estabelecimento fechado em {{ nomeDia.toLowerCase() }}
			</p>
		</div>
	</div>
</template>
