<script setup lang="ts">
/**
 * 📌 PagamentosTab
 *
 * Tab de configuração de métodos de pagamento (Admin only).
 * Design premium de duas colunas com resumo e editor integrado.
 */

import { toTypedSchema } from "@vee-validate/zod";
import { useForm, Field } from "vee-validate";
import { pagamentosSchema } from "#shared/schemas/configuracoes";
import { usePagamentos } from "../../composables/usePagamentos";
import { useToast } from "~/composables/ui/useToast";
import type { ConfiguracoesPagamento } from "../../types/configuracoes";
import { formatPixKeyProgressive, type TipoChavePix } from "~/lib/formatters/pix";
import { validatePixKey } from "~/lib/validators/pix";

// Tipo auxiliar para remover readonly
type Mutable<T> = {
	-readonly [P in keyof T]: T[P];
};

// Composable de pagamentos
const { pagamentos, loading, saving, salvarPagamentos } = usePagamentos();
const { success } = useToast();

// Schema de validação
const validationSchema = toTypedSchema(pagamentosSchema);

// Formulário com vee-validate
const { handleSubmit, values, setFieldValue, errors, resetForm } = useForm({
	validationSchema,
	keepValuesOnUnmount: true,
});

// Armazenar valores iniciais para comparação
const valoresIniciais = ref<Mutable<ConfiguracoesPagamento> | null>(null);

/**
 * Computed para detectar se houve mudanças nos campos
 */
const hasChanges = computed(() => {
	if (!valoresIniciais.value) return false;

	return (
		values.aceita_dinheiro !== valoresIniciais.value.aceita_dinheiro ||
		values.aceita_pix !== valoresIniciais.value.aceita_pix ||
		values.tipo_chave_pix !== valoresIniciais.value.tipo_chave_pix ||
		(values.chave_pix || "") !== (valoresIniciais.value.chave_pix || "") ||
		values.aceita_cartao_credito !== valoresIniciais.value.aceita_cartao_credito ||
		values.aceita_cartao_debito !== valoresIniciais.value.aceita_cartao_debito
	);
});

// Watch para atualizar valores quando dados carregarem
watch(
	pagamentos,
	(newPagamentos) => {
		if (newPagamentos) {
			// Armazenar valores iniciais para comparação posterior
			valoresIniciais.value = {
				aceita_dinheiro: newPagamentos.aceita_dinheiro,
				aceita_pix: newPagamentos.aceita_pix,
				tipo_chave_pix: newPagamentos.tipo_chave_pix || "cpf",
				chave_pix: newPagamentos.chave_pix || "",
				aceita_cartao_credito: newPagamentos.aceita_cartao_credito,
				aceita_cartao_debito: newPagamentos.aceita_cartao_debito,
			};

			resetForm({
				values: {
					aceita_dinheiro: newPagamentos.aceita_dinheiro,
					aceita_pix: newPagamentos.aceita_pix,
					tipo_chave_pix: newPagamentos.tipo_chave_pix || "cpf",
					chave_pix: newPagamentos.chave_pix || "",
					aceita_cartao_credito: newPagamentos.aceita_cartao_credito,
					aceita_cartao_debito: newPagamentos.aceita_cartao_debito,
				},
			});
		}
	},
	{ immediate: true },
);

