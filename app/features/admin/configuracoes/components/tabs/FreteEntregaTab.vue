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
import { useFreteEntrega } from "../../composables/useFreteEntrega";
import type { TipoTaxaEntrega } from "#shared/types/estabelecimentos";

// Composable de frete e entrega
const { configuracoes, loading, saving, salvarConfiguracoes } = useFreteEntrega();

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

// Validar se modalidade pode ser salva
const canSaveModality = (modality: TipoTaxaEntrega): boolean => {
	switch (modality) {
		case "sem_taxa":
			return true; // Sempre pode
		case "taxa_unica":
			return (values.taxa_entrega || 0) > 0; // Precisa ter taxa
		case "taxa_distancia":
			return (values.taxas_por_distancia || []).filter((t) => t.status === "ativado").length > 0; // Precisa ter regras ativas
		case "taxa_localizacao":
			return (values.taxas_por_localizacao || []).filter((t) => t.status === "ativado").length > 0; // Precisa ter bairros ativos
		default:
			return false;
	}
};

// Salvar configurações manualmente
const salvarManual = async () => {
	if (!configuracoes.value) return;

	// Validar modalidade atual
	const modalityValid = canSaveModality(values.tipo_taxa_entrega as TipoTaxaEntrega);
	if (!modalityValid) return;

	// Validações gerais mais flexíveis
	const isValid =
		(values.taxa_entrega || 0) >= 0 &&
		(values.tempo_preparo_min || 0) > 0 &&
		(values.tempo_preparo_max || 0) > 0 &&
		(values.tempo_preparo_max || 0) >= (values.tempo_preparo_min || 0) &&
		(values.valor_minimo_pedido || 0) >= 0;

	if (!isValid) return;

	await salvarConfiguracoes({
		tipo_taxa_entrega: values.tipo_taxa_entrega,
		taxa_entrega: values.taxa_entrega,
		tempo_preparo_min: values.tempo_preparo_min,
		tempo_preparo_max: values.tempo_preparo_max,
		valor_minimo_pedido: values.valor_minimo_pedido,
		raio_entrega_km: values.raio_entrega_km,
		taxas_por_distancia: values.taxas_por_distancia,
		taxas_por_localizacao: values.taxas_por_localizacao,
	});

	hasUnsavedChanges.value = false;
};

