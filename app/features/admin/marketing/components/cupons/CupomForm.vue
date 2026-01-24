<script setup lang="ts">
/**
 * 📌 CupomForm
 *
 * Formulário para criar/editar cupons com validação em tempo real.
 * Suporta diferentes tipos de cupom e validação de código único.
 */

import { toTypedSchema } from "@vee-validate/zod";
import { cupomSchema } from "#shared/schemas/marketing";
import { useCupons } from "../../composables/useCupons";
import { formatCurrency } from "../../../../../../lib/formatters/currency";
import type { CupomFormData, TipoCupom } from "#shared/types/marketing";

interface Props {
	initialData?: Partial<CupomFormData> & { _cupomId?: string };
	loading?: boolean;
}

interface Emits {
	submit: [data: CupomFormData];
	cancel: [];
}

const props = withDefaults(defineProps<Props>(), {
	initialData: () => ({}),
	loading: false,
});

const emit = defineEmits<Emits>();

// ========================================
// COMPOSABLES
// ========================================

const { checkCodigoDisponivel } = useCupons();

// ========================================
// FORMULÁRIO
// ========================================

const validationSchema = toTypedSchema(cupomSchema);

const { handleSubmit, values, setFieldValue } = useForm({
	validationSchema,
	initialValues: {
		codigo: props.initialData?.codigo || "",
		tipo: props.initialData?.tipo || "percentual",
		valor_desconto:
			props.initialData?.valor_desconto || (props.initialData?.tipo === "frete_gratis" ? 0 : 10),
		valor_minimo: props.initialData?.valor_minimo || undefined,
		limite_uso: props.initialData?.limite_uso || undefined,
		data_expiracao: props.initialData?.data_expiracao || "",
		descricao: props.initialData?.descricao || "",
	},
});

// ========================================
// ESTADO LOCAL
// ========================================

const temValorMinimo = ref(!!props.initialData?.valor_minimo);
const temLimiteUso = ref(!!props.initialData?.limite_uso);
const temDataExpiracao = ref(!!props.initialData?.data_expiracao);
const codigoDisponivel = ref<boolean | null>(null);
const checkingCodigo = ref(false);

// ========================================
// OPÇÕES DOS SELECTS
// ========================================