// Submeter formulário - SALVAR APENAS CAMPOS MODIFICADOS
const onSubmit = handleSubmit(async (formValues) => {
	if (!valoresIniciais.value) return;

	// Criar objeto mutável para comparação
	const camposModificados: Record<string, unknown> = {};

	// Verificar cada campo individualmente
	if (formValues.aceita_dinheiro !== valoresIniciais.value.aceita_dinheiro) {
		camposModificados.aceita_dinheiro = formValues.aceita_dinheiro;
	}

	if (formValues.aceita_pix !== valoresIniciais.value.aceita_pix) {
		camposModificados.aceita_pix = formValues.aceita_pix;
	}

	if (formValues.tipo_chave_pix !== valoresIniciais.value.tipo_chave_pix) {
		camposModificados.tipo_chave_pix = formValues.tipo_chave_pix;
	}

	if ((formValues.chave_pix || "") !== (valoresIniciais.value.chave_pix || "")) {
		camposModificados.chave_pix = formValues.chave_pix || undefined;
	}

	if (formValues.aceita_cartao_credito !== valoresIniciais.value.aceita_cartao_credito) {
		camposModificados.aceita_cartao_credito = formValues.aceita_cartao_credito;
	}

	if (formValues.aceita_cartao_debito !== valoresIniciais.value.aceita_cartao_debito) {
		camposModificados.aceita_cartao_debito = formValues.aceita_cartao_debito;
	}

	// Se nenhum campo foi modificado, não fazer nada
	if (Object.keys(camposModificados).length === 0) {
		success({
			title: "Nenhuma alteração",
			description: "Não há alterações para salvar",
		});
		return;
	}

	// Mesclar campos modificados com valores atuais para enviar ao backend
	const dadosParaSalvar = {
		aceita_dinheiro:
			"aceita_dinheiro" in camposModificados
				? (camposModificados.aceita_dinheiro as boolean)
				: valoresIniciais.value.aceita_dinheiro,
		aceita_pix:
			"aceita_pix" in camposModificados
				? (camposModificados.aceita_pix as boolean)
				: valoresIniciais.value.aceita_pix,
		tipo_chave_pix:
			"tipo_chave_pix" in camposModificados
				? (camposModificados.tipo_chave_pix as "cpf" | "cnpj" | "email" | "telefone" | "aleatoria")
				: valoresIniciais.value.tipo_chave_pix,
		chave_pix:
			"chave_pix" in camposModificados
				? (camposModificados.chave_pix as string | undefined)
				: valoresIniciais.value.chave_pix,
		aceita_cartao_credito:
			"aceita_cartao_credito" in camposModificados
				? (camposModificados.aceita_cartao_credito as boolean)
				: valoresIniciais.value.aceita_cartao_credito,
		aceita_cartao_debito:
			"aceita_cartao_debito" in camposModificados
				? (camposModificados.aceita_cartao_debito as boolean)
				: valoresIniciais.value.aceita_cartao_debito,
	} as ConfiguracoesPagamento;

	// Salvar
	const sucesso = await salvarPagamentos(dadosParaSalvar);

	// Se salvou com sucesso, atualizar valores iniciais criando um novo objeto
	if (sucesso) {
		valoresIniciais.value = {
			aceita_dinheiro: formValues.aceita_dinheiro,
			aceita_pix: formValues.aceita_pix,
			tipo_chave_pix: formValues.tipo_chave_pix,
			chave_pix: formValues.chave_pix,
			aceita_cartao_credito: formValues.aceita_cartao_credito,
			aceita_cartao_debito: formValues.aceita_cartao_debito,
		};
	}
});

/**
 * Tipos de chave PIX disponíveis
 */
const tiposChavePix = [
	{
		value: "cpf",
		label: "CPF",
		placeholder: "000.000.000-00",
		maxLength: 14,
		mask: "###.###.###-##",
		icon: "lucide:user",
	},
	{
		value: "cnpj",
		label: "CNPJ",
		placeholder: "00.000.000/0000-00",
		maxLength: 18,
		mask: "##.###.###/####-##",
		icon: "lucide:briefcase",
	},
	{
		value: "email",
		label: "E-mail",
		placeholder: "seu@email.com",
		maxLength: 254,
		icon: "lucide:mail",
	},
	{
		value: "telefone",
		label: "Telefone",
		placeholder: "(00) 00000-0000",
		maxLength: 15,
		mask: "(##) #####-####",
		icon: "lucide:phone",
	},
	{
		value: "aleatoria",
		label: "Chave Aleatória",
		placeholder: "Cole sua chave aleatória aqui",
		maxLength: 36,
		icon: "lucide:key",
	},
] as const;

/**
 * Obter placeholder baseado no tipo de chave
 */
const tipoChaveSelecionado = computed(() => {
	return tiposChavePix.find((tipo) => tipo.value === values.tipo_chave_pix) || tiposChavePix[0];
});

/**
 * Handler para mudança da chave PIX - COM FORMATAÇÃO AUTOMÁTICA
 */
const handleChavePixChange = (value: string | number): void => {
	const rawValue = String(value);
	const tipo = values.tipo_chave_pix as TipoChavePix;

	// Aplicar formatação progressiva
	const formatted = formatPixKeyProgressive(rawValue, tipo);

	// Atualizar campo do formulário
	setFieldValue("chave_pix", formatted);
};

/**
 * Validação em tempo real da chave PIX
 */
