<script setup lang="ts">
/**
 * 📌 FreteEntregaTab
 *
 * Tab de configuração de frete e entrega (Admin + Gerente).
 * Layout padronizado com o sistema (2 Colunas, UiCards Padrão).
 */

import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { freteEntregaSchema } from "#shared/schemas/configuracoes";
import { useFreteEntrega, type ConfigFreteEntrega } from "../../composables/useFreteEntrega";
import type { TipoTaxaEntrega } from "#shared/types/estabelecimentos";
import { useToast } from "~/composables/ui/useToast";

// Composable de frete e entrega
const { configuracoes, loading, saving, salvarConfiguracoes } = useFreteEntrega();
const { success } = useToast();

// Schema de validação
const validationSchema = toTypedSchema(freteEntregaSchema);

// Formulário com vee-validate
const { values, setFieldValue, resetForm } = useForm({
	validationSchema,
	keepValuesOnUnmount: true,
});

// Estados para controle de salvamento
const hasUnsavedChanges = ref(false);
const isInitializing = ref(true); // Flag para evitar detecção de mudanças durante inicialização

// Armazenar valores iniciais para comparação
const valoresIniciais = ref<ConfigFreteEntrega | null>(null);

// Estados para gerenciamento de cidades
const novaCidade = ref("");
const cidadesAtendidas = ref<string[]>([]);

// Validar se modalidade pode ser salva
const canSaveModality = (modality: TipoTaxaEntrega): boolean => {
	switch (modality) {
		case "sem_taxa":
			return true; // Sempre pode
		case "taxa_unica":
			return (values.taxa_entrega || 0) > 0; // Precisa ter taxa
		case "taxa_localizacao":
			return (values.taxas_por_localizacao || []).filter((t) => t.status === "ativado").length > 0; // Precisa ter bairros ativos
		default:
			return false;
	}
};

// Salvar configurações manualmente - SALVAR APENAS CAMPOS MODIFICADOS
const salvarManual = async () => {
	if (!configuracoes.value || !valoresIniciais.value) return;

	// Validar cidades atendidas (obrigatório)
	if (!cidadesAtendidas.value.length) {
		return;
	}

	// Validar modalidade atual
	const modalityValid = canSaveModality(values.tipo_taxa_entrega as TipoTaxaEntrega);
	if (!modalityValid) return;

	// Validações gerais mais flexíveis
	const isValid =
		(values.taxa_entrega || 0) >= 0 &&
		(values.tempo_entrega_min || 0) > 0 &&
		(values.tempo_entrega_max || 0) > 0 &&
		(values.tempo_entrega_max || 0) >= (values.tempo_entrega_min || 0) &&
		(values.valor_minimo_pedido || 0) >= 0;

	if (!isValid) return;

	// Comparar valores atuais com iniciais e enviar apenas os modificados
	const camposModificados: Partial<ConfigFreteEntrega> = {};

	// Verificar cada campo individualmente
	if (values.tipo_taxa_entrega !== valoresIniciais.value.tipo_taxa_entrega) {
		camposModificados.tipo_taxa_entrega = values.tipo_taxa_entrega;
	}

	if (values.taxa_entrega !== valoresIniciais.value.taxa_entrega) {
		camposModificados.taxa_entrega = values.taxa_entrega;
	}

	// Comparar arrays de cidades (usando JSON.stringify para comparação profunda)
	if (
		JSON.stringify(cidadesAtendidas.value) !==
		JSON.stringify(valoresIniciais.value.cidades_atendidas)
	) {
		camposModificados.cidades_atendidas = cidadesAtendidas.value;
	}

	if (values.tempo_entrega_min !== valoresIniciais.value.tempo_entrega_min) {
		camposModificados.tempo_entrega_min = values.tempo_entrega_min;
	}

	if (values.tempo_entrega_max !== valoresIniciais.value.tempo_entrega_max) {
		camposModificados.tempo_entrega_max = values.tempo_entrega_max;
	}

	if (values.valor_minimo_pedido !== valoresIniciais.value.valor_minimo_pedido) {
		camposModificados.valor_minimo_pedido = values.valor_minimo_pedido;
	}

	// Comparar arrays de taxas por localização
	if (
		JSON.stringify(values.taxas_por_localizacao) !==
		JSON.stringify(valoresIniciais.value.taxas_por_localizacao)
	) {
		camposModificados.taxas_por_localizacao = values.taxas_por_localizacao;
	}

	if (values.taxa_padrao_outros_bairros !== valoresIniciais.value.taxa_padrao_outros_bairros) {
		camposModificados.taxa_padrao_outros_bairros = values.taxa_padrao_outros_bairros;
	}

	// Se nenhum campo foi modificado, não fazer nada
	if (Object.keys(camposModificados).length === 0) {
		success({
			title: "Nenhuma alteração",
			description: "Não há alterações para salvar",
		});
		return;
	}

	// Salvar apenas os campos modificados
	const sucesso = await salvarConfiguracoes(camposModificados);

	// Se salvou com sucesso, atualizar valores iniciais
	if (sucesso) {
		valoresIniciais.value = {
			tipo_taxa_entrega: values.tipo_taxa_entrega || "taxa_unica",
			taxa_entrega: values.taxa_entrega || 0,
			cidades_atendidas: [...cidadesAtendidas.value],
			tempo_entrega_min: values.tempo_entrega_min || 30,
			tempo_entrega_max: values.tempo_entrega_max || 60,
			valor_minimo_pedido: values.valor_minimo_pedido || 0,
			taxas_por_localizacao: values.taxas_por_localizacao ? [...values.taxas_por_localizacao] : [],
			taxa_padrao_outros_bairros: values.taxa_padrao_outros_bairros || 0,
		};
		hasUnsavedChanges.value = false;
	}
};

