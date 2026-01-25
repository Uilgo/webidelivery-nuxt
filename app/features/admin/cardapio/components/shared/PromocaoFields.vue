<script setup lang="ts">
/**
 * 📌 PromocaoFields
 *
 * Componente reutilizável para campos de promoção.
 * Usado nos drawers de Produto e Categoria quando toggle "Em Promoção" está ativo.
 */

import { ref, computed, watch } from "vue";
import { formatCurrency } from "~/lib/formatters/currency";

interface Props {
	/** Tipo de promoção: 'percentual' ou 'valor_fixo' */
	modelValue: {
		tipo: "percentual" | "valor_fixo";
		valor: number;
		inicio: string | null;
		fim: string | null;
	};
	/** Preço original do produto/categoria (para validação) */
	precoOriginal?: number;
}

interface Emits {
	"update:modelValue": [
		value: {
			tipo: "percentual" | "valor_fixo";
			valor: number;
			inicio: string | null;
			fim: string | null;
		},
	];
}

const props = withDefaults(defineProps<Props>(), {
	precoOriginal: 0,
});

const emit = defineEmits<Emits>();

// Estado local dos campos
const tipo = ref(props.modelValue.tipo);
const valor = ref(props.modelValue.valor);
const inicio = ref<string | undefined>(props.modelValue.inicio || undefined);
const fim = ref<string | undefined>(props.modelValue.fim || undefined);

// Validação do valor da promoção
const valorInvalido = computed(() => {
	if (tipo.value === "percentual") {
		return valor.value <= 0 || valor.value > 100;
	}
	if (tipo.value === "valor_fixo" && props.precoOriginal > 0) {
		return valor.value <= 0 || valor.value >= props.precoOriginal;
	}
	return valor.value <= 0;
});

const mensagemErroValor = computed(() => {
	if (!valorInvalido.value) return "";

	if (tipo.value === "percentual") {
		if (valor.value <= 0) return "O desconto deve ser maior que 0%";
		if (valor.value > 100) return "O desconto não pode ser maior que 100%";
	}

	if (tipo.value === "valor_fixo") {
		if (valor.value <= 0) return "O desconto deve ser maior que R$ 0,00";
		if (props.precoOriginal > 0 && valor.value >= props.precoOriginal) {
			return `O desconto não pode ser maior ou igual ao preço original (${formatCurrency(props.precoOriginal)})`;
		}
	}

	return "";
});

// Validação de datas
const datasInvalidas = computed(() => {
	if (!inicio.value || !fim.value) return false;
	return new Date(fim.value) <= new Date(inicio.value);
});

// Emitir mudanças para o componente pai
const emitirMudancas = (): void => {
	emit("update:modelValue", {
		tipo: tipo.value,
		valor: valor.value,
		inicio: inicio.value || null,
		fim: fim.value || null,
	});
};

// Watchers para emitir mudanças
watch([tipo, valor, inicio, fim], () => {
	emitirMudancas();
});

// Sincronizar com props quando mudarem externamente
watch(
	() => props.modelValue,
	(newValue) => {
		tipo.value = newValue.tipo;
		valor.value = newValue.valor;
		inicio.value = newValue.inicio || undefined;
		fim.value = newValue.fim || undefined;
	},
	{ deep: true },
);
</script>