const chavePixError = computed((): string | null => {
	if (!values.aceita_pix) return null;
	if (!values.chave_pix) return null;

	const tipo = values.tipo_chave_pix as TipoChavePix;
	return validatePixKey(values.chave_pix, tipo);
});

/**
 * Ícone de feedback da chave PIX
 */
const chavePixIcon = computed(() => {
	if (!values.aceita_pix || !values.chave_pix) return null;

	const tipo = values.tipo_chave_pix as TipoChavePix;
	const isValid = validatePixKey(values.chave_pix, tipo) === null;

	return isValid ? "lucide:check-circle" : "lucide:alert-circle";
});

/**
 * Cor do ícone de feedback
 */
const chavePixIconColor = computed(() => {
	if (!values.aceita_pix || !values.chave_pix) return "";

	const tipo = values.tipo_chave_pix as TipoChavePix;
	const isValid = validatePixKey(values.chave_pix, tipo) === null;

	return isValid ? "text-green-500" : "text-red-500";
});

/**
 * Métodos de pagamento disponíveis
 */
const metodosPagamento = [
	{
		key: "aceita_dinheiro" as const,
		label: "Dinheiro",
		description: "Pagamento em espécie na entrega",
		icon: "lucide:banknote",
	},
	{
		key: "aceita_pix" as const,
		label: "PIX",
		description: "Transferência instantânea via PIX",
		icon: "lucide:zap",
	},
	{
		key: "aceita_cartao_credito" as const,
		label: "Cartão de Crédito",
		description: "Com maquininha própria na entrega",
		icon: "lucide:credit-card",
	},
	{
		key: "aceita_cartao_debito" as const,
		label: "Cartão de Débito",
		description: "Com maquininha própria na entrega",
		icon: "lucide:credit-card",
	},
];

const updateMetodo = (key: keyof typeof values, value: boolean): void => {
	setFieldValue(key, value);
};

const temMetodoAtivo = computed((): boolean => {
	return !!(
		values.aceita_dinheiro ||
		values.aceita_pix ||
		values.aceita_cartao_credito ||
		values.aceita_cartao_debito
	);
});

const metodosAtivosCount = computed((): number => {
	return [
		values.aceita_dinheiro,
		values.aceita_pix,
		values.aceita_cartao_credito,
		values.aceita_cartao_debito,
	].filter(Boolean).length;
});

const listaMetodosAtivos = computed(() => {
	return metodosPagamento.filter((m) => values[m.key]);
});

const percentualAtivacao = computed(() => {
	return Math.round((metodosAtivosCount.value / metodosPagamento.length) * 100);
});
</script>