// Watch para detectar mudanças (sem auto-save)
watch(
	[
		() => values.tipo_taxa_entrega,
		() => values.taxa_entrega,
		() => values.tempo_entrega_min,
		() => values.tempo_entrega_max,
		() => values.valor_minimo_pedido,
		() => values.taxas_por_localizacao,
		() => values.taxa_padrao_outros_bairros,
		() => cidadesAtendidas.value,
	],
	() => {
		if (!isInitializing.value) {
			hasUnsavedChanges.value = true;
		}
	},
	{ deep: true },
);

// Watch para atualizar valores quando dados carregarem
watch(
	configuracoes,
	(newConfig) => {
		if (newConfig) {
			// Armazenar valores iniciais para comparação posterior
			valoresIniciais.value = {
				tipo_taxa_entrega: newConfig.tipo_taxa_entrega || "taxa_unica",
				taxa_entrega: newConfig.taxa_entrega,
				cidades_atendidas: [...(newConfig.cidades_atendidas || [])],
				tempo_entrega_min: newConfig.tempo_entrega_min,
				tempo_entrega_max: newConfig.tempo_entrega_max,
				valor_minimo_pedido: newConfig.valor_minimo_pedido,
				taxas_por_localizacao: newConfig.taxas_por_localizacao
					? [...newConfig.taxas_por_localizacao]
					: [],
				taxa_padrao_outros_bairros: newConfig.taxa_padrao_outros_bairros || 0,
			};

			// Atualizar cidades atendidas
			cidadesAtendidas.value = newConfig.cidades_atendidas || [];

			resetForm({
				values: {
					taxa_entrega: newConfig.taxa_entrega,
					tipo_taxa_entrega: newConfig.tipo_taxa_entrega || "taxa_unica",
					cidades_atendidas: newConfig.cidades_atendidas || [],
					taxas_por_localizacao: newConfig.taxas_por_localizacao || [],
					taxa_padrao_outros_bairros: newConfig.taxa_padrao_outros_bairros || 0,
					tempo_entrega_min: newConfig.tempo_entrega_min,
					tempo_entrega_max: newConfig.tempo_entrega_max,
					valor_minimo_pedido: newConfig.valor_minimo_pedido,
				},
			});

			// Finalizar inicialização após carregar dados
			nextTick(() => {
				isInitializing.value = false;
				hasUnsavedChanges.value = false;
			});
		}
	},
	{ immediate: true },
);

// Opções de modalidade (SEM taxa_distancia)
const tiposTaxaEntrega = [
	{ value: "sem_taxa", label: "Sem Taxa", icon: "lucide:circle-slash" },
	{ value: "taxa_unica", label: "Taxa Única", icon: "lucide:dollar-sign" },
	{ value: "taxa_localizacao", label: "Taxa por Bairro", icon: "lucide:navigation-2" },
] as const;

// Estado local para adições
const novaRegra = ref({
	localizacao: {
		nome: "",
		cidade: "",
		taxa_valor: 0,
		tempo_min: 30,
		tempo_max: 60,
	},
});

// Watch para atualizar tempo_min e tempo_max com valores globais
watch(
	[() => values.tempo_entrega_min, () => values.tempo_entrega_max],
	([min, max]) => {
		// Atualizar apenas se os campos estão vazios (valores padrão)
		if (novaRegra.value.localizacao.tempo_min === 30 && min) {
			novaRegra.value.localizacao.tempo_min = min;
		}
		if (novaRegra.value.localizacao.tempo_max === 60 && max) {
			novaRegra.value.localizacao.tempo_max = max;
		}
	},
	{ immediate: true },
);

const gerarId = () => Math.random().toString(36).substring(2, 11);

// Ações de Cidades
const adicionarCidade = () => {
	const cidade = novaCidade.value.trim();
	if (!cidade) return;
	if (cidadesAtendidas.value.includes(cidade)) {
		return; // Cidade já existe
	}
	cidadesAtendidas.value.push(cidade);
	setFieldValue("cidades_atendidas", cidadesAtendidas.value);
	novaCidade.value = "";
	hasUnsavedChanges.value = true;
};

