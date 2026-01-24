<script setup lang="ts">
/**
 * 📌 PromocaoForm
 *
 * Formulário para criar/editar promoções com validação de período.
 * Suporta diferentes tipos de promoção e cálculo de desconto.
 */

import { toTypedSchema } from "@vee-validate/zod";
import { promocaoSchema } from "#shared/schemas/marketing";
import type { PromocaoFormData, TipoPromocao } from "#shared/types/marketing";

interface Props {
	initialData?: Partial<PromocaoFormData>;
	loading?: boolean;
}

interface Emits {
	submit: [data: PromocaoFormData];
	cancel: [];
}

const props = withDefaults(defineProps<Props>(), {
	initialData: () => ({}),
	loading: false,
});

const emit = defineEmits<Emits>();

// ========================================
// FORMULÁRIO
// ========================================

const validationSchema = toTypedSchema(promocaoSchema);

const { handleSubmit, values, setFieldValue } = useForm({
	validationSchema,
	initialValues: {
		nome: props.initialData?.nome || "",
		descricao: props.initialData?.descricao || "",
		tipo: props.initialData?.tipo || "desconto_produto",
		desconto: props.initialData?.desconto || 10,
		data_inicio: props.initialData?.data_inicio || new Date().toISOString().split("T")[0],
		data_fim: props.initialData?.data_fim || "",
	},
});

// ========================================
// ESTADO LOCAL
// ========================================

const temDataFim = ref(!!props.initialData?.data_fim);

// ========================================
// OPÇÕES DOS SELECTS
// ========================================

const tipoOptions = [
	{
		label: "Desconto em Produto",
		value: "desconto_produto" as TipoPromocao,
		description: "Desconto em produtos específicos",
		icon: "lucide:tag",
	},
	{
		label: "Desconto em Categoria",
		value: "desconto_categoria" as TipoPromocao,
		description: "Desconto em toda categoria",
		icon: "lucide:folder",
	},
	{
		label: "Combo Promocional",
		value: "combo_promocional" as TipoPromocao,
		description: "Promoção de combo",
		icon: "lucide:package",
	},
	{
		label: "Leve e Pague",
		value: "leve_pague" as TipoPromocao,
		description: "Ex: Leve 3 pague 2",
		icon: "lucide:gift",
	},
];

// ========================================
// COMPUTADAS
// ========================================

/**
 * Valor da descrição garantindo que seja sempre string
 */
const descricaoValue = computed({
	get: () => values.descricao || "",
	set: (value: string) => setFieldValue("descricao", value || undefined),
});

/**
 * Texto do tipo de desconto baseado no tipo da promoção
 */
const tipoDescontoText = computed(() => {
	switch (values.tipo) {
		case "desconto_produto":
		case "desconto_categoria":
		case "leve_pague":
			return "Percentual (%)";
		case "combo_promocional":
			return "Valor Fixo (R$)";
		default:
			return "Desconto";
	}
});

/**
 * Placeholder do desconto baseado no tipo
 */
const descontoPlaceholder = computed(() => {
	switch (values.tipo) {
		case "desconto_produto":
		case "desconto_categoria":
		case "leve_pague":
			return "Ex: 15 (para 15%)";
		case "combo_promocional":
			return "Ex: 5.00 (para R$ 5,00)";
		default:
			return "Digite o valor";
	}
});

/**
 * Valor máximo do desconto baseado no tipo
 */
const descontoMax = computed(() => {
	switch (values.tipo) {
		case "desconto_produto":
		case "desconto_categoria":
		case "leve_pague":
			return 100; // Máximo 100%
		case "combo_promocional":
			return 9999.99; // Valor em reais
		default:
			return 100;
	}
});

/**
 * Valor mínimo do desconto
 */
const descontoMin = computed(() => {
	return 0.01;
});

/**
 * Step do input de desconto
 */
const descontoStep = computed(() => {
	switch (values.tipo) {
		case "combo_promocional":
			return 0.01; // Centavos
		default:
			return 1; // Inteiros para percentual
	}
});

/**
 * Preview do desconto formatado
 */
const descontoPreview = computed(() => {
	const valor = values.desconto;

	if (!valor) return "";

	switch (values.tipo) {
		case "desconto_produto":
		case "desconto_categoria":
		case "leve_pague":
			return `${valor}% de desconto`;
		case "combo_promocional":
			return `R$ ${valor.toFixed(2)} de desconto`;
		default:
			return `${valor}% de desconto`;
	}
});

/**
 * Validação do período
 */
const periodoValido = computed(() => {
	if (!values.data_inicio) return false;

	if (temDataFim.value && values.data_fim) {
		return new Date(values.data_fim) > new Date(values.data_inicio);
	}

	return true;
});

/**
 * Duração da promoção em dias
 */
