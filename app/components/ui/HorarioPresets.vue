<script setup lang="ts">
/**
 * 📌 HorarioPresets - Configuração rápida de horários
 *
 * Componente para aplicação rápida de horários em múltiplos dias,
 * com presets comuns e configuração personalizada.
 */

interface Props {
	/** Se o componente está expandido */
	expanded?: boolean;
}

interface Emits {
	/** Emitido quando horários devem ser aplicados a dias úteis */
	"aplicar-dias-uteis": [abertura: string, fechamento: string];
	/** Emitido quando horários devem ser aplicados a todos os dias */
	"aplicar-todos": [abertura: string, fechamento: string];
	/** Emitido quando horários devem ser aplicados aos fins de semana */
	"aplicar-fins-semana": [abertura: string, fechamento: string];
	/** Emitido quando um preset específico deve ser aplicado */
	"aplicar-preset": [preset: string, dias: string[], abertura: string, fechamento: string];
}

const _props = withDefaults(defineProps<Props>(), {
	expanded: true,
});

const emit = defineEmits<Emits>();

/**
 * Horários personalizados
 */
const horarioPersonalizado = ref({
	abertura: "08:00",
	fechamento: "18:00",
});

/**
 * Estados visuais para feedback
 */
const feedbackState = ref({
	ultimaAcao: null as string | null,
	loading: false,
	presetSelecionado: null as string | null,
});

/**
 * Presets de horários por tipo de negócio
 */
const presetsNegocios = [
	{
		id: "comercial",
		nome: "Comercial",
		descricao: "Lojas e escritórios",
		abertura: "09:00",
		fechamento: "18:00",
		dias: ["segunda", "terca", "quarta", "quinta", "sexta"],
		icon: "lucide:briefcase",
	},
	{
		id: "restaurante",
		nome: "Restaurante",
		descricao: "Almoço e jantar",
		abertura: "11:00",
		fechamento: "23:00",
		dias: ["segunda", "terca", "quarta", "quinta", "sexta", "sabado"],
		icon: "lucide:utensils",
	},
	{
		id: "lanchonete",
		nome: "Lanchonete",
		descricao: "Café da manhã ao jantar",
		abertura: "07:00",
		fechamento: "22:00",
		dias: ["segunda", "terca", "quarta", "quinta", "sexta", "sabado"],
		icon: "lucide:pizza",
	},
	{
		id: "padaria",
		nome: "Padaria",
		descricao: "Manhã cedo ao fim da tarde",
		abertura: "06:00",
		fechamento: "19:00",
		dias: ["segunda", "terca", "quarta", "quinta", "sexta", "sabado"],
		icon: "lucide:cookie",
	},
	{
		id: "bar",
		nome: "Bar/Pub",
		descricao: "Noite e madrugada",
		abertura: "18:00",
		fechamento: "02:00",
		dias: ["quinta", "sexta", "sabado"],
		icon: "lucide:glass-water",
	},
	{
		id: "delivery24h",
		nome: "24 Horas",
		descricao: "Funcionamento contínuo",
		abertura: "00:00",
		fechamento: "23:59",
		dias: ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"],
		icon: "lucide:clock",
	},
];

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
 * Aplicar horário personalizado a dias úteis
 */
const aplicarDiasUteis = async (): Promise<void> => {
	feedbackState.value.loading = true;
	feedbackState.value.ultimaAcao = "dias-uteis";

	// Simular pequeno delay para feedback visual
	await new Promise((resolve) => setTimeout(resolve, 300));

	emit(
		"aplicar-dias-uteis",
		horarioPersonalizado.value.abertura,
		horarioPersonalizado.value.fechamento,
	);

	feedbackState.value.loading = false;

	// Limpar feedback após 2 segundos
	setTimeout(() => {
		feedbackState.value.ultimaAcao = null;
	}, 2000);
};

/**
 * Aplicar horário personalizado a todos os dias
 */