const tipoOptions = [
	{
		label: "Desconto Percentual",
		value: "percentual" as TipoCupom,
		description: "Ex: 15% de desconto",
		icon: "lucide:percent",
	},
	{
		label: "Valor Fixo",
		value: "valor_fixo" as TipoCupom,
		description: "Ex: R$ 10,00 de desconto",
		icon: "lucide:banknote",
	},
	{
		label: "Frete Grátis",
		value: "frete_gratis" as TipoCupom,
		description: "Cliente não paga frete",
		icon: "lucide:truck",
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
 * Validação de negócio: detecta configurações problemáticas
 */
const validacaoNegocio = computed(() => {
	const tipo = values.tipo;
	const desconto = values.valor_desconto || 0;
	const minimo = values.valor_minimo || 0;

	// Caso 1: Valor fixo maior ou igual ao valor mínimo
	if (tipo === "valor_fixo" && temValorMinimo.value && minimo > 0 && desconto >= minimo * 0.9) {
		return {
			tipo: "erro",
			titulo: "⚠️ Desconto muito alto!",
			mensagem: `O desconto de ${formatCurrency(desconto)} é ${desconto >= minimo ? "maior ou igual" : "muito próximo"} ao valor mínimo de ${formatCurrency(minimo)}. O cliente pagaria ${desconto >= minimo ? "zero ou negativo" : "quase nada"}.`,
			sugestao: `Reduza o desconto para no máximo ${formatCurrency(minimo * 0.5)} (50% do valor mínimo).`,
		};
	}

	// Caso 2: Percentual muito alto (>70%) com valor mínimo baixo (<R$ 80)
	if (tipo === "percentual" && desconto > 70 && temValorMinimo.value && minimo > 0 && minimo < 80) {
		return {
			tipo: "erro",
			titulo: "⚠️ Promoção muito agressiva!",
			mensagem: `${desconto}% de desconto em pedidos de apenas ${formatCurrency(minimo)} pode comprometer sua margem de lucro. Cliente pagaria apenas ${formatCurrency(minimo * (1 - desconto / 100))}.`,
			sugestao: `Aumente o valor mínimo para pelo menos R$ 100,00 ou reduza o percentual para 50%.`,
		};
	}

	// Caso 3: Percentual alto (50-70%) com valor mínimo baixo (<R$ 50)
	if (
		tipo === "percentual" &&
		desconto >= 50 &&
		desconto <= 70 &&
		temValorMinimo.value &&
		minimo > 0 &&
		minimo < 50
	) {
		return {
			tipo: "aviso",
			titulo: "⚠️ Atenção à margem de lucro",
			mensagem: `${desconto}% de desconto em pedidos de ${formatCurrency(minimo)} significa que o cliente pagará apenas ${formatCurrency(minimo * (1 - desconto / 100))}. Verifique se isso é sustentável para seu negócio.`,
			sugestao: `Considere aumentar o valor mínimo para R$ 80,00 ou reduzir o percentual.`,
		};
	}

	// Caso 4: Desconto 100%
	if (tipo === "percentual" && desconto === 100) {
		return {
			tipo: "aviso",
			titulo: "🎁 Produto totalmente grátis",
			mensagem: `Com 100% de desconto, o cliente não pagará nada pelo pedido. Confirme se isso é intencional (ex: promoção especial, brinde).`,
			sugestao: null,
		};
	}

	// Caso 5: Frete grátis sem valor mínimo
	if (tipo === "frete_gratis" && !temValorMinimo.value) {
		return {
			tipo: "aviso",
			titulo: "💡 Recomendação: Defina um valor mínimo",
			mensagem: `Frete grátis sem valor mínimo significa que qualquer pedido terá frete grátis, o que pode ser muito custoso para seu negócio.`,
			sugestao: `Recomendamos definir um valor mínimo de R$ 50,00 a R$ 80,00.`,
		};
	}

	// Caso 6: Valor fixo muito alto (>R$ 50) sem valor mínimo
	if (tipo === "valor_fixo" && desconto > 50 && !temValorMinimo.value) {
		return {
			tipo: "aviso",
			titulo: "💡 Recomendação: Defina um valor mínimo",
			mensagem: `Desconto de ${formatCurrency(desconto)} sem valor mínimo pode ser usado em pedidos pequenos, reduzindo muito sua receita.`,
			sugestao: `Recomendamos definir um valor mínimo de pelo menos ${formatCurrency(desconto * 3)}.`,
		};
	}

	return null;
});

/**
 * Indica se o formulário deve ser bloqueado
 */
const formularioBloqueado = computed(() => {
	return validacaoNegocio.value?.tipo === "erro";
});

/**
 * Texto do tipo de desconto baseado no tipo do cupom
 */
const tipoDescontoText = computed(() => {
	switch (values.tipo) {
		case "percentual":
			return "Percentual de Desconto (%)";
		case "valor_fixo":
			return "Valor do Desconto (R$)";
		case "frete_gratis":
			return "Frete Grátis";
		default:
			return "Desconto";
	}
});

/**
 * Placeholder do desconto baseado no tipo
 */
const descontoPlaceholder = computed(() => {
	switch (values.tipo) {
		case "percentual":
			return "Ex: 15 (para 15%)";
		case "valor_fixo":
			return "Ex: 10.00 (para R$ 10,00)";
		case "frete_gratis":
			return "Ex: 10.00 (valor que será zerado)";
		default:
			return "Digite o valor";
	}
});

/**
 * Preview do desconto formatado
 */
const descontoPreview = computed(() => {
	const valor = values.valor_desconto;

	switch (values.tipo) {
		case "percentual":
			return valor ? `${valor}% de desconto` : "";
		case "valor_fixo":
			return valor ? `${formatCurrency(valor)} de desconto` : "";
		case "frete_gratis":
			return `Frete grátis (valor calculado automaticamente)`;
		default:
			return valor ? `${valor}% de desconto` : "";
	}
});

/**
 * Ícone do cupom baseado no tipo
 */
const cupomIcon = computed(() => {
	switch (values.tipo) {
		case "percentual":
			return "lucide:percent";
		case "valor_fixo":
			return "lucide:banknote";
		case "frete_gratis":
			return "lucide:truck";
		default:
			return "lucide:ticket";
	}
});

/**
 * Status da validação do código
 */
const codigoStatus = computed(() => {
	if (checkingCodigo.value) {
		return { text: "Verificando...", color: "blue", icon: "lucide:loader" };
	}

	if (codigoDisponivel.value === true) {
		return { text: "Disponível", color: "green", icon: "lucide:check" };
	}

	if (codigoDisponivel.value === false) {
		return { text: "Já existe", color: "red", icon: "lucide:x" };
	}

	return null;
});

// ========================================
// HANDLERS
// ========================================

/**
 * Handler para alternar valor mínimo
 */
const handleToggleValorMinimo = (value: boolean): void => {
	temValorMinimo.value = value;

	if (!value) {
		setFieldValue("valor_minimo", undefined);
	}
	// Não definir valor padrão - deixar o usuário preencher conscientemente
};

/**
 * Handler para alternar limite de uso
 */
const handleToggleLimiteUso = (value: boolean): void => {
	temLimiteUso.value = value;

	if (!value) {
		setFieldValue("limite_uso", undefined);
	} else {
		setFieldValue("limite_uso", 100);
	}
};

/**
 * Handler para alternar data de expiração
 */
const handleToggleDataExpiracao = (value: boolean): void => {
	temDataExpiracao.value = value;

	if (!value) {
		setFieldValue("data_expiracao", "");
	} else {
		// Definir data padrão para 30 dias a partir de hoje
		const hoje = new Date();
		hoje.setDate(hoje.getDate() + 30);
		setFieldValue("data_expiracao", hoje.toISOString().split("T")[0]);
	}
};

/**
 * Handler para verificar disponibilidade do código
 */
const handleCheckCodigo = async (): Promise<void> => {
	if (!values.codigo || values.codigo.length < 3) {
		codigoDisponivel.value = null;
		return;
	}

	try {
		checkingCodigo.value = true;
		// Usar o _cupomId se estiver editando
		const cupomId = props.initialData?._cupomId;
		const disponivel = await checkCodigoDisponivel(values.codigo, cupomId);
		codigoDisponivel.value = disponivel;
	} catch (error) {
		console.error("Erro ao verificar código:", error);
		codigoDisponivel.value = null;
	} finally {
		checkingCodigo.value = false;
	}
};

/**
 * Handler para submissão do formulário
 */
const onSubmit = handleSubmit((formData) => {
	// Limpar campos opcionais se não estiverem sendo usados
	const data: CupomFormData = {
		codigo: formData.codigo,
		tipo: formData.tipo,
		// Para frete grátis, enviar valor_desconto como 1 (será calculado dinamicamente)
		// Para outros tipos, garantir que valor_desconto seja > 0
		valor_desconto:
			formData.tipo === "frete_gratis"
				? 1 // Valor simbólico para frete grátis (será calculado dinamicamente)
				: formData.valor_desconto && formData.valor_desconto > 0
					? formData.valor_desconto
					: 10, // valor padrão se estiver vazio ou zero
		valor_minimo: temValorMinimo.value ? formData.valor_minimo : undefined,
		limite_uso: temLimiteUso.value ? formData.limite_uso : undefined,
		data_expiracao: temDataExpiracao.value ? formData.data_expiracao : undefined,
		descricao: formData.descricao || undefined,
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
			case "percentual":
				setFieldValue("valor_desconto", 10); // 10%
				break;
			case "valor_fixo":
				setFieldValue("valor_desconto", 5.0); // R$ 5,00
				break;
			case "frete_gratis":
				setFieldValue("valor_desconto", 0); // Não precisa de valor para frete grátis
				break;
		}
	},
);

// Verificar código quando mudar (apenas se não estiver vazio)
let debounceTimer: NodeJS.Timeout | null = null;
watch(
	() => values.codigo,
	(newCodigo) => {
		// Só verificar se tiver código e tiver mais de 3 caracteres
		if (!newCodigo || newCodigo.length < 3) {
			codigoDisponivel.value = null;
			return;
		}

		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}
		debounceTimer = setTimeout(() => {
			handleCheckCodigo();
		}, 500);
	},
);

// ========================================
// INICIALIZAÇÃO
// ========================================

/**
 * Inicializa o formulário com os dados fornecidos
 */
const initializeForm = (): void => {
	// Configurar valores do formulário
	if (props.initialData?.codigo) {
		setFieldValue("codigo", props.initialData.codigo);
	}
	if (props.initialData?.tipo) {
		setFieldValue("tipo", props.initialData.tipo);
	}
	if (props.initialData?.valor_desconto !== undefined) {
		setFieldValue("valor_desconto", props.initialData.valor_desconto);
	}
	if (props.initialData?.descricao) {
		setFieldValue("descricao", props.initialData.descricao);
	}
	if (props.initialData?.data_expiracao) {
		setFieldValue("data_expiracao", props.initialData.data_expiracao);
	}

	// Configurar toggles
	if (props.initialData?.valor_minimo) {
		temValorMinimo.value = true;
		setFieldValue("valor_minimo", props.initialData.valor_minimo);
	}
	if (props.initialData?.limite_uso) {
		temLimiteUso.value = true;
		setFieldValue("limite_uso", props.initialData.limite_uso);
	}
	if (props.initialData?.data_expiracao) {
		temDataExpiracao.value = true;
	}

	// Verificar código inicial se estiver editando
	if (props.initialData?.codigo) {
		handleCheckCodigo();
	}
};

// Reagir a mudanças no initialData (quando abre drawer para editar)
watch(
	() => props.initialData,
	(newData) => {
		if (newData && Object.keys(newData).length > 0) {
			initializeForm();
		}
	},
	{ immediate: true, deep: true },
);

onMounted(() => {
	initializeForm();
});
</script>

<template>
	<form class="space-y-6" @submit="onSubmit">
		<!-- Informações Básicas -->
		<div class="space-y-4">
			<h3 class="text-lg font-medium text-[var(--text-primary)]">Informações Básicas</h3>

			<!-- Código do Cupom -->
			<UiFormField name="codigo" label="Código do Cupom" required>
				<div class="relative">
					<UiInput
						:model-value="values.codigo"
						name="codigo"
						placeholder="Ex: DESCONTO15"
						maxlength="20"
						class="uppercase"
						@input="
							(e: Event) =>
								setFieldValue('codigo', ((e.target as HTMLInputElement).value || '').toUpperCase())
						"
					/>

					<!-- Status do código -->
					<div
						v-if="codigoStatus"
						class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2"
					>
						<Icon
							:name="codigoStatus.icon"
							class="w-4 h-4"
							:class="{
								'text-blue-500': codigoStatus.color === 'blue',
								'text-green-500': codigoStatus.color === 'green',
								'text-red-500': codigoStatus.color === 'red',
								'animate-spin': checkingCodigo,
							}"
						/>
						<span
							class="text-xs font-medium"
							:class="{
								'text-blue-600': codigoStatus.color === 'blue',
								'text-green-600': codigoStatus.color === 'green',
								'text-red-600': codigoStatus.color === 'red',
							}"
						>
							{{ codigoStatus.text }}
						</span>
					</div>
				</div>
			</UiFormField>

			<!-- Descrição -->
			<UiFormField name="descricao" label="Descrição">
				<UiTextarea
					v-model="descricaoValue"
					placeholder="Descrição opcional do cupom"
					:rows="3"
					:maxlength="200"
				/>
			</UiFormField>

			<!-- Tipo do Cupom -->
			<UiFormField name="tipo" label="Tipo do Cupom" required>
				<div class="grid grid-cols-3 gap-3">
					<div v-for="option in tipoOptions" :key="option.value" class="relative">
						<input
							:id="`tipo-${option.value}`"
							:checked="values.tipo === option.value"
							:value="option.value"
							type="radio"
							name="tipo"
							class="peer sr-only"
							@change="setFieldValue('tipo', option.value)"
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
		<div :key="`desconto-${values.tipo}`" class="space-y-4">
			<h3 class="text-lg font-medium text-[var(--text-primary)]">Desconto</h3>

			<!-- Valor do Desconto (apenas para percentual e valor_fixo) -->
			<UiFormField
				v-if="values.tipo !== 'frete_gratis'"
				name="valor_desconto"
				:label="tipoDescontoText"
				required
			>
				<!-- Input para Valor Fixo (R$) -->
				<UiCurrencyInput
					v-if="values.tipo === 'valor_fixo'"
					name="valor_desconto"
					:placeholder="descontoPlaceholder"
					:model-value="values.valor_desconto"
					@update:model-value="(val) => setFieldValue('valor_desconto', val)"
				/>

				<!-- Input para Percentual (%) -->
				<div
					v-else
					class="relative flex items-center bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg transition-all duration-200 focus-within:border-[var(--input-border-focus)] focus-within:ring-2 focus-within:ring-[var(--input-border-focus)] focus-within:ring-opacity-20 min-h-[40px] px-3"
				>
					<!-- Símbolo do percentual -->
					<div class="text-[var(--text-muted)] font-medium mr-2 pointer-events-none">%</div>

					<!-- Input -->
					<input
						:value="values.valor_desconto"
						type="number"
						:placeholder="descontoPlaceholder"
						:min="1"
						:max="100"
						:step="1"
						class="flex-1 bg-transparent border-0 outline-none text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
						@input="
							(e) => setFieldValue('valor_desconto', Number((e.target as HTMLInputElement).value))
						"
					/>
				</div>
			</UiFormField>

			<!-- Explicação para Frete Grátis -->
			<div v-if="values.tipo === 'frete_gratis'" class="p-4 bg-[var(--primary-light)] rounded-lg">
				<div class="flex items-start gap-3">
					<Icon name="lucide:info" class="w-5 h-5 text-[var(--primary)] mt-0.5 flex-shrink-0" />
					<div class="space-y-2">
						<h4 class="font-medium text-[var(--primary)]">Como funciona o Frete Grátis</h4>
						<p class="text-sm text-[var(--text-muted)]">
							O sistema calculará automaticamente o valor do frete baseado no CEP do cliente e peso
							dos produtos. Quando este cupom for aplicado, o frete será zerado independente do
							valor calculado.
						</p>
					</div>
				</div>
			</div>

			<!-- Preview do Desconto -->
			<div v-if="descontoPreview" class="p-3 bg-[var(--primary-light)] rounded-lg">
				<div class="flex items-center gap-2">
					<Icon
						v-if="values.tipo !== 'percentual'"
						:name="cupomIcon"
						class="w-5 h-5 text-[var(--primary)]"
					/>
					<span class="font-medium text-[var(--primary)]">{{ descontoPreview }}</span>
				</div>
			</div>

			<!-- Card de Validação de Negócio -->
			<div
				v-if="validacaoNegocio"
				class="p-4 rounded-lg border-2"
				:class="{
					'bg-red-50 border-red-500 dark:bg-red-900/20 dark:border-red-500':
						validacaoNegocio.tipo === 'erro',
					'bg-yellow-50 border-yellow-500 dark:bg-yellow-900/20 dark:border-yellow-500':
						validacaoNegocio.tipo === 'aviso',
				}"
			>
				<div class="flex items-start gap-3">
					<Icon
						:name="
							validacaoNegocio.tipo === 'erro' ? 'lucide:alert-octagon' : 'lucide:alert-triangle'
						"
						class="w-6 h-6 flex-shrink-0 mt-0.5"
						:class="{
							'text-red-600 dark:text-red-400': validacaoNegocio.tipo === 'erro',
							'text-yellow-600 dark:text-yellow-400': validacaoNegocio.tipo === 'aviso',
						}"
					/>
					<div class="flex-1 space-y-2">
						<h4
							class="font-bold text-sm"
							:class="{
								'text-red-800 dark:text-red-300': validacaoNegocio.tipo === 'erro',
								'text-yellow-800 dark:text-yellow-300': validacaoNegocio.tipo === 'aviso',
							}"
						>
							{{ validacaoNegocio.titulo }}
						</h4>
						<p
							class="text-sm"
							:class="{
								'text-red-700 dark:text-red-300': validacaoNegocio.tipo === 'erro',
								'text-yellow-700 dark:text-yellow-300': validacaoNegocio.tipo === 'aviso',
							}"
						>
							{{ validacaoNegocio.mensagem }}
						</p>
						<div
							v-if="validacaoNegocio.sugestao"
							class="flex items-start gap-2 mt-3 p-3 rounded-md"
							:class="{
								'bg-red-100 dark:bg-red-900/30': validacaoNegocio.tipo === 'erro',
								'bg-yellow-100 dark:bg-yellow-900/30': validacaoNegocio.tipo === 'aviso',
							}"
						>
							<Icon
								name="lucide:lightbulb"
								class="w-4 h-4 flex-shrink-0 mt-0.5"
								:class="{
									'text-red-700 dark:text-red-400': validacaoNegocio.tipo === 'erro',
									'text-yellow-700 dark:text-yellow-400': validacaoNegocio.tipo === 'aviso',
								}"
							/>
							<p
								class="text-xs font-medium"
								:class="{
									'text-red-800 dark:text-red-300': validacaoNegocio.tipo === 'erro',
									'text-yellow-800 dark:text-yellow-300': validacaoNegocio.tipo === 'aviso',
								}"
							>
								<strong>Sugestão:</strong> {{ validacaoNegocio.sugestao }}
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Configurações Opcionais -->
		<div class="space-y-6">
			<h3 class="text-lg font-medium text-[var(--text-primary)]">Configurações Opcionais</h3>

			<!-- Container Valor Mínimo -->
			<div
				class="bg-[var(--surface-secondary)] border border-[var(--border-default)] rounded-lg p-4 shadow-sm"
			>
				<div class="flex items-center justify-between mb-4">
					<div class="flex items-center gap-3">
						<UiSwitch v-model="temValorMinimo" @update:model-value="handleToggleValorMinimo" />
						<div>
							<label class="text-sm font-medium text-[var(--text-primary)]">Valor mínimo</label>
							<p class="text-xs text-[var(--text-muted)] mt-1">
								{{
									values.tipo === "frete_gratis"
										? "Definir valor mínimo para aplicar frete grátis"
										: "Definir valor mínimo do pedido para usar o cupom"
								}}
							</p>
						</div>
					</div>
				</div>

				<!-- Campo e explicação aparecem quando ativo -->
				<div v-if="temValorMinimo" class="space-y-4">
					<UiFormField
						name="valor_minimo"
						:label="
							values.tipo === 'frete_gratis'
								? 'Valor Mínimo para Frete Grátis (R$)'
								: 'Valor Mínimo (R$)'
						"
						:required="temValorMinimo"
					>
						<UiCurrencyInput
							:model-value="values.valor_minimo"
							:placeholder="
								values.tipo === 'frete_gratis'
									? 'Ex: 50,00 (frete grátis acima deste valor)'
									: 'Ex: 50,00'
							"
							@update:model-value="(value) => setFieldValue('valor_minimo', value)"
						/>
					</UiFormField>

					<!-- Card explicativo para todos os tipos -->
					<div
						class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
					>
						<div class="flex items-start gap-2">
							<Icon
								name="lucide:info"
								class="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"
							/>
							<div class="text-sm text-blue-700 dark:text-blue-300">
								<div v-if="values.tipo === 'percentual'">
									<strong>Para que serve:</strong> Garante que o desconto percentual só seja
									aplicado em pedidos de valor significativo.
									<br />
									<span class="text-xs opacity-75 mt-1 block">
										💡 <strong>Exemplo:</strong> "15% de desconto em pedidos acima de R$ 80" -
										protege sua margem e incentiva compras maiores.
									</span>
								</div>
								<div v-else-if="values.tipo === 'valor_fixo'">
									<strong>Para que serve:</strong> Evita que descontos fixos sejam usados em pedidos
									muito pequenos, protegendo sua receita.
									<br />
									<span class="text-xs opacity-75 mt-1 block">
										💡 <strong>Exemplo:</strong> "R$ 10 de desconto em pedidos acima de R$ 50" - sem
										isso, alguém poderia comprar R$ 15 e pagar só R$ 5.
									</span>
								</div>
								<div v-else-if="values.tipo === 'frete_gratis'">
									<strong>Para que serve:</strong> Define o valor mínimo para oferecer frete grátis,
									comum em estratégias de e-commerce.
									<br />
									<span class="text-xs opacity-75 mt-1 block">
										💡 <strong>Exemplo:</strong> "Frete grátis em compras acima de R$ 50" -
										incentiva pedidos maiores e compensa o custo do frete.
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Container Limite de Uso -->
			<div
				class="bg-[var(--surface-secondary)] border border-[var(--border-default)] rounded-lg p-4 shadow-sm"
			>
				<div class="flex items-center justify-between mb-4">
					<div class="flex items-center gap-3">
						<UiSwitch v-model="temLimiteUso" @update:model-value="handleToggleLimiteUso" />
						<div>
							<label class="text-sm font-medium text-[var(--text-primary)]">Limite de uso</label>
							<p class="text-xs text-[var(--text-muted)] mt-1">
								Definir quantas vezes o cupom pode ser usado
							</p>
						</div>
					</div>
				</div>

				<!-- Campo aparece quando ativo -->
				<div v-if="temLimiteUso">
					<UiFormField name="limite_uso" label="Limite de Uso" :required="temLimiteUso">
						<UiInput
							:model-value="values.limite_uso"
							name="limite_uso"
							type="number"
							placeholder="Ex: 100"
							:min="1"
							:max="99999"
							:step="1"
							@update:model-value="
								(value) => setFieldValue('limite_uso', value ? parseInt(String(value)) : undefined)
							"
						/>
					</UiFormField>
				</div>
			</div>

			<!-- Container Data de Expiração -->
			<div
				class="bg-[var(--surface-secondary)] border border-[var(--border-default)] rounded-lg p-4 shadow-sm"
			>
				<div class="flex items-center justify-between mb-4">
					<div class="flex items-center gap-3">
						<UiSwitch v-model="temDataExpiracao" @update:model-value="handleToggleDataExpiracao" />
						<div>
							<label class="text-sm font-medium text-[var(--text-primary)]"
								>Data de expiração</label
							>
							<p class="text-xs text-[var(--text-muted)] mt-1">
								Definir quando o cupom expira automaticamente
							</p>
						</div>
					</div>
				</div>

				<!-- Campo aparece quando ativo -->
				<div v-if="temDataExpiracao">
					<UiFormField name="data_expiracao" label="Data de Expiração" :required="temDataExpiracao">
						<UiDatePicker
							:model-value="values.data_expiracao"
							placeholder="Selecione a data de expiração"
							:min-date="new Date().toISOString().split('T')[0]"
							@update:model-value="
								(value) => setFieldValue('data_expiracao', String(value) || undefined)
							"
						/>
					</UiFormField>
				</div>
			</div>

			<!-- Resumo do Cupom -->
			<div class="space-y-4">
				<h3 class="text-lg font-medium text-[var(--text-primary)]">Resumo</h3>

				<div class="border border-[var(--border-default)] rounded-lg p-4 space-y-3">
					<div class="flex items-center justify-between">
						<span class="text-sm text-[var(--text-muted)]">Código:</span>
						<span class="font-mono font-bold">{{ values.codigo || "CODIGO" }}</span>
					</div>

					<div class="flex items-center justify-between">
						<span class="text-sm text-[var(--text-muted)]">Tipo:</span>
						<span class="font-medium">
							{{ tipoOptions.find((opt) => opt.value === values.tipo)?.label }}
						</span>
					</div>

					<div class="flex items-center justify-between">
						<span class="text-sm text-[var(--text-muted)]">Desconto:</span>
						<div class="text-right">
							<span class="font-medium text-[var(--primary)]">
								{{
									values.tipo === "percentual"
										? `${values.valor_desconto}% de desconto`
										: values.tipo === "valor_fixo"
											? `${formatCurrency(values.valor_desconto || 0)} de desconto`
											: "Frete grátis"
								}}
							</span>
							<div
								v-if="values.tipo === 'frete_gratis'"
								class="text-xs text-[var(--text-muted)] mt-1"
							>
								O cliente não pagará frete
							</div>
						</div>
					</div>

					<div
						v-if="temValorMinimo && values.valor_minimo"
						class="flex items-center justify-between"
					>
						<span class="text-sm text-[var(--text-muted)]">
							{{
								values.tipo === "frete_gratis" ? "Valor mínimo para frete grátis:" : "Valor mínimo:"
							}}
						</span>
						<div class="text-right">
							<span class="font-medium">{{ formatCurrency(values.valor_minimo) }}</span>
							<div
								v-if="values.tipo === 'frete_gratis'"
								class="text-xs text-[var(--text-muted)] mt-1"
							>
								Cupom só funciona acima deste valor
							</div>
						</div>
					</div>

					<div v-if="temLimiteUso && values.limite_uso" class="flex items-center justify-between">
						<span class="text-sm text-[var(--text-muted)]">Limite de uso:</span>
						<span class="font-medium">{{ values.limite_uso }} vezes</span>
					</div>

					<div
						v-if="temDataExpiracao && values.data_expiracao"
						class="flex items-center justify-between"
					>
						<span class="text-sm text-[var(--text-muted)]">Expira em:</span>
						<span class="font-medium">{{
							new Date(values.data_expiracao).toLocaleDateString("pt-BR")
						}}</span>
					</div>
				</div>
			</div>

			<!-- Ações -->
			<div class="flex gap-3 justify-end pt-6 border-t border-[var(--border-default)]">
				<UiButton type="button" variant="outline" @click="handleCancel"> Cancelar </UiButton>
				<UiButton
					type="submit"
					variant="solid"
					:loading="props.loading"
					:disabled="codigoDisponivel === false || formularioBloqueado"
				>
					{{ props.initialData?.codigo ? "Atualizar" : "Criar" }} Cupom
				</UiButton>
			</div>
		</div>
	</form>
</template>