const duracaoPromocao = computed(() => {
	if (!values.data_inicio || !temDataFim.value || !values.data_fim) {
		return null;
	}

	const inicio = new Date(values.data_inicio);
	const fim = new Date(values.data_fim);
	const diffTime = fim.getTime() - inicio.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

	return diffDays > 0 ? diffDays : 0;
});

// ========================================
// HANDLERS
// ========================================

/**
 * Handler para alternar data fim
 */
const _handleToggleDataFim = (value: boolean): void => {
	temDataFim.value = value;

	if (!value) {
		setFieldValue("data_fim", "");
	} else {
		// Definir data fim padrão para 30 dias após o início
		const dataInicio = new Date(values.data_inicio || new Date());
		dataInicio.setDate(dataInicio.getDate() + 30);
		setFieldValue("data_fim", dataInicio.toISOString().split("T")[0]);
	}
};

/**
 * Handler para submissão do formulário
 */
const onSubmit = handleSubmit((formData) => {
	// Limpar data_fim se não estiver sendo usada
	const data: PromocaoFormData = {
		...formData,
		data_fim: temDataFim.value ? formData.data_fim : undefined,
	};

	emit("submit", data);
});

/**
 * Handler para cancelar
 */
const handleCancel = (): void => {
	emit("cancel");
};

// ========================================
// WATCHERS
// ========================================

// Ajustar valor do desconto quando mudar o tipo
watch(
	() => values.tipo,
	(novoTipo) => {
		// Resetar desconto para valor padrão baseado no tipo
		switch (novoTipo) {
			case "desconto_produto":
			case "desconto_categoria":
			case "leve_pague":
				setFieldValue("desconto", 10); // 10%
				break;
			case "combo_promocional":
				setFieldValue("desconto", 5.0); // R$ 5,00
				break;
		}
	},
);

// ========================================
// INICIALIZAÇÃO
// ========================================

onMounted(() => {
	// Se tem data inicial, verificar se tem data fim
	if (props.initialData?.data_fim) {
		temDataFim.value = true;
	}
});
</script>