<template>
	<div
		class="space-y-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50"
	>
		<!-- Cabeçalho -->
		<div class="flex items-center gap-2">
			<Icon name="lucide:tag" class="h-5 w-5 text-primary-600 dark:text-primary-400" />
			<h4 class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
				Configuração da Promoção
			</h4>
		</div>

		<!-- Tipo de Promoção - Blocos Clicáveis -->
		<UiFormField label="Tipo de Desconto" required>
			<div class="grid grid-cols-2 gap-3">
				<!-- Bloco Percentual -->
				<button
					type="button"
					class="flex flex-col items-center justify-center gap-2 rounded-lg px-4 py-4 transition-all duration-200 shadow-sm hover:shadow-md"
					:class="
						tipo === 'percentual'
							? 'bg-success-600 dark:bg-success-600 shadow-success-600/30'
							: 'bg-neutral-700 dark:bg-neutral-800 hover:bg-neutral-600 dark:hover:bg-neutral-700'
					"
					@click="tipo = 'percentual'"
				>
					<Icon name="lucide:percent" class="h-6 w-6 text-white" />
					<div class="text-center">
						<div class="text-sm font-semibold text-white">Percentual</div>
						<div class="text-xs text-white/70 mt-0.5">Desconto em %</div>
					</div>
				</button>

				<!-- Bloco Valor Fixo -->
				<button
					type="button"
					class="flex flex-col items-center justify-center gap-2 rounded-lg px-4 py-4 transition-all duration-200 shadow-sm hover:shadow-md"
					:class="
						tipo === 'valor_fixo'
							? 'bg-success-600 dark:bg-success-600 shadow-success-600/30'
							: 'bg-neutral-700 dark:bg-neutral-800 hover:bg-neutral-600 dark:hover:bg-neutral-700'
					"
					@click="tipo = 'valor_fixo'"
				>
					<Icon name="lucide:banknote" class="h-6 w-6 text-white" />
					<div class="text-center">
						<div class="text-sm font-semibold text-white">Valor Fixo</div>
						<div class="text-xs text-white/70 mt-0.5">Desconto em R$</div>
					</div>
				</button>
			</div>
		</UiFormField>

		<!-- Valor da Promoção -->
		<UiFormField
			:label="tipo === 'percentual' ? 'Percentual de Desconto' : 'Valor do Desconto'"
			required
			:error="valorInvalido ? mensagemErroValor : undefined"
		>
			<UiCurrencyInput
				v-if="tipo === 'valor_fixo'"
				v-model="valor"
				placeholder="R$ 0,00"
				:error="valorInvalido"
			/>
			<!-- Input para Percentual (%) - mesmo estilo do cupom -->
			<div
				v-else
				class="relative flex items-center bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg transition-all duration-200 focus-within:border-[var(--input-border-focus)] focus-within:ring-2 focus-within:ring-[var(--input-border-focus)] focus-within:ring-opacity-20 min-h-[40px] px-3"
				:class="{
					'border-error-500 focus-within:border-error-500 focus-within:ring-error-500':
						valorInvalido,
				}"
			>
				<!-- Símbolo do percentual -->
				<div class="text-[var(--text-muted)] font-medium mr-2 pointer-events-none">%</div>

				<!-- Input -->
				<input
					v-model.number="valor"
					type="number"
					placeholder="0"
					:min="1"
					:max="100"
					:step="1"
					class="flex-1 bg-transparent border-0 outline-none text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
				/>
			</div>
		</UiFormField>

		<!-- Período da Promoção -->
		<div class="grid grid-cols-2 gap-3">
			<UiFormField label="Data de Início">
				<UiDatePicker
					v-model="inicio"
					placeholder="Selecione a data"
					:min="new Date().toISOString().split('T')[0]"
				/>
			</UiFormField>

			<UiFormField
				label="Data de Término"
				:error="datasInvalidas ? 'Data de término deve ser posterior à data de início' : undefined"
			>
				<UiDatePicker
					v-model="fim"
					placeholder="Selecione a data"
					:min="inicio || new Date().toISOString().split('T')[0]"
					:error="datasInvalidas"
				/>
			</UiFormField>
		</div>

		<!-- Informação sobre período -->
		<div
			v-if="!inicio && !fim"
			class="flex items-start gap-2 rounded-md bg-info-50 p-3 dark:bg-info-900/20"
		>
			<Icon
				name="lucide:info"
				class="mt-0.5 h-4 w-4 flex-shrink-0 text-info-600 dark:text-info-400"
			/>
			<p class="text-xs text-info-700 dark:text-info-300">
				Se não definir um período, a promoção ficará ativa indefinidamente até ser desativada
				manualmente.
			</p>
		</div>
	</div>
</template>