const aplicarTodos = async (): Promise<void> => {
	feedbackState.value.loading = true;
	feedbackState.value.ultimaAcao = "todos";

	await new Promise((resolve) => setTimeout(resolve, 300));

	emit("aplicar-todos", horarioPersonalizado.value.abertura, horarioPersonalizado.value.fechamento);

	feedbackState.value.loading = false;

	setTimeout(() => {
		feedbackState.value.ultimaAcao = null;
	}, 2000);
};

/**
 * Aplicar horário personalizado aos fins de semana
 */
const aplicarFinsSemana = async (): Promise<void> => {
	feedbackState.value.loading = true;
	feedbackState.value.ultimaAcao = "fins-semana";

	await new Promise((resolve) => setTimeout(resolve, 300));

	emit(
		"aplicar-fins-semana",
		horarioPersonalizado.value.abertura,
		horarioPersonalizado.value.fechamento,
	);

	feedbackState.value.loading = false;

	setTimeout(() => {
		feedbackState.value.ultimaAcao = null;
	}, 2000);
};

/**
 * Aplicar preset de negócio
 */
const aplicarPreset = async (preset: (typeof presetsNegocios)[0]): Promise<void> => {
	feedbackState.value.loading = true;
	feedbackState.value.presetSelecionado = preset.id;

	await new Promise((resolve) => setTimeout(resolve, 400));

	emit("aplicar-preset", preset.id, preset.dias, preset.abertura, preset.fechamento);

	feedbackState.value.loading = false;

	setTimeout(() => {
		feedbackState.value.presetSelecionado = null;
	}, 2000);
};
</script>