<template>
	<form class="space-y-6" @submit="onSubmit">
		<!-- Informações Básicas -->
		<div class="space-y-4">
			<h3 class="text-lg font-medium text-[var(--text-primary)]">Informações Básicas</h3>

			<!-- Nome -->
			<UiFormField name="nome" label="Nome da Promoção" required>
				<UiInput name="nome" placeholder="Ex: Desconto de Verão" maxlength="100" />
			</UiFormField>

			<!-- Descrição -->
			<UiFormField name="descricao" label="Descrição">
				<UiTextarea
					v-model="descricaoValue"
					placeholder="Descrição opcional da promoção"
					:rows="3"
					:maxlength="200"
				/>
			</UiFormField>

			<!-- Tipo da Promoção -->
			<UiFormField name="tipo" label="Tipo da Promoção" required>
				<div class="grid grid-cols-2 gap-3">
					<div v-for="option in tipoOptions" :key="option.value" class="relative">
						<input
							:id="`tipo-${option.value}`"
							v-model="values.tipo"
							:value="option.value"
							type="radio"
							name="tipo"
							class="peer sr-only"
						/>
						<label
							:for="`tipo-${option.value}`"
							class="flex flex-col items-center justify-center p-4 border-2 border-[var(--border-default)] rounded-lg cursor-pointer transition-all duration-200 hover:border-[var(--primary)] hover:bg-[var(--primary-light)] peer-checked:border-[var(--primary)] peer-checked:bg-[var(--primary-light)] peer-checked:text-[var(--primary)]"
						>
							<!-- Ícone -->
							<Icon :name="option.icon" class="w-6 h-6 mb-2" />

							<!-- Título -->
							<span class="font-medium text-sm text-center leading-tight">
								{{ option.label }}
							</span>

							<!-- Descrição -->
							<span class="text-xs text-[var(--text-muted)] text-center mt-1">
								{{ option.description }}
							</span>

							<!-- Indicador de seleção -->
							<div
								class="absolute top-2 right-2 w-4 h-4 rounded-full border-2 border-[var(--border-default)] bg-white peer-checked:border-[var(--primary)] peer-checked:bg-[var(--primary)] transition-all duration-200"
							>
								<Icon
									name="lucide:check"
									class="w-2.5 h-2.5 text-white absolute top-0.5 left-0.5 opacity-0 peer-checked:opacity-100 transition-opacity duration-200"
								/>
							</div>
						</label>
					</div>
				</div>
			</UiFormField>
		</div>

		<!-- Configurações de Desconto -->
		<div class="space-y-4">
			<h3 class="text-lg font-medium text-[var(--text-primary)]">Desconto</h3>

			<!-- Valor do Desconto -->
			<UiFormField name="desconto" :label="tipoDescontoText" required>
				<UiCurrencyInput
					v-if="values.tipo === 'combo_promocional'"
					:model-value="values.desconto"
					:placeholder="descontoPlaceholder"
					@update:model-value="(v) => setFieldValue('desconto', v)"
				/>
				<UiInput
					v-else
					name="desconto"
					type="number"
					:placeholder="descontoPlaceholder"
					:min="descontoMin"
					:max="descontoMax"
					:step="descontoStep"
				/>
			</UiFormField>

			<!-- Preview do Desconto -->
			<div v-if="descontoPreview" class="p-3 bg-[var(--primary-light)] rounded-lg">
				<div class="flex items-center gap-2">
					<Icon name="lucide:tag" class="w-5 h-5 text-[var(--primary)]" />
					<span class="font-medium text-[var(--primary)]">{{ descontoPreview }}</span>
				</div>
			</div>
		</div>

		<!-- Configurações de Período -->
		<div class="space-y-4">
			<h3 class="text-lg font-medium text-[var(--text-primary)]">Período de Validade</h3>

			<!-- Data de Início -->
			<UiFormField name="data_inicio" label="Data de Início" required>
				<UiInput name="data_inicio" type="date" />
			</UiFormField>

			<!-- Toggle para Data Fim -->
			<div class="flex items-center gap-3">
				<UiSwitch v-model="temDataFim" />
				<label class="text-sm font-medium text-[var(--text-primary)]">
					Definir data de término
				</label>
			</div>

			<!-- Data de Fim -->
			<UiFormField v-if="temDataFim" name="data_fim" label="Data de Término" :required="temDataFim">
				<UiInput name="data_fim" type="date" />
			</UiFormField>

			<!-- Validação do Período -->
			<div
				v-if="!periodoValido && temDataFim && values.data_fim"
				class="p-3 bg-red-50 border border-red-200 rounded-lg"
			>
				<div class="flex items-center gap-2 text-red-700">
					<Icon name="lucide:alert-triangle" class="w-4 h-4" />
					<span class="text-sm">A data de término deve ser posterior à data de início</span>
				</div>
			</div>

			<!-- Duração da Promoção -->
			<div v-if="duracaoPromocao !== null" class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
				<div class="flex items-center gap-2 text-blue-700">
					<Icon name="lucide:calendar" class="w-4 h-4" />
					<span class="text-sm">
						Duração: {{ duracaoPromocao }} {{ duracaoPromocao === 1 ? "dia" : "dias" }}
					</span>
				</div>
			</div>

			<!-- Promoção sem data fim -->
			<div v-if="!temDataFim" class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
				<div class="flex items-center gap-2 text-yellow-700">
					<Icon name="lucide:infinity" class="w-4 h-4" />
					<span class="text-sm">Esta promoção não terá data de expiração</span>
				</div>
			</div>
		</div>

		<!-- Resumo da Promoção -->
		<div class="space-y-4">
			<h3 class="text-lg font-medium text-[var(--text-primary)]">Resumo</h3>

			<div class="border border-[var(--border-default)] rounded-lg p-4 space-y-3">
				<div class="flex items-center justify-between">
					<span class="text-sm text-[var(--text-muted)]">Nome:</span>
					<span class="font-medium">{{ values.nome || "Nome da promoção" }}</span>
				</div>

				<div class="flex items-center justify-between">
					<span class="text-sm text-[var(--text-muted)]">Tipo:</span>
					<span class="font-medium">
						{{ tipoOptions.find((opt) => opt.value === values.tipo)?.label }}
					</span>
				</div>

				<div class="flex items-center justify-between">
					<span class="text-sm text-[var(--text-muted)]">Desconto:</span>
					<span class="font-medium text-[var(--primary)]">{{ descontoPreview }}</span>
				</div>

				<div class="flex items-center justify-between">
					<span class="text-sm text-[var(--text-muted)]">Período:</span>
					<span class="font-medium">
						{{
							values.data_inicio
								? new Date(values.data_inicio).toLocaleDateString("pt-BR")
								: "Não definido"
						}}
						{{
							temDataFim && values.data_fim
								? ` - ${new Date(values.data_fim).toLocaleDateString("pt-BR")}`
								: " (sem fim)"
						}}
					</span>
				</div>
			</div>
		</div>

		<!-- Ações -->
		<div class="flex gap-3 justify-end pt-6 border-t border-[var(--border-default)]">
			<UiButton type="button" variant="outline" @click="handleCancel"> Cancelar </UiButton>
			<UiButton type="submit" variant="solid" :loading="props.loading" :disabled="!periodoValido">
				{{ props.initialData ? "Atualizar" : "Criar" }} Promoção
			</UiButton>
		</div>
	</form>
</template>
