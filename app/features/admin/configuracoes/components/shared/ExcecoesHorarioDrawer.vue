<script setup lang="ts">
/**
 * 📌 ExcecoesHorarioDrawer - Drawer de Gerenciamento de Exceções de Horários
 *
 * Permite adicionar, editar e remover exceções de horários (feriados, datas especiais).
 * Reutiliza o SelectMenu para definir períodos quando a exceção está "Aberta".
 */

import type { HorarioExcecao, PeriodoFuncionamento } from "#shared/types/estabelecimentos";
import { useHorariosFuncionamento } from "../../composables/useHorariosFuncionamento";
import SelectMenu from "~/components/ui/SelectMenu.vue";

interface Props {
	modelValue: boolean;
}

interface Emits {
	"update:modelValue": [value: boolean];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { excecoes, adicionarExcecao, atualizarExcecao, removerExcecao, saving } =
	useHorariosFuncionamento();

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

// Estado do formulário
const modoEdicao = ref(false);
const excecaoEditando = ref<string | null>(null);
const formulario = ref({
	data: "",
	nome: "",
	aberto: false,
	periodos: [] as PeriodoFuncionamento[],
});

// Exceções ordenadas por data
const excecoesOrdenadas = computed(() => {
	return [...excecoes.value].sort((a, b) => a.data.localeCompare(b.data));
});

// Resetar formulário
const resetarFormulario = (): void => {
	formulario.value = {
		data: "",
		nome: "",
		aberto: false,
		periodos: [],
	};
	modoEdicao.value = false;
	excecaoEditando.value = null;
};

// Abrir para editar
const abrirEditar = (excecao: HorarioExcecao): void => {
	formulario.value = {
		data: excecao.data,
		nome: excecao.nome,
		aberto: excecao.aberto,
		periodos: [...excecao.periodos],
	};
	modoEdicao.value = true;
	excecaoEditando.value = excecao.id;
};

// Adicionar período ao formulário
const adicionarPeriodo = (): void => {
	const gerarIdPeriodo = (): string => {
		return `periodo_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
	};

	formulario.value.periodos.push({
		id: gerarIdPeriodo(),
		horario_abertura: "08:00",
		horario_fechamento: "18:00",
	});
};

// Remover período do formulário
const removerPeriodo = (index: number): void => {
	formulario.value.periodos.splice(index, 1);
};

// Atualizar período do formulário
const atualizarPeriodo = (
	index: number,
	campo: keyof PeriodoFuncionamento,
	valor: string,
): void => {
	formulario.value.periodos[index] = {
		...formulario.value.periodos[index],
		[campo]: valor,
	};
};

// Validação do formulário
const formularioValido = computed(() => {
	if (!formulario.value.data || !formulario.value.nome) {
		return false;
	}

	if (formulario.value.aberto && formulario.value.periodos.length === 0) {
		return false;
	}

	// Validar períodos se aberto
	if (formulario.value.aberto) {
		for (const periodo of formulario.value.periodos) {
			if (!periodo.horario_abertura || !periodo.horario_fechamento) {
				return false;
			}
		}
	}

	return true;
});

// Salvar exceção
const salvar = async (): Promise<void> => {
	if (!formularioValido.value) return;

	const excecaoData = {
		data: formulario.value.data,
		nome: formulario.value.nome,
		aberto: formulario.value.aberto,
		periodos: formulario.value.aberto ? formulario.value.periodos : [],
	};

	let sucesso = false;

	if (modoEdicao.value && excecaoEditando.value) {
		sucesso = await atualizarExcecao(excecaoEditando.value, excecaoData);
	} else {
		sucesso = await adicionarExcecao(excecaoData);
	}

	if (sucesso) {
		resetarFormulario();
		// Não fechar o drawer para permitir adicionar múltiplas exceções
		// Se quiser fechar, descomente a linha abaixo:
		// fechar();
	}
};

// Remover exceção com confirmação
const confirmarRemover = async (id: string): Promise<void> => {
	if (confirm("Tem certeza que deseja remover esta exceção?")) {
		await removerExcecao(id);
	}
};

// Fechar drawer
const fechar = (): void => {
	emit("update:modelValue", false);
	resetarFormulario();
};

// Formatar data para exibição
const formatarData = (data: string): string => {
	const date = new Date(data + "T00:00:00");
	return date.toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});
};

// Watch para resetar ao fechar
watch(
	() => props.modelValue,
	(isOpen) => {
		if (!isOpen) {
			resetarFormulario();
		}
	},
);
</script>

<template>
	<UiDrawer :model-value="modelValue" size="lg" @update:model-value="fechar">
		<template #header>
			<div class="flex items-center gap-3">
				<div
					class="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0"
				>
					<Icon name="lucide:calendar-x" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
				</div>
				<div class="flex-1 min-w-0">
					<h3 class="text-lg font-semibold text-gray-900 dark:text-white">Exceções de Horários</h3>
					<p class="text-sm text-gray-600 dark:text-gray-400">
						Gerencie feriados e datas especiais
					</p>
				</div>
			</div>
		</template>

		<div class="space-y-6">
			<!-- Formulário de Adicionar/Editar -->
			<div
				class="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4"
			>
				<h4 class="font-semibold text-gray-900 dark:text-white">
					{{ modoEdicao ? "Editar Exceção" : "Nova Exceção" }}
				</h4>

				<!-- Data e Nome -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
							Data
							<span class="text-[var(--error)] ml-1">*</span>
						</label>
						<UiDatePicker v-model="formulario.data" placeholder="Selecione a data" />
					</div>

					<div>
						<label class="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
							Nome
							<span class="text-[var(--error)] ml-1">*</span>
						</label>
						<UiInput v-model="formulario.nome" type="text" placeholder="Ex: Feriado Municipal" />
					</div>
				</div>

				<!-- Switch Aberto/Fechado -->
				<div
					class="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
				>
					<div>
						<p class="font-medium text-gray-900 dark:text-white">
							{{ formulario.aberto ? "Funcionando nesta data" : "Fechado nesta data" }}
						</p>
						<p class="text-sm text-gray-600 dark:text-gray-400">
							{{
								formulario.aberto
									? "Configure os horários especiais abaixo"
									: "Estabelecimento não funcionará nesta data"
							}}
						</p>
					</div>
					<UiSwitch v-model="formulario.aberto" />
				</div>

				<!-- Períodos (se aberto) -->
				<div v-if="formulario.aberto" class="space-y-3">
					<div class="flex items-center justify-between">
						<label class="text-sm font-semibold text-gray-900 dark:text-white">
							Horários de Funcionamento
						</label>
						<UiButton variant="outline" size="sm" @click="adicionarPeriodo">
							<Icon name="lucide:plus" class="w-4 h-4 mr-1" />
							Adicionar Horário
						</UiButton>
					</div>

					<!-- Lista de Períodos -->
					<div v-if="formulario.periodos.length > 0" class="space-y-2">
						<div
							v-for="(periodo, index) in formulario.periodos"
							:key="periodo.id || index"
							class="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
						>
							<div class="flex-1 w-full grid grid-cols-2 gap-3">
								<div>
									<label
										class="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5"
									>
										H. Inicial:
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
								<div>
									<label
										class="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5"
									>
										H. Final:
									</label>
									<SelectMenu
										:model-value="periodo.horario_fechamento"
										:options="horariosOptions"
										placeholder="18:00"
										searchable
										search-placeholder="Digite (ex: 18:30) ou selecione..."
										@update:model-value="
											(value) =>
												value && atualizarPeriodo(index, 'horario_fechamento', String(value))
										"
									/>
								</div>
							</div>
							<UiButton
								variant="ghost"
								size="sm"
								class="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 sm:mt-6"
								@click="removerPeriodo(index)"
							>
								<Icon name="lucide:trash-2" class="w-4 h-4" />
							</UiButton>
						</div>
					</div>

					<!-- Estado vazio -->
					<div
						v-else
						class="text-center py-6 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
					>
						<Icon name="lucide:clock" class="w-6 h-6 mx-auto mb-2 opacity-50" />
						<p class="text-sm">Nenhum horário configurado</p>
					</div>
				</div>

				<!-- Botões do Formulário -->
				<div class="flex gap-2">
					<UiButton
						variant="solid"
						:disabled="!formularioValido || saving"
						:loading="saving"
						@click="salvar"
					>
						<Icon name="lucide:save" class="w-4 h-4 mr-2" />
						{{ modoEdicao ? "Atualizar" : "Adicionar" }}
					</UiButton>
					<UiButton v-if="modoEdicao" variant="outline" @click="resetarFormulario">
						Cancelar
					</UiButton>
				</div>
			</div>

			<!-- Lista de Exceções Cadastradas -->
			<div>
				<h4 class="font-semibold text-gray-900 dark:text-white mb-3">
					Exceções Cadastradas ({{ excecoes.length }})
				</h4>

				<div v-if="excecoesOrdenadas.length > 0" class="space-y-2">
					<div
						v-for="excecao in excecoesOrdenadas"
						:key="excecao.id"
						class="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500/50 transition-colors"
					>
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2">
								<Icon
									:name="excecao.aberto ? 'lucide:check-circle' : 'lucide:x-circle'"
									:class="[
										'w-4 h-4 flex-shrink-0',
										excecao.aberto
											? 'text-green-600 dark:text-green-400'
											: 'text-red-600 dark:text-red-400',
									]"
								/>
								<p class="font-medium text-gray-900 dark:text-white truncate">
									{{ excecao.nome }}
								</p>
							</div>
							<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
								{{ formatarData(excecao.data) }}
								<span v-if="excecao.aberto && excecao.periodos.length > 0" class="ml-2">
									• {{ excecao.periodos.length }} horário(s)
								</span>
							</p>
						</div>
						<div class="flex gap-1 flex-shrink-0">
							<UiButton variant="ghost" size="sm" @click="abrirEditar(excecao)">
								<Icon name="lucide:edit" class="w-4 h-4" />
							</UiButton>
							<UiButton
								variant="ghost"
								size="sm"
								class="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
								@click="confirmarRemover(excecao.id)"
							>
								<Icon name="lucide:trash-2" class="w-4 h-4" />
							</UiButton>
						</div>
					</div>
				</div>

				<!-- Estado vazio -->
				<div
					v-else
					class="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg"
				>
					<Icon name="lucide:calendar-x" class="w-8 h-8 mx-auto mb-2 opacity-50" />
					<p class="text-sm">Nenhuma exceção cadastrada</p>
					<p class="text-xs mt-1">Adicione feriados e datas especiais acima</p>
				</div>
			</div>
		</div>
	</UiDrawer>
</template>