<template>
	<div v-if="_props.expanded" class="space-y-4">
		<!-- Cabeçalho -->
		<div>
			<h3 class="text-lg font-semibold text-gray-900 dark:text-white">Configuração Rápida</h3>
			<p class="text-sm text-gray-600 dark:text-gray-400">
				Aplique horários em lote ou use presets por tipo de negócio
			</p>
		</div>

		<!-- Horário Personalizado -->
		<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
			<h4 class="font-semibold text-sm text-gray-900 dark:text-white mb-3">
				Horário Personalizado
			</h4>

			<div class="space-y-4">
				<!-- Seletores de Horário -->
				<div class="flex items-end space-x-3">
					<UiFormField label="Abertura" class="flex-1">
						<UiSelect
							v-model="horarioPersonalizado.abertura"
							:options="horariosOptions"
							placeholder="08:00"
						/>
					</UiFormField>
					<UiFormField label="Fechamento" class="flex-1">
						<UiSelect
							v-model="horarioPersonalizado.fechamento"
							:options="horariosOptions"
							placeholder="18:00"
						/>
					</UiFormField>
				</div>

				<!-- Botões de Aplicação - Agrupados logicamente -->
				<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
					<UiButton
						variant="outline"
						size="sm"
						:disabled="feedbackState.loading"
						:class="{
							'bg-green-50 border-green-500 text-green-700':
								feedbackState.ultimaAcao === 'dias-uteis',
							'animate-pulse': feedbackState.loading && feedbackState.ultimaAcao === 'dias-uteis',
						}"
						@click="aplicarDiasUteis"
					>
						<Icon
							:name="
								feedbackState.ultimaAcao === 'dias-uteis' ? 'lucide:check' : 'lucide:briefcase'
							"
							class="w-4 h-4 mr-2"
						/>
						{{ feedbackState.ultimaAcao === "dias-uteis" ? "Aplicado!" : "Dias Úteis" }}
					</UiButton>

					<UiButton
						variant="outline"
						size="sm"
						:disabled="feedbackState.loading"
						:class="{
							'bg-green-50 border-green-500 text-green-700':
								feedbackState.ultimaAcao === 'fins-semana',
							'animate-pulse': feedbackState.loading && feedbackState.ultimaAcao === 'fins-semana',
						}"
						@click="aplicarFinsSemana"
					>
						<Icon
							:name="
								feedbackState.ultimaAcao === 'fins-semana' ? 'lucide:check' : 'lucide:calendar'
							"
							class="w-4 h-4 mr-2"
						/>
						{{ feedbackState.ultimaAcao === "fins-semana" ? "Aplicado!" : "Fins de Semana" }}
					</UiButton>

					<UiButton
						variant="solid"
						size="sm"
						:disabled="feedbackState.loading"
						:class="{
							'bg-green-600 hover:bg-green-700': feedbackState.ultimaAcao === 'todos',
							'animate-pulse': feedbackState.loading && feedbackState.ultimaAcao === 'todos',
						}"
						@click="aplicarTodos"
					>
						<Icon
							:name="feedbackState.ultimaAcao === 'todos' ? 'lucide:check' : 'lucide:check-circle'"
							class="w-4 h-4 mr-2"
						/>
						{{ feedbackState.ultimaAcao === "todos" ? "Aplicado!" : "Todos os Dias" }}
					</UiButton>
				</div>

				<!-- Explicação clara -->
				<div
					class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3"
				>
					<div class="flex items-start space-x-2">
						<Icon name="lucide:info" class="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
						<div class="text-xs">
							<p class="font-semibold text-blue-900 dark:text-blue-100 mb-1">Como funciona:</p>
							<p class="text-blue-700 dark:text-blue-300">
								Defina o horário acima ({{ horarioPersonalizado.abertura }} -
								{{ horarioPersonalizado.fechamento }}) e escolha onde aplicar: apenas dias úteis,
								fins de semana ou todos os dias.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Presets por Tipo de Negócio -->
		<div>
			<h4 class="font-semibold text-sm text-gray-900 dark:text-white mb-3">
				Presets por Tipo de Negócio
			</h4>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
				<button
					v-for="preset in presetsNegocios"
					:key="preset.id"
					type="button"
					:disabled="feedbackState.loading"
					:class="[
						'flex items-start space-x-3 p-3 border rounded-lg transition-all duration-300 text-left relative overflow-hidden',
						feedbackState.presetSelecionado === preset.id
							? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-900 dark:text-green-100'
							: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700',
						feedbackState.loading &&
							feedbackState.presetSelecionado === preset.id &&
							'animate-pulse',
					]"
					@click="aplicarPreset(preset)"
				>
					<!-- Overlay de sucesso -->
					<div
						v-if="feedbackState.presetSelecionado === preset.id"
						class="absolute inset-0 bg-green-500/10 flex items-center justify-center"
					>
						<div class="bg-green-500 text-white rounded-full p-2">
							<Icon name="lucide:check" class="w-4 h-4" />
						</div>
					</div>

					<div
						:class="[
							'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
							feedbackState.presetSelecionado === preset.id
								? 'bg-green-500 text-white'
								: 'bg-[var(--primary-light)] text-[var(--primary)]',
						]"
					>
						<Icon
							:name="feedbackState.presetSelecionado === preset.id ? 'lucide:check' : preset.icon"
							class="w-4 h-4"
						/>
					</div>

					<div class="flex-1 min-w-0">
						<h5
							:class="[
								'font-semibold text-sm',
								feedbackState.presetSelecionado === preset.id
									? 'text-green-900 dark:text-green-100'
									: 'text-gray-900 dark:text-white',
							]"
						>
							{{ feedbackState.presetSelecionado === preset.id ? "Aplicado!" : preset.nome }}
						</h5>
						<p
							:class="[
								'text-xs mb-1',
								feedbackState.presetSelecionado === preset.id
									? 'text-green-700 dark:text-green-300'
									: 'text-gray-600 dark:text-gray-400',
							]"
						>
							{{ preset.descricao }}
						</p>
						<p
							:class="[
								'text-xs font-medium',
								feedbackState.presetSelecionado === preset.id
									? 'text-green-600 dark:text-green-400'
									: 'text-[var(--primary)]',
							]"
						>
							{{ preset.abertura }} - {{ preset.fechamento }}
						</p>
					</div>
				</button>
			</div>
		</div>

		<!-- Dica -->
		<div
			class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3"
		>
			<div class="flex items-start space-x-2">
				<Icon name="lucide:lightbulb" class="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
				<div class="text-xs">
					<p class="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">Dica:</p>
					<p class="text-yellow-700 dark:text-yellow-300">
						Os presets aplicam horários apenas aos dias típicos de cada tipo de negócio. Você pode
						ajustar individualmente depois.
					</p>
				</div>
			</div>
		</div>
	</div>
</template>