const removerCidade = (cidade: string) => {
	cidadesAtendidas.value = cidadesAtendidas.value.filter((c) => c !== cidade);
	setFieldValue("cidades_atendidas", cidadesAtendidas.value);
	hasUnsavedChanges.value = true;
};

// Ações de Localização (apenas atualiza estado local)
const adicionarTaxaLocalizacao = () => {
	if (!novaRegra.value.localizacao.nome || !novaRegra.value.localizacao.cidade) return;
	const novas = [
		...(values.taxas_por_localizacao || []),
		{
			id: gerarId(),
			nome: novaRegra.value.localizacao.nome,
			cidade: novaRegra.value.localizacao.cidade,
			taxa_valor: novaRegra.value.localizacao.taxa_valor,
			tempo_min: novaRegra.value.localizacao.tempo_min,
			tempo_max: novaRegra.value.localizacao.tempo_max,
			status: "ativado" as const,
		},
	];
	setFieldValue("taxas_por_localizacao", novas);
	// Resetar com valores globais atuais
	novaRegra.value.localizacao = {
		nome: "",
		cidade: "",
		taxa_valor: 0,
		tempo_min: values.tempo_entrega_min || 30,
		tempo_max: values.tempo_entrega_max || 60,
	};
	hasUnsavedChanges.value = true;
};

const removerTaxaLocalizacao = (id: string) => {
	const novas = (values.taxas_por_localizacao || []).filter((t) => t.id !== id);
	setFieldValue("taxas_por_localizacao", novas);
	hasUnsavedChanges.value = true;
};

const toggleStatusLocalizacao = (id: string) => {
	const novas = (values.taxas_por_localizacao || []).map((t) =>
		t.id === id
			? {
					...t,
					status: (t.status === "ativado" ? "desativado" : "ativado") as "ativado" | "desativado",
				}
			: t,
	);
	setFieldValue("taxas_por_localizacao", novas);
	hasUnsavedChanges.value = true;
};

// Computeds para feedback visual
const modalityStatus = computed(() => {
	const modality = values.tipo_taxa_entrega;
	const isValid = canSaveModality(modality as TipoTaxaEntrega);

	if (!isValid) {
		switch (modality) {
			case "taxa_unica":
				return {
					status: "warning",
					message: "Configure o valor da taxa para salvar",
				};
			case "taxa_localizacao":
				return {
					status: "warning",
					message: "Adicione pelo menos um bairro/região ativo",
				};
			default:
				return { status: "warning", message: "Configuração incompleta" };
		}
	}

	if (hasUnsavedChanges.value) {
		return { status: "warning", message: "Alterações não salvas" };
	}

	return { status: "success", message: "Configuração salva" };
});

const formatCurrency = (v: number) =>
	new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const tipoTaxaLabel = computed(
	() => tiposTaxaEntrega.find((t) => t.value === values.tipo_taxa_entrega)?.label || "",
);
</script>