<template>
	<div class="h-full flex flex-col">
		<!-- Skeleton de Loading -->
		<div v-if="loading" class="space-y-4">
			<UiSkeleton class="h-32 w-full" />
			<UiSkeleton class="h-24 w-full" />
		</div>

		<!-- Layout Principal: 2 Colunas -->
		<div v-else class="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-5 gap-4">
			<!-- COLUNA ESQUERDA: RESUMO (3/5) -->
			<div class="lg:col-span-3 flex min-h-0">
				<UiCard class="flex-1" fill-height no-padding size="lg">
					<template #header>
						<div class="flex items-center gap-2">
							<Icon
								name="lucide:credit-card"
								class="w-5 h-5 text-primary-600 dark:text-primary-400"
							/>
							<h3 class="text-sm font-semibold text-gray-900 dark:text-white">
								Visão Geral de Pagamentos
							</h3>
						</div>
					</template>

					<!-- Conteúdo com scroll -->
					<div class="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
						<!-- Status de Ativação -->
						<div
							class="flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50 shadow-sm border-none rounded-xl p-4 lg:p-5"
						>
							<div>
								<h4 class="font-semibold text-gray-900 dark:text-white text-sm">
									Métodos de Pagamento
								</h4>
								<p class="text-xs text-gray-500 mt-1">
									{{ metodosAtivosCount }} de {{ metodosPagamento.length }} métodos configurados
								</p>
							</div>
							<div class="flex items-center gap-3">
								<div class="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
									<div
										class="h-full bg-primary-600 transition-all duration-500"
										:style="{ width: `${percentualAtivacao}%` }"
									></div>
								</div>
								<span class="text-sm font-bold text-primary-600">{{ percentualAtivacao }}%</span>
							</div>
						</div>

						<!-- Grid de Métodos Ativos -->
						<div class="space-y-3">
							<h4
								class="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2 uppercase tracking-wider opacity-60"
							>
								<Icon name="lucide:check-circle-2" class="w-4 h-4 text-green-500" />
								Formas Aceitas
							</h4>

							<div
								v-if="listaMetodosAtivos.length > 0"
								class="grid grid-cols-1 md:grid-cols-2 gap-3"
							>
								<div
									v-for="metodo in listaMetodosAtivos"
									:key="metodo.key"
									class="flex items-center gap-3 bg-white dark:bg-gray-800/40 shadow-sm rounded-xl p-3 transition-all hover:shadow-md border-none"
								>
									<div
										class="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0"
									>
										<Icon
											:name="metodo.icon"
											class="w-5 h-5 text-primary-600 dark:text-primary-400"
										/>
									</div>
									<div class="min-w-0 flex-1">
										<p class="text-sm font-bold text-gray-800 dark:text-white">
											{{ metodo.label }}
										</p>
										<p class="text-[10px] text-gray-500 italic">Ativo no delivery</p>
									</div>
								</div>
							</div>

							<div
								v-else
								class="text-center py-8 bg-white dark:bg-gray-800/10 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl"
							>
								<Icon name="lucide:alert-circle" class="w-8 h-8 text-gray-400 mx-auto mb-2" />
								<p class="text-xs text-gray-500">Nenhum método de pagamento ativo.</p>
							</div>
						</div>

						<!-- Resumo do PIX -->
						<div v-if="values.aceita_pix" class="space-y-3 pt-6 border-none">
							<div class="flex items-center justify-between">
								<h4
									class="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2 uppercase tracking-wider opacity-60"
								>
									<Icon name="lucide:zap" class="w-4 h-4 text-amber-500" />
									Configuração PIX
								</h4>
								<span
									v-if="values.chave_pix"
									class="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-600 px-2 py-0.5 rounded-full font-bold uppercase"
									>Configurada</span
								>
							</div>

							<div class="bg-blue-50/50 dark:bg-blue-900/10 shadow-sm border-none rounded-xl p-4">
								<div class="flex items-center gap-4">
									<div
										class="w-12 h-12 bg-blue-100 dark:bg-blue-800/30 rounded-xl flex items-center justify-center text-blue-600"
									>
										<Icon :name="tipoChaveSelecionado.icon" class="w-6 h-6" />
									</div>
									<div class="flex-1 min-w-0">
										<p class="text-[10px] text-blue-500 font-bold uppercase tracking-wider mb-0.5">
											Chave {{ tipoChaveSelecionado.label }}
										</p>
										<p
											class="text-sm font-mono font-bold text-blue-900 dark:text-blue-100 truncate"
										>
											{{ values.chave_pix || "Não configurada" }}
										</p>
									</div>
								</div>
							</div>
						</div>

						<!-- Dicas de Operação -->
						<div class="space-y-4 pt-6 border-none">
							<div class="flex items-center gap-2">
								<Icon name="lucide:lightbulb" class="w-4 h-4 text-yellow-500" />
								<h4
									class="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider opacity-60"
								>
									Dicas para seu Delivery
								</h4>
							</div>

							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div
									class="bg-indigo-50/50 dark:bg-indigo-900/10 shadow-sm border-none rounded-xl p-4"
								>
									<p
										class="text-xs font-bold text-indigo-900 dark:text-indigo-200 mb-2 flex items-center gap-1.5"
									>
										<Icon name="lucide:trending-up" class="w-3.5 h-3.5" />
										Venda Mais
									</p>
									<p class="text-[11px] text-indigo-700/80 dark:text-indigo-300 leading-relaxed">
										Oferecer PIX e Cartão aumenta em até 40% a chance do cliente concluir o pedido
										na hora.
									</p>
								</div>

								<div
									class="bg-emerald-50/50 dark:bg-emerald-900/10 shadow-sm border-none rounded-xl p-4"
								>
									<p
										class="text-xs font-bold text-emerald-900 dark:text-emerald-200 mb-2 flex items-center gap-1.5"
									>
										<Icon name="lucide:shield-check" class="w-3.5 h-3.5" />
										Segurança
									</p>
									<p class="text-[11px] text-emerald-700/80 dark:text-emerald-300 leading-relaxed">
										Pagamentos digitais (PIX) reduzem a necessidade de troco e diminuem riscos
										operacionais.
									</p>
								</div>
							</div>
						</div>
					</div>
				</UiCard>
			</div>

			<!-- COLUNA DIREITA: EDITOR (2/5) -->
			<div class="lg:col-span-2 flex min-h-0">
				<UiCard class="flex-1" fill-height no-padding size="lg">
					<template #header>
						<div class="flex items-center gap-2">
							<Icon
								name="lucide:settings-2"
								class="w-5 h-5 text-primary-600 dark:text-primary-400"
							/>
							<h3 class="text-sm font-semibold text-gray-900 dark:text-white">
								Configurar Métodos
							</h3>
						</div>
					</template>

					<!-- Conteúdo com scroll -->
					<div class="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
						<div class="space-y-3">
							<div
								v-for="metodo in metodosPagamento"
								:key="metodo.key"
								class="bg-white dark:bg-gray-800/40 shadow-sm rounded-xl p-4 transition-all hover:shadow-md border-none"
							>
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-3">
										<div
											class="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300"
											:class="[
												values[metodo.key]
													? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
													: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
											]"
										>
											<Icon :name="metodo.icon" class="w-5 h-5" />
										</div>
										<div class="min-w-0">
											<h4 class="text-sm font-bold text-gray-800 dark:text-white">
												{{ metodo.label }}
											</h4>
											<p class="text-[10px] text-gray-500 italic">
												{{ metodo.description }}
											</p>
										</div>
									</div>
									<UiSwitch
										:model-value="values[metodo.key] || false"
										@update:model-value="(value: boolean) => updateMetodo(metodo.key, value)"
									/>
								</div>

								<!-- Configuração específica do PIX -->
								<div
									v-if="metodo.key === 'aceita_pix' && values.aceita_pix"
									class="mt-6 pt-0 space-y-6"
								>
									<UiFormField label="Tipo de Chave PIX" required>
										<div class="grid grid-cols-2 md:grid-cols-5 gap-2">
											<button
												v-for="tipo in tiposChavePix"
												:key="tipo.value"
												type="button"
												class="flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 shadow-sm border-none"
												:class="[
													values.tipo_chave_pix === tipo.value
														? 'bg-primary text-white shadow-lg shadow-primary/40 font-bold z-10 scale-105'
														: 'bg-white dark:bg-gray-800/20 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/40',
												]"
												@click="setFieldValue('tipo_chave_pix', tipo.value)"
											>
												<Icon :name="tipo.icon" class="w-5 h-5 mb-1.5" />
												<span class="text-[10px] uppercase tracking-wide">{{ tipo.label }}</span>
											</button>
										</div>
									</UiFormField>

									<UiFormField
										label="Chave PIX"
										required
										:error="chavePixError || errors.chave_pix"
									>
										<Field v-slot="{ field }" name="chave_pix">
											<UiInput
												:model-value="String(field.value || '')"
												:placeholder="tipoChaveSelecionado.placeholder"
												:maxlength="tipoChaveSelecionado.maxLength"
												size="md"
												@update:model-value="handleChavePixChange"
											>
												<template v-if="chavePixIcon" #iconRight>
													<Icon :name="chavePixIcon" :class="['w-4 h-4', chavePixIconColor]" />
												</template>
											</UiInput>
										</Field>
									</UiFormField>
								</div>
							</div>
						</div>

						<!-- Aviso de Validação -->
						<div
							v-if="!temMetodoAtivo"
							class="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3 shadow-sm"
						>
							<Icon name="lucide:alert-circle" class="w-5 h-5 text-red-600" />
							<p class="text-xs text-red-700 dark:text-red-300 font-medium">
								Selecione ao menos um método para continuar.
							</p>
						</div>
					</div>

					<!-- Botão de Salvar -->
					<template #footer>
						<div class="p-0">
							<UiButton
								:loading="saving"
								:disabled="!hasChanges || saving || !temMetodoAtivo"
								class="w-full"
								size="lg"
								@click="onSubmit"
							>
								<template #iconLeft>
									<Icon name="lucide:save" class="w-4 h-4" />
								</template>
								{{ saving ? "Salvando..." : "Salvar Configurações" }}
							</UiButton>
						</div>
					</template>
				</UiCard>
			</div>
		</div>
	</div>
</template>

<style scoped>
/* Transições suaves */
.transition-all {
	transition-property: all;
	transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
	transition-duration: 300ms;
}
</style>