// Watch para detectar mudanças (sem auto-save)
watch(
	[
		() => values.tipo_taxa_entrega,
		() => values.taxa_entrega,
		() => values.tempo_preparo_min,
		() => values.tempo_preparo_max,
		() => values.valor_minimo_pedido,
		() => values.raio_entrega_km,
		() => values.taxas_por_distancia,
		() => values.taxas_por_localizacao,
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
			resetForm({
				values: {
					taxa_entrega: newConfig.taxa_entrega,
					tipo_taxa_entrega: newConfig.tipo_taxa_entrega || "taxa_unica",
					taxas_por_distancia: newConfig.taxas_por_distancia || [],
					taxas_por_localizacao: newConfig.taxas_por_localizacao || [],
					tempo_preparo_min: newConfig.tempo_preparo_min,
					tempo_preparo_max: newConfig.tempo_preparo_max,
					valor_minimo_pedido: newConfig.valor_minimo_pedido,
					raio_entrega_km: newConfig.raio_entrega_km,
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

// Opções de modalidade
const tiposTaxaEntrega = [
	{ value: "sem_taxa", label: "Sem Taxa", icon: "lucide:circle-slash" },
	{ value: "taxa_unica", label: "Taxa Única", icon: "lucide:dollar-sign" },
	{ value: "taxa_distancia", label: "Taxa por Distância", icon: "lucide:map-pin" },
	{ value: "taxa_localizacao", label: "Taxa por Bairro", icon: "lucide:navigation-2" },
] as const;

// Estado local para adições
const novaRegra = ref({
	distancia: { distancia_km: 0, taxa_valor: 0, tempo_min: 30, tempo_max: 60 },
	localizacao: { nome: "", taxa_valor: 0, tempo_min: 30, tempo_max: 60 },
});

const gerarId = () => Math.random().toString(36).substring(2, 11);

// Ações de Distância (apenas atualiza estado local)
const adicionarTaxaDistancia = () => {
	const novas = [
		...(values.taxas_por_distancia || []),
		{ id: gerarId(), ...novaRegra.value.distancia, status: "ativado" as const },
	];
	setFieldValue("taxas_por_distancia", novas);
	novaRegra.value.distancia = { distancia_km: 0, taxa_valor: 0, tempo_min: 30, tempo_max: 60 };
	hasUnsavedChanges.value = true;
};

const removerTaxaDistancia = (id: string) => {
	const novas = (values.taxas_por_distancia || []).filter((t) => t.id !== id);
	setFieldValue("taxas_por_distancia", novas);
	hasUnsavedChanges.value = true;
};

const toggleStatusDistancia = (id: string) => {
	const novas = (values.taxas_por_distancia || []).map((t) =>
		t.id === id
			? {
					...t,
					status: (t.status === "ativado" ? "desativado" : "ativado") as "ativado" | "desativado",
				}
			: t,
	);
	setFieldValue("taxas_por_distancia", novas);
	hasUnsavedChanges.value = true;
};

// Ações de Localização (apenas atualiza estado local)
const adicionarTaxaLocalizacao = () => {
	if (!novaRegra.value.localizacao.nome) return;
	const novas = [
		...(values.taxas_por_localizacao || []),
		{ id: gerarId(), ...novaRegra.value.localizacao, status: "ativado" as const },
	];
	setFieldValue("taxas_por_localizacao", novas);
	novaRegra.value.localizacao = { nome: "", taxa_valor: 0, tempo_min: 30, tempo_max: 60 };
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
			case "taxa_distancia":
				return {
					status: "warning",
					message: "Adicione pelo menos uma regra de distância ativa",
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

const canSave = computed(() => {
	return hasUnsavedChanges.value;
});

const formatCurrency = (v: number) =>
	new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const tipoTaxaLabel = computed(
	() => tiposTaxaEntrega.find((t) => t.value === values.tipo_taxa_entrega)?.label || "",
);
</script>

<template>
	<div class="h-full flex flex-col">
		<div v-if="loading" class="grid grid-cols-1 lg:grid-cols-5 gap-4">
			<UiSkeleton class="lg:col-span-2 h-64" />
			<UiSkeleton class="lg:col-span-3 h-64" />
		</div>

		<div v-else class="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-5 gap-4">
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
								v-if="
									values.tipo_taxa_entrega === 'sem_taxa' ||
									values.tipo_taxa_entrega === 'taxa_unica'
								"
								class="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-700/50"
							>
								<p class="text-[10px] uppercase font-bold text-gray-500 mb-1">Raio Máximo</p>
								<span class="text-sm font-bold text-gray-900 dark:text-white">{{
									values.tipo_taxa_entrega === "sem_taxa" && (values.raio_entrega_km || 0) === 0
										? "Ilimitado"
										: values.tipo_taxa_entrega === "sem_taxa"
											? `${values.raio_entrega_km || 0} km`
											: (values.raio_entrega_km || 0) === 0
												? "Ilimitado"
												: `${values.raio_entrega_km || 0} km`
								}}</span>
							</div>
							<div
								v-else-if="values.tipo_taxa_entrega === 'taxa_distancia'"
								class="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-700/50"
							>
								<p class="text-[10px] uppercase font-bold text-gray-500 mb-1">Faixas</p>
								<span class="text-sm font-bold text-gray-900 dark:text-white">
									{{
										values.taxas_por_distancia?.filter((d) => d.status === "ativado").length || 0
									}}
									ativas
								</span>
							</div>
							<div
								v-else-if="values.tipo_taxa_entrega === 'taxa_localizacao'"
								class="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-700/50"
							>
								<p class="text-[10px] uppercase font-bold text-gray-500 mb-1">Bairros</p>
								<span class="text-sm font-bold text-gray-900 dark:text-white">
									{{
										values.taxas_por_localizacao?.filter((l) => l.status === "ativado").length || 0
									}}
									ativos
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
									>{{ values.tempo_preparo_min }}-{{ values.tempo_preparo_max }} min</span
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
						<div
							v-if="
								values.tipo_taxa_entrega === 'taxa_localizacao' ||
								values.tipo_taxa_entrega === 'taxa_distancia'
							"
							class="space-y-4"
						>
							<!-- Header com ícone e contador -->
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<Icon
										:name="
											values.tipo_taxa_entrega === 'taxa_localizacao'
												? 'lucide:map-pin'
												: 'lucide:route'
										"
										class="w-3 h-3 text-primary-500"
									/>
									<h4 class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
										{{
											values.tipo_taxa_entrega === "taxa_localizacao"
												? "Bairros Ativos"
												: "Faixas de Distância"
										}}
									</h4>
								</div>
								<span
									class="text-[9px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full"
								>
									{{
										values.tipo_taxa_entrega === "taxa_localizacao"
											? values.taxas_por_localizacao?.filter((l) => l.status === "ativado")
													.length || 0
											: values.taxas_por_distancia?.filter((d) => d.status === "ativado").length ||
												0
									}}
								</span>
							</div>

							<!-- Lista de taxas -->
							<div class="space-y-1">
								<template v-if="values.tipo_taxa_entrega === 'taxa_localizacao'">
									<div
										v-for="loc in values.taxas_por_localizacao
											?.filter((l) => l.status === 'ativado')
											.slice(0, 4)"
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
								</template>
								<template v-else>
									<div
										v-for="dist in values.taxas_por_distancia
											?.filter((d) => d.status === 'ativado')
											.slice(0, 4)"
										:key="dist.id"
										class="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-100 dark:border-gray-700/30"
									>
										<div class="flex items-center gap-2">
											<div class="w-2 h-2 bg-blue-500 rounded-full"></div>
											<span class="text-xs font-medium text-gray-700 dark:text-gray-300"
												>Até {{ dist.distancia_km }}km</span
											>
										</div>
										<span class="text-xs font-bold text-primary-600 dark:text-primary-400">{{
											formatCurrency(dist.taxa_valor)
										}}</span>
									</div>
								</template>

								<!-- Indicador de mais itens -->
								<div
									v-if="
										(values.tipo_taxa_entrega === 'taxa_localizacao' &&
											(values.taxas_por_localizacao?.filter((l) => l.status === 'ativado').length ||
												0) > 4) ||
										(values.tipo_taxa_entrega === 'taxa_distancia' &&
											(values.taxas_por_distancia?.filter((d) => d.status === 'ativado').length ||
												0) > 4)
									"
									class="flex items-center justify-center py-2 text-center"
								>
									<span class="text-[10px] text-gray-400 font-medium">
										+{{
											values.tipo_taxa_entrega === "taxa_localizacao"
												? (values.taxas_por_localizacao?.filter((l) => l.status === "ativado")
														.length || 0) - 4
												: (values.taxas_por_distancia?.filter((d) => d.status === "ativado")
														.length || 0) - 4
										}}
										mais configuradas
									</span>
								</div>

								<!-- Estado vazio -->
								<div
									v-if="
										(values.tipo_taxa_entrega === 'taxa_localizacao' &&
											(values.taxas_por_localizacao?.filter((l) => l.status === 'ativado').length ||
												0) === 0) ||
										(values.tipo_taxa_entrega === 'taxa_distancia' &&
											(values.taxas_por_distancia?.filter((d) => d.status === 'ativado').length ||
												0) === 0)
									"
									class="flex items-center justify-center py-4 text-center"
								>
									<div class="flex flex-col items-center gap-1">
										<Icon name="lucide:plus-circle" class="w-4 h-4 text-gray-300" />
										<span class="text-[10px] text-gray-400">
											{{
												values.tipo_taxa_entrega === "taxa_localizacao"
													? "Nenhum bairro configurado"
													: "Nenhuma faixa configurada"
											}}
										</span>
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
			<div class="lg:col-span-3 flex min-h-0">
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
										<UiInput
											:model-value="values.valor_minimo_pedido"
											type="number"
											step="0.01"
											placeholder="0,00"
											@update:model-value="(v) => setFieldValue('valor_minimo_pedido', Number(v))"
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
									<UiFormField label="Raio Máximo (km)">
										<UiInput
											:model-value="values.raio_entrega_km"
											type="number"
											placeholder="5"
											@update:model-value="(v) => setFieldValue('raio_entrega_km', Number(v))"
										/>
										<div class="mt-2 space-y-1">
											<p class="text-xs text-gray-500 leading-relaxed">
												Distância máxima de entrega a partir do seu estabelecimento.
												<span class="font-medium text-gray-600"
													>Deixe em zero para entrega ilimitada.</span
												>
											</p>
											<div
												v-if="(values.raio_entrega_km || 0) === 0"
												class="flex items-center gap-2 text-xs text-green-600"
											>
												<div class="flex items-center">
													<div
														class="w-8 h-4 bg-green-500 rounded-full flex items-center justify-end px-0.5"
													>
														<div class="w-3 h-3 bg-white rounded-full shadow-sm"></div>
													</div>
												</div>
												<span class="font-medium"
													>Entrega ilimitada - sem restrição de distância</span
												>
											</div>
											<div
												v-else-if="(values.raio_entrega_km || 0) > 10"
												class="flex items-center gap-2 text-xs text-amber-600"
											>
												<div class="flex items-center">
													<div
														class="w-8 h-4 bg-amber-500 rounded-full flex items-center justify-start px-0.5"
													>
														<div class="w-3 h-3 bg-white rounded-full shadow-sm"></div>
													</div>
												</div>
												<span class="font-medium"
													>Raios muito grandes podem afetar o tempo de entrega</span
												>
											</div>
											<div
												v-else-if="(values.raio_entrega_km || 0) > 0"
												class="flex items-center gap-2 text-xs text-blue-600"
											>
												<div class="flex items-center">
													<div
														class="w-8 h-4 bg-blue-500 rounded-full flex items-center justify-end px-0.5"
													>
														<div class="w-3 h-3 bg-white rounded-full shadow-sm"></div>
													</div>
												</div>
												<span class="font-medium"
													>Raio definido: {{ values.raio_entrega_km }}km de alcance</span
												>
											</div>
										</div>
									</UiFormField>
								</div>

								<!-- Botão Salvar -->
								<div class="flex justify-end">
									<UiButton
										:disabled="!canSave || saving"
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
									<UiInput
										:model-value="values.taxa_entrega"
										type="number"
										step="0.01"
										placeholder="5,00"
										:class="[
											!canSaveModality('taxa_unica') &&
											(!values.taxa_entrega || values.taxa_entrega <= 0)
												? 'border-amber-300 focus:border-amber-500 focus:ring-amber-500'
												: '',
										]"
										@update:model-value="(v) => setFieldValue('taxa_entrega', Number(v))"
									/>
									<div class="mt-2 space-y-1">
										<p class="text-xs text-gray-500 leading-relaxed">
											Taxa fixa cobrada em todos os pedidos.
										</p>
									</div>
								</UiFormField>
								<UiFormField label="Pedido Mínimo (R$)">
									<UiInput
										:model-value="values.valor_minimo_pedido"
										type="number"
										step="0.01"
										placeholder="0,00"
										@update:model-value="(v) => setFieldValue('valor_minimo_pedido', Number(v))"
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
								<UiFormField label="Raio Máximo (km)">
									<UiInput
										:model-value="values.raio_entrega_km"
										type="number"
										placeholder="5"
										@update:model-value="(v) => setFieldValue('raio_entrega_km', Number(v))"
									/>
									<div class="mt-2 space-y-1">
										<p class="text-xs text-gray-500 leading-relaxed">
											Distância máxima de entrega.
											<span class="font-medium text-gray-600"
												>Deixe em zero para entrega ilimitada.</span
											>
										</p>
										<div
											v-if="(values.raio_entrega_km || 0) === 0"
											class="flex items-center gap-1 text-xs text-green-600"
										>
											<Icon name="lucide:infinity" class="w-3 h-3" />
											<span class="font-medium">Entrega ilimitada</span>
										</div>
										<div
											v-else-if="(values.raio_entrega_km || 0) > 10"
											class="flex items-center gap-1 text-xs text-amber-600"
										>
											<Icon name="lucide:alert-triangle" class="w-3 h-3" />
											<span class="font-medium">Raio muito grande</span>
										</div>
										<div
											v-else-if="(values.raio_entrega_km || 0) > 0"
											class="flex items-center gap-1 text-xs text-blue-600"
										>
											<Icon name="lucide:map-pin" class="w-3 h-3" />
											<span class="font-medium">{{ values.raio_entrega_km }}km de alcance</span>
										</div>
									</div>
								</UiFormField>

								<!-- Botão Salvar -->
								<div class="md:col-span-3 flex justify-end">
									<UiButton
										:disabled="!canSave || saving"
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

							<!-- TAXA POR DISTÂNCIA -->
							<div v-else-if="values.tipo_taxa_entrega === 'taxa_distancia'" class="space-y-6">
								<!-- Alerta se não tem regras -->
								<div
									v-if="
										!canSaveModality('taxa_distancia') &&
										(!values.taxas_por_distancia ||
											values.taxas_por_distancia.filter((t) => t.status === 'ativado').length === 0)
									"
									class="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
								>
									<div class="flex items-center gap-2">
										<Icon name="lucide:alert-triangle" class="w-4 h-4 text-amber-600" />
										<span class="text-sm font-medium text-amber-800 dark:text-amber-200">
											Adicione pelo menos uma regra de distância ativa para ativar esta modalidade
										</span>
									</div>
								</div>

								<!-- Configurações básicas -->
								<div class="grid grid-cols-1 gap-6">
									<UiFormField label="Pedido Mínimo (R$)">
										<UiInput
											:model-value="values.valor_minimo_pedido"
											type="number"
											step="0.01"
											placeholder="0,00"
											@update:model-value="(v) => setFieldValue('valor_minimo_pedido', Number(v))"
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
								</div>

								<div class="grid grid-cols-12 gap-3 items-end">
									<div class="col-span-2">
										<UiFormField label="Até (km)">
											<UiInput
												v-model="novaRegra.distancia.distancia_km"
												type="number"
												@update:model-value="(v) => (novaRegra.distancia.distancia_km = Number(v))"
											/>
										</UiFormField>
									</div>
									<div class="col-span-2">
										<UiFormField label="Taxa (R$)">
											<UiInput
												v-model="novaRegra.distancia.taxa_valor"
												type="number"
												step="0.01"
												@update:model-value="(v) => (novaRegra.distancia.taxa_valor = Number(v))"
											/>
										</UiFormField>
									</div>
									<div class="col-span-3">
										<UiFormField label="Tempo Mínimo">
											<UiInput
												v-model="novaRegra.distancia.tempo_min"
												type="number"
												@update:model-value="(v) => (novaRegra.distancia.tempo_min = Number(v))"
											/>
										</UiFormField>
									</div>
									<div class="col-span-3">
										<UiFormField label="Tempo Máximo">
											<UiInput
												v-model="novaRegra.distancia.tempo_max"
												type="number"
												@update:model-value="(v) => (novaRegra.distancia.tempo_max = Number(v))"
											/>
										</UiFormField>
									</div>
									<div class="col-span-2 flex justify-end">
										<UiButton
											variant="solid"
											class="h-10 w-10 rounded-lg bg-gray-900 dark:bg-primary text-white flex items-center justify-center"
											@click="adicionarTaxaDistancia"
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
												<th class="px-4 py-2">Km</th>
												<th class="px-4 py-2">Taxa</th>
												<th class="px-4 py-2 text-center">Tempo</th>
												<th class="px-4 py-2 text-center">Status</th>
												<th class="px-4 py-2 text-right"></th>
											</tr>
										</thead>
										<tbody class="divide-y">
											<tr v-for="t in values.taxas_por_distancia" :key="t.id">
												<td class="px-4 py-3 font-bold">Até {{ t.distancia_km }}km</td>
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
														@click="toggleStatusDistancia(t.id)"
													>
														{{ t.status === "ativado" ? "On" : "Off" }}
													</button>
												</td>
												<td class="px-4 py-3 text-right">
													<button
														type="button"
														class="text-gray-400 hover:text-red-500"
														@click="removerTaxaDistancia(t.id)"
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
										:disabled="!canSave || saving"
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
								<div class="grid grid-cols-1 md:grid-cols-1 gap-6">
									<UiFormField label="Pedido Mínimo (R$)">
										<UiInput
											:model-value="values.valor_minimo_pedido"
											type="number"
											step="0.01"
											placeholder="0,00"
											@update:model-value="(v) => setFieldValue('valor_minimo_pedido', Number(v))"
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
								</div>

								<div class="grid grid-cols-12 gap-3 items-end">
									<div class="col-span-4">
										<UiFormField label="Bairro / Região">
											<UiInput v-model="novaRegra.localizacao.nome" placeholder="Ex: Centro" />
										</UiFormField>
									</div>
									<div class="col-span-2">
										<UiFormField label="Taxa">
											<UiInput
												v-model="novaRegra.localizacao.taxa_valor"
												type="number"
												step="0.01"
											/>
										</UiFormField>
									</div>
									<div class="col-span-2">
										<UiFormField label="Tempo Mínimo">
											<UiInput v-model="novaRegra.localizacao.tempo_min" type="number" />
										</UiFormField>
									</div>
									<div class="col-span-2">
										<UiFormField label="Tempo Máximo">
											<UiInput v-model="novaRegra.localizacao.tempo_max" type="number" />
										</UiFormField>
									</div>
									<div class="col-span-2 flex justify-end">
										<UiButton
											variant="solid"
											class="h-10 w-10 rounded-lg bg-gray-900 dark:bg-primary text-white flex items-center justify-center"
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
												<th class="px-4 py-2">Área</th>
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
										:disabled="!canSave || saving"
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