<template>
	<div class="h-full flex flex-col">
		<div v-if="loading" class="grid grid-cols-1 lg:grid-cols-6 gap-4">
			<UiSkeleton class="lg:col-span-2 h-64" />
			<UiSkeleton class="lg:col-span-4 h-64" />
		</div>

		<div v-else class="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-6 gap-4">
			<!-- COLUNA ESQUERDA: RESUMO -->
			<div class="lg:col-span-2 flex min-h-0">
				<UiCard class="flex-1" fill-height no-padding size="lg">
					<template #header>
						<div class="flex items-center gap-2">
							<Icon name="lucide:truck" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
							<h3 class="text-sm font-semibold text-gray-900 dark:text-white">Resumo Logístico</h3>
						</div>
					</template>

					<div class="flex-1 min-h-0 overflow-y-auto p-5 space-y-6">
						<!-- Status Cards -->
						<div class="grid grid-cols-2 gap-4">
							<div
								class="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-700/50"
							>
								<p class="text-[10px] uppercase font-bold text-gray-500 mb-1">Modalidade</p>
								<span class="text-sm font-bold text-gray-900 dark:text-white">{{
									tipoTaxaLabel
								}}</span>
							</div>
							<div
								class="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-700/50"
							>
								<p class="text-[10px] uppercase font-bold text-gray-500 mb-1">Cidades</p>
								<span class="text-sm font-bold text-gray-900 dark:text-white">
									{{ cidadesAtendidas.length }}
									{{ cidadesAtendidas.length === 1 ? "cidade" : "cidades" }}
								</span>
							</div>
						</div>

						<!-- Detalhes -->
						<div class="space-y-3">
							<div
								class="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700/50"
							>
								<span class="text-xs text-gray-500">Ticket Mínimo</span>
								<span class="text-xs font-bold">{{
									formatCurrency(values.valor_minimo_pedido || 0)
								}}</span>
							</div>
							<div
								class="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700/50"
							>
								<span class="text-xs text-gray-500">Tempo Estimado</span>
								<span class="text-xs font-bold"
									>{{ values.tempo_entrega_min }}-{{ values.tempo_entrega_max }} min</span
								>
							</div>
							<div
								class="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700/50"
							>
								<span class="text-xs text-gray-500">Agendamento</span>
								<div class="flex items-center gap-2">
									<div class="w-2 h-2 rounded-full bg-green-500"></div>
									<span class="text-xs font-bold text-green-600">Sempre Ativo</span>
								</div>
							</div>
						</div>

						<!-- Lista de Taxas Configuradas -->
						<div v-if="values.tipo_taxa_entrega === 'taxa_localizacao'" class="space-y-4">
							<!-- Header com ícone e contador -->
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<Icon name="lucide:map-pin" class="w-3 h-3 text-primary-500" />
									<h4 class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
										Bairros Ativos
									</h4>
								</div>
								<span
									class="text-[9px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full"
								>
									{{
										values.taxas_por_localizacao?.filter((l) => l.status === "ativado").length || 0
									}}
								</span>
							</div>

							<!-- Lista de taxas agrupadas por cidade -->
							<div class="space-y-3">
								<template v-for="cidade in cidadesAtendidas" :key="cidade">
									<div
										v-if="
											values.taxas_por_localizacao?.some(
												(l) => l.cidade === cidade && l.status === 'ativado',
											)
										"
										class="space-y-1"
									>
										<!-- Nome da cidade -->
										<p class="text-[9px] font-bold text-gray-400 uppercase tracking-wider px-2">
											{{ cidade }}
										</p>
										<!-- Bairros da cidade -->
										<div
											v-for="loc in values.taxas_por_localizacao
												?.filter((l) => l.cidade === cidade && l.status === 'ativado')
												.slice(0, 3)"
											:key="loc.id"
											class="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-100 dark:border-gray-700/30"
										>
											<div class="flex items-center gap-2">
												<div class="w-2 h-2 bg-green-500 rounded-full"></div>
												<span
													class="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize"
													>{{ loc.nome }}</span
												>
											</div>
											<span class="text-xs font-bold text-primary-600 dark:text-primary-400">{{
												formatCurrency(loc.taxa_valor)
											}}</span>
										</div>
										<!-- Indicador de mais itens -->
										<div
											v-if="
												values.taxas_por_localizacao?.filter(
													(l) => l.cidade === cidade && l.status === 'ativado',
												).length > 3
											"
											class="flex items-center justify-center py-1 text-center"
										>
											<span class="text-[10px] text-gray-400 font-medium">
												+{{
													values.taxas_por_localizacao?.filter(
														(l) => l.cidade === cidade && l.status === "ativado",
													).length - 3
												}}
												mais
											</span>
										</div>
									</div>
								</template>

								<!-- Estado vazio -->
								<div
									v-if="
										values.tipo_taxa_entrega === 'taxa_localizacao' &&
										(values.taxas_por_localizacao?.filter((l) => l.status === 'ativado').length ||
											0) === 0
									"
									class="flex items-center justify-center py-4 text-center"
								>
									<div class="flex flex-col items-center gap-1">
										<Icon name="lucide:plus-circle" class="w-4 h-4 text-gray-300" />
										<span class="text-[10px] text-gray-400">Nenhum bairro configurado</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					<template #footer>
						<div class="p-4 flex items-center justify-center gap-2">
							<Icon
								v-if="saving"
								name="lucide:loader-2"
								class="w-4 h-4 text-primary animate-spin"
							/>
							<Icon
								v-else-if="modalityStatus.status === 'warning'"
								name="lucide:alert-triangle"
								class="w-4 h-4 text-amber-500"
							/>
							<Icon v-else name="lucide:check-circle-2" class="w-4 h-4 text-green-500" />
							<span
								class="text-[10px] font-bold uppercase tracking-widest"
								:class="[
									saving
										? 'text-gray-500'
										: modalityStatus.status === 'warning'
											? 'text-amber-600'
											: 'text-gray-500',
								]"
							>
								{{ saving ? "Sincronizando..." : modalityStatus.message }}
							</span>
						</div>
					</template>
				</UiCard>
			</div>

			<!-- COLUNA DIREITA: EDITOR -->
			<div class="lg:col-span-4 flex min-h-0">
				<UiCard class="flex-1" fill-height no-padding size="lg">
					<template #header>
						<div class="flex items-center gap-2">
							<Icon
								name="lucide:settings-2"
								class="w-5 h-5 text-primary-600 dark:text-primary-400"
							/>
							<h3 class="text-sm font-semibold text-gray-900 dark:text-white">
								Configuração do Delivery
							</h3>
						</div>
					</template>

					<div class="flex-1 min-h-0 overflow-y-auto p-6 space-y-8">
						<!-- Área de Cobertura (SEMPRE VISÍVEL) -->
						<div class="space-y-4">
							<div
								class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700"
							>
								<Icon
									name="lucide:map-pin"
									class="w-5 h-5 text-primary-600 dark:text-primary-400"
								/>
								<h4
									class="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest"
								>
									Área de Cobertura
								</h4>
							</div>

							<!-- Alerta se não tem cidades -->
							<div
								v-if="!cidadesAtendidas.length"
								class="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
							>
								<div class="flex items-center gap-2">
									<Icon name="lucide:alert-triangle" class="w-4 h-4 text-amber-600" />
									<span class="text-sm font-medium text-amber-800 dark:text-amber-200">
										Adicione pelo menos 1 cidade para ativar o sistema de entregas
									</span>
								</div>
							</div>

							<!-- Input para adicionar cidade -->
							<div class="flex gap-2">
								<UiInput
									v-model="novaCidade"
									placeholder="Digite o nome da cidade"
									class="flex-1"
									@keyup.enter="adicionarCidade"
								/>
								<UiButton
									type="button"
									variant="solid"
									class="bg-primary text-white"
									@click="adicionarCidade"
								>
									<Icon name="lucide:plus" class="w-4 h-4 mr-2" />
									Adicionar
								</UiButton>
							</div>

							<p class="text-xs text-gray-500">💡 Adicione as cidades onde você faz entregas</p>

							<!-- Lista de cidades -->
							<div v-if="cidadesAtendidas.length" class="space-y-2">
								<div
									v-for="cidade in cidadesAtendidas"
									:key="cidade"
									class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-100 dark:border-gray-700/50"
								>
									<div class="flex items-center gap-2">
										<Icon name="lucide:map-pin" class="w-4 h-4 text-primary-500" />
										<span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{
											cidade
										}}</span>
									</div>
									<button
										type="button"
										class="text-gray-400 hover:text-red-500 transition-colors"
										@click="removerCidade(cidade)"
									>
										<Icon name="lucide:trash-2" class="w-4 h-4" />
									</button>
								</div>
							</div>
						</div>

						<!-- Parâmetros Gerais (SEMPRE VISÍVEL) -->
						<div class="space-y-4">
							<div
								class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700"
							>
								<Icon name="lucide:clock" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
								<h4
									class="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest"
								>
									Parâmetros Gerais
								</h4>
							</div>

							<!-- Card Info - Tempo de Entrega Padrão -->
							<div
								class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
							>
								<div class="flex items-start gap-3">
									<Icon name="lucide:info" class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
									<div class="flex-1">
										<h5 class="text-sm font-bold text-blue-900 dark:text-blue-200 mb-1">
											Tempo de Entrega Padrão
										</h5>
										<p class="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
											Este é o tempo exibido para todos os clientes no cardápio. Considere o tempo
											de preparo + deslocamento. No modo "Taxa por Bairro", você pode personalizar
											por região.
										</p>
									</div>
								</div>
							</div>

							<!-- Inputs de Tempo Global -->
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<UiFormField label="Tempo Mínimo (minutos)" required>
									<UiInput
										:model-value="values.tempo_entrega_min"
										type="number"
										placeholder="30"
										min="10"
										max="180"
										@update:model-value="(v) => setFieldValue('tempo_entrega_min', Number(v))"
									/>
									<p class="text-xs text-gray-500 mt-1">Tempo mínimo de entrega</p>
								</UiFormField>

								<UiFormField label="Tempo Máximo (minutos)" required>
									<UiInput
										:model-value="values.tempo_entrega_max"
										type="number"
										placeholder="60"
										min="10"
										max="180"
										@update:model-value="(v) => setFieldValue('tempo_entrega_max', Number(v))"
									/>
									<p class="text-xs text-gray-500 mt-1">Tempo máximo de entrega</p>
								</UiFormField>
							</div>
						</div>

						<!-- Modalidade -->
						<div class="space-y-4">
							<label class="text-xs font-bold text-gray-700 dark:text-gray-300"
								>Como deseja cobrar a entrega?</label
							>
							<div class="flex flex-wrap gap-2">
								<button
									v-for="tipo in tiposTaxaEntrega"
									:key="tipo.value"
									type="button"
									class="flex-1 min-w-[100px] flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left relative"
									:class="[
										values.tipo_taxa_entrega === tipo.value
											? 'border-primary bg-primary/10 dark:bg-primary/5 shadow-md'
											: 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600',
									]"
									@click="setFieldValue('tipo_taxa_entrega', tipo.value)"
								>
									<!-- Radio Button Visual -->
									<div class="flex items-center">
										<div
											:class="[
												'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all',
												values.tipo_taxa_entrega === tipo.value
													? 'border-primary bg-primary'
													: 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800',
											]"
										>
											<div
												v-if="values.tipo_taxa_entrega === tipo.value"
												class="w-1.5 h-1.5 bg-white rounded-full"
											></div>
										</div>
									</div>
									<span
										:class="[
											'text-xs font-bold uppercase tracking-tight',
											values.tipo_taxa_entrega === tipo.value
												? 'text-primary'
												: 'text-gray-700 dark:text-gray-300',
										]"
									>
										{{ tipo.label }}
									</span>
								</button>
							</div>
						</div>

						<!-- Editor Dinâmico -->
						<div
							class="p-6 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-700/50"
						>
							<!-- SEM TAXA -->
							<div v-if="values.tipo_taxa_entrega === 'sem_taxa'" class="space-y-4">
								<!-- Header ultra-compacto -->
								<div class="flex items-center gap-3">
									<Icon name="lucide:smile" class="w-5 h-5 text-primary-500" />
									<div>
										<p class="text-sm font-bold text-gray-900 dark:text-white">Entrega Grátis</p>
										<p class="text-xs text-gray-500">Nenhuma taxa de entrega será aplicada.</p>
									</div>
								</div>

								<!-- Configurações básicas para entrega grátis -->
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<UiFormField label="Pedido Mínimo (R$)">
										<UiCurrencyInput
											:model-value="values.valor_minimo_pedido"
											placeholder="0,00"
											@update:model-value="(v) => setFieldValue('valor_minimo_pedido', v)"
										/>
										<div class="mt-2 space-y-1">
											<p class="text-xs text-gray-500 leading-relaxed">
												Valor mínimo que o cliente deve gastar para fazer um pedido.
												<span class="font-medium text-gray-600"
													>Deixe em zero se não quiser exigir valor mínimo.</span
												>
											</p>
											<div
												v-if="(values.valor_minimo_pedido || 0) === 0"
												class="flex items-center gap-2 text-xs text-green-600"
											>
												<div class="flex items-center">
													<div
														class="w-8 h-4 bg-green-500 rounded-full flex items-center justify-end px-0.5"
													>
														<div class="w-3 h-3 bg-white rounded-full shadow-sm"></div>
													</div>
												</div>
												<span class="font-medium">Sem valor mínimo - aceita qualquer pedido</span>
											</div>
										</div>
									</UiFormField>
								</div>

								<!-- Botão Salvar -->
								<div class="flex justify-end">
									<UiButton
										:disabled="!hasUnsavedChanges || saving"
										:loading="saving"
										variant="solid"
										class="bg-primary text-white"
										@click="salvarManual"
									>
										<Icon v-if="!saving" name="lucide:save" class="w-4 h-4 mr-2" />
										{{ saving ? "Salvando..." : "Salvar Configurações" }}
									</UiButton>
								</div>
							</div>

							<!-- TAXA ÚNICA -->
							<div
								v-else-if="values.tipo_taxa_entrega === 'taxa_unica'"
								class="grid grid-cols-1 md:grid-cols-3 gap-6"
							>
								<UiFormField
									label="Valor Fixo"
									:error="
										!canSaveModality('taxa_unica') &&
										(!values.taxa_entrega || values.taxa_entrega <= 0)
											? 'Valor obrigatório'
											: ''
									"
								>
									<UiCurrencyInput
										:model-value="values.taxa_entrega"
										placeholder="5,00"
										:error="
											!canSaveModality('taxa_unica') &&
											(!values.taxa_entrega || values.taxa_entrega <= 0)
										"
										@update:model-value="(v) => setFieldValue('taxa_entrega', v)"
									/>
									<div class="mt-2 space-y-1">
										<p class="text-xs text-gray-500 leading-relaxed">
											Taxa fixa cobrada em todos os pedidos.
										</p>
									</div>
								</UiFormField>
								<UiFormField label="Pedido Mínimo (R$)">
									<UiCurrencyInput
										:model-value="values.valor_minimo_pedido"
										placeholder="0,00"
										@update:model-value="(v) => setFieldValue('valor_minimo_pedido', v)"
									/>
									<div class="mt-2 space-y-1">
										<p class="text-xs text-gray-500 leading-relaxed">
											<span class="font-medium text-gray-600"
												>Deixe em zero se não quiser exigir valor mínimo.</span
											>
										</p>
										<div
											v-if="(values.valor_minimo_pedido || 0) === 0"
											class="flex items-center gap-1 text-xs text-green-600"
										>
											<Icon name="lucide:check-circle-2" class="w-3 h-3" />
											<span class="font-medium">Sem valor mínimo</span>
										</div>
									</div>
								</UiFormField>

								<!-- Botão Salvar -->
								<div class="md:col-span-3 flex justify-end">
									<UiButton
										:disabled="!hasUnsavedChanges || saving"
										:loading="saving"
										variant="solid"
										class="bg-primary text-white"
										@click="salvarManual"
									>
										<Icon v-if="!saving" name="lucide:save" class="w-4 h-4 mr-2" />
										{{ saving ? "Salvando..." : "Salvar Configurações" }}
									</UiButton>
								</div>
							</div>

							<!-- TAXA POR LOCALIZAÇÃO -->
							<div v-else-if="values.tipo_taxa_entrega === 'taxa_localizacao'" class="space-y-6">
								<!-- Card Info - Tempo Personalizado por Bairro -->
								<div
									class="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
								>
									<div class="flex items-start gap-3">
										<Icon
											name="lucide:lightbulb"
											class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
										/>
										<div class="flex-1">
											<h5 class="text-sm font-bold text-amber-900 dark:text-amber-200 mb-1">
												Tempo Personalizado por Bairro
											</h5>
											<p class="text-xs text-amber-700 dark:text-amber-300 leading-relaxed mb-2">
												Defina tempos específicos para cada região. Clientes verão automaticamente o
												tempo correto baseado no bairro deles. O tempo padrão é usado quando não há
												configuração específica.
											</p>
											<p class="text-xs text-amber-600 dark:text-amber-400 font-medium">
												💡 Dica: Bairros próximos = menos tempo | Bairros distantes = mais tempo
											</p>
										</div>
									</div>
								</div>

								<!-- Alerta se não tem bairros -->
								<div
									v-if="
										!canSaveModality('taxa_localizacao') &&
										(!values.taxas_por_localizacao ||
											values.taxas_por_localizacao.filter((t) => t.status === 'ativado').length ===
												0)
									"
									class="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
								>
									<div class="flex items-center gap-2">
										<Icon name="lucide:alert-triangle" class="w-4 h-4 text-amber-600" />
										<span class="text-sm font-medium text-amber-800 dark:text-amber-200">
											Adicione pelo menos um bairro/região ativo para ativar esta modalidade
										</span>
									</div>
								</div>

								<!-- Configuração básica -->
								<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
									<UiFormField label="Pedido Mínimo (R$)">
										<UiCurrencyInput
											:model-value="values.valor_minimo_pedido"
											placeholder="0,00"
											@update:model-value="(v) => setFieldValue('valor_minimo_pedido', v)"
										/>
										<div class="mt-2 space-y-1">
											<p class="text-xs text-gray-500 leading-relaxed">
												Valor mínimo que o cliente deve gastar para fazer um pedido.
												<span class="font-medium text-gray-600"
													>Deixe em zero se não quiser exigir valor mínimo.</span
												>
											</p>
											<div
												v-if="(values.valor_minimo_pedido || 0) === 0"
												class="flex items-center gap-1 text-xs text-green-600"
											>
												<Icon name="lucide:check-circle-2" class="w-3 h-3" />
												<span class="font-medium">Sem valor mínimo - aceita qualquer pedido</span>
											</div>
										</div>
									</UiFormField>

									<UiFormField label="Taxa Padrão (Outros Bairros)">
										<UiCurrencyInput
											:model-value="values.taxa_padrao_outros_bairros"
											placeholder="0,00"
											@update:model-value="(v) => setFieldValue('taxa_padrao_outros_bairros', v)"
										/>
										<div class="mt-2 space-y-1">
											<p class="text-xs text-gray-500 leading-relaxed">
												Taxa aplicada para bairros não cadastrados na lista.
												<span class="font-medium text-gray-600"
													>Deixe em zero para bloquear entregas fora da lista.</span
												>
											</p>
										</div>
									</UiFormField>
								</div>

								<div class="flex gap-2 items-end flex-wrap">
									<div class="w-40 flex-shrink-0">
										<UiFormField label="Cidade">
											<UiSelectMenu
												v-model="novaRegra.localizacao.cidade"
												:options="
													cidadesAtendidas.map((c) => ({
														value: c,
														label: c,
													}))
												"
												placeholder="Selecione"
												:disabled="!cidadesAtendidas.length"
											/>
										</UiFormField>
									</div>
									<div class="flex-1 min-w-[120px]">
										<UiFormField label="Bairro / Região">
											<UiInput v-model="novaRegra.localizacao.nome" placeholder="Ex: Centro" />
										</UiFormField>
									</div>
									<div class="w-28 flex-shrink-0">
										<UiFormField label="Taxa">
											<UiCurrencyInput
												:model-value="novaRegra.localizacao.taxa_valor"
												placeholder="5,00"
												@update:model-value="(v) => (novaRegra.localizacao.taxa_valor = v)"
											/>
										</UiFormField>
									</div>
									<div class="w-16 flex-shrink-0">
										<UiFormField label="Tempo Mínimo">
											<UiInput
												:model-value="novaRegra.localizacao.tempo_min"
												type="number"
												min="10"
												max="180"
												placeholder="30"
												@update:model-value="(v) => (novaRegra.localizacao.tempo_min = Number(v))"
											/>
										</UiFormField>
									</div>
									<div class="w-16 flex-shrink-0">
										<UiFormField label="Tempo Máximo">
											<UiInput
												:model-value="novaRegra.localizacao.tempo_max"
												type="number"
												min="10"
												max="180"
												placeholder="60"
												@update:model-value="(v) => (novaRegra.localizacao.tempo_max = Number(v))"
											/>
										</UiFormField>
									</div>
									<div class="flex-shrink-0">
										<UiButton
											variant="solid"
											class="h-10 w-10 rounded-lg bg-gray-900 dark:bg-primary text-white flex items-center justify-center"
											:disabled="!novaRegra.localizacao.cidade || !novaRegra.localizacao.nome"
											@click="adicionarTaxaLocalizacao"
										>
											<Icon name="lucide:plus" class="w-4 h-4" />
										</UiButton>
									</div>
								</div>

								<div class="border rounded-lg overflow-hidden bg-white dark:bg-gray-800">
									<table class="w-full text-left text-xs">
										<thead
											class="bg-gray-50 dark:bg-gray-700/50 text-gray-500 font-bold uppercase tracking-widest text-[10px]"
										>
											<tr>
												<th class="px-4 py-2">Bairro / Região</th>
												<th class="px-4 py-2">Cidade</th>
												<th class="px-4 py-2">Taxa</th>
												<th class="px-4 py-2 text-center">Tempo</th>
												<th class="px-4 py-2 text-center">Status</th>
												<th class="px-4 py-2 text-right"></th>
											</tr>
										</thead>
										<tbody class="divide-y">
											<tr v-for="t in values.taxas_por_localizacao" :key="t.id">
												<td class="px-4 py-3 font-bold uppercase truncate max-w-[150px]">
													{{ t.nome }}
												</td>
												<td class="px-4 py-3 text-gray-600 dark:text-gray-300">
													{{ t.cidade }}
												</td>
												<td class="px-4 py-3 font-bold text-primary-600">
													{{ formatCurrency(t.taxa_valor) }}
												</td>
												<td class="px-4 py-3 text-center text-gray-600 dark:text-gray-300">
													{{ t.tempo_min }}-{{ t.tempo_max }}min
												</td>
												<td class="px-4 py-3 text-center">
													<button
														type="button"
														:class="[
															'px-2 py-0.5 rounded font-bold uppercase text-[9px]',
															t.status === 'ativado'
																? 'bg-green-100 text-green-600'
																: 'bg-red-100 text-red-600',
														]"
														@click="toggleStatusLocalizacao(t.id)"
													>
														{{ t.status === "ativado" ? "On" : "Off" }}
													</button>
												</td>
												<td class="px-4 py-3 text-right">
													<button
														type="button"
														class="text-gray-400 hover:text-red-500"
														@click="removerTaxaLocalizacao(t.id)"
													>
														<Icon name="lucide:trash-2" class="w-4 h-4" />
													</button>
												</td>
											</tr>
										</tbody>
									</table>
								</div>

								<!-- Botão Salvar -->
								<div class="flex justify-end">
									<UiButton
										:disabled="!hasUnsavedChanges || saving"
										:loading="saving"
										variant="solid"
										class="bg-primary text-white"
										@click="salvarManual"
									>
										<Icon v-if="!saving" name="lucide:save" class="w-4 h-4 mr-2" />
										{{ saving ? "Salvando..." : "Salvar Configurações" }}
									</UiButton>
								</div>
							</div>
						</div>

						<!-- Parâmetros Gerais -->
						<!-- Card Agendamento Inteligente - Seção dedicada -->
						<div class="space-y-4">
							<h4
								class="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest border-b pb-2"
							>
								Sistema de Agendamento
							</h4>

							<!-- Card Agendamento Inteligente - ocupando linha inteira -->
							<div
								class="flex flex-col gap-6 p-6 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-700/50"
							>
								<div class="flex items-center gap-4">
									<div
										class="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center"
									>
										<Icon name="lucide:calendar-check" class="w-7 h-7 text-green-600" />
									</div>
									<div class="flex flex-col gap-1">
										<span class="text-lg font-bold text-green-700 dark:text-green-300"
											>Agendamento Inteligente</span
										>
										<span class="text-sm text-green-600 dark:text-green-400"
											>Sistema sempre ativo</span
										>
									</div>
									<div class="ml-auto flex items-center gap-3">
										<div class="w-3 h-3 rounded-full bg-green-500"></div>
										<span class="text-sm font-bold text-green-600">Ativo</span>
									</div>
								</div>
								<!-- Explicação detalhada -->
								<div
									class="text-sm text-green-600 dark:text-green-400 space-y-2 pl-4 border-l-4 border-green-300"
								>
									<p class="leading-relaxed">
										<strong class="text-green-700 dark:text-green-300">⚡ Mais Rápido:</strong>
										Sistema calcula automaticamente o melhor horário
									</p>
									<p class="leading-relaxed">
										<strong class="text-green-700 dark:text-green-300">📅 Agendamento:</strong>
										Cliente escolhe horário específico dentro do funcionamento
									</p>
									<p class="leading-relaxed">
										<strong class="text-green-700 dark:text-green-300">🛡️ Proteção:</strong>
										Bloqueia horários fechados e tempo insuficiente
									</p>
								</div>
							</div>
						</div>
					</div>
				</UiCard>
			</div>
		</div>
	</div>
</template>

<style scoped>
.transition-all {
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.custom-scrollbar::-webkit-scrollbar {
	width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
	background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
	background: rgba(0, 0, 0, 0.1);
	border-radius: 10px;
}
</style>
