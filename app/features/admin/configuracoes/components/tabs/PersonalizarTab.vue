<script setup lang="ts">
/**
 * 📌 PersonalizarTab
 *
 * Tab de personalização visual do cardápio (Admin + Gerente).
 * Layout padronizado com o sistema (2 Colunas: Preview + Editor).
 * Focado em cores e estilo de botões - fonte sempre Inter.
 */

import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { personalizacaoSchema } from "#shared/schemas/configuracoes";
import { usePersonalizacao } from "../../composables/usePersonalizacao";

// Composable de personalização
const { tema, loading, saving, salvarTema } = usePersonalizacao();

// Schema de validação
const validationSchema = toTypedSchema(personalizacaoSchema);

// Formulário com vee-validate
const { handleSubmit, values, setFieldValue, resetForm } = useForm({
	validationSchema,
	keepValuesOnUnmount: true,
});

// Submeter formulário manual
const onSubmit = handleSubmit(async (formValues) => {
	await salvarTema(formValues);
});

// Cores padrão do sistema
const CORES_PADRAO = {
	cor_primaria: "#3b82f6",
	cor_secundaria: "#10b981",
	cor_fundo: "#ffffff",
	cor_texto: "#1f2937",
	// Status (Novos Defaults)
	cor_sucesso: "#10b981", // Emerald 500
	cor_erro: "#ef4444", // Red 500
	cor_aviso: "#f59e0b", // Amber 500
	// Gradientes (Novos Defaults)
	gradiente_promo_inicio: "#f43f5e", // Rose 500
	gradiente_promo_fim: "#dc2626", // Red 600
	gradiente_destaque_inicio: "#fbbf24", // Amber 400
	gradiente_destaque_fim: "#eab308", // Yellow 500
} as const;

// Watch para carregar dados iniciais
watch(
	tema,
	(newTema) => {
		if (newTema) {
			resetForm({
				values: {
					...newTema,
					// Garante que campos opcionais tenham valor (ou fallback para o padrão se undefined)
					cor_sucesso: newTema.cor_sucesso || CORES_PADRAO.cor_sucesso,
					cor_erro: newTema.cor_erro || CORES_PADRAO.cor_erro,
					cor_aviso: newTema.cor_aviso || CORES_PADRAO.cor_aviso,
					gradiente_promo_inicio:
						newTema.gradiente_promo_inicio || CORES_PADRAO.gradiente_promo_inicio,
					gradiente_promo_fim: newTema.gradiente_promo_fim || CORES_PADRAO.gradiente_promo_fim,
					gradiente_destaque_inicio:
						newTema.gradiente_destaque_inicio || CORES_PADRAO.gradiente_destaque_inicio,
					gradiente_destaque_fim:
						newTema.gradiente_destaque_fim || CORES_PADRAO.gradiente_destaque_fim,
				},
			});
			nextTick(() => {
				isInitializing.value = false;
			});
		}
	},
	{ immediate: true },
);

// Opções de estilo de botões
const estilosBotoes = [
	{ value: "rounded", label: "Arredondado", icon: "lucide:circle" },
	{ value: "square", label: "Quadrado", icon: "lucide:square" },
] as const;

// Estado interno
const isInitializing = ref(true);
const secoesAbertas = ref({
	status: false,
	gradientes: false,
});

/**
 * Reseta uma cor específica para o padrão
 */
const resetarCor = (campo: keyof typeof CORES_PADRAO) => {
	setFieldValue(campo, CORES_PADRAO[campo]);
};

/**
 * Toggle seção
 */
const toggleSecao = (secao: keyof typeof secoesAbertas.value) => {
	secoesAbertas.value[secao] = !secoesAbertas.value[secao];
};
</script>

<template>
	<div class="h-full flex flex-col">
		<!-- Loading -->
		<div v-if="loading" class="grid grid-cols-1 lg:grid-cols-5 gap-4">
			<UiSkeleton class="lg:col-span-2 h-96 rounded-xl" />
			<UiSkeleton class="lg:col-span-3 h-96 rounded-xl" />
		</div>

		<!-- Layout 2 Colunas -->
		<div v-else class="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-5 gap-4">
			<!-- COLUNA ESQUERDA: PREVIEW -->
			<div class="lg:col-span-2 flex min-h-0">
				<UiCard class="flex-1" fill-height no-padding size="lg">
					<template #header>
						<div class="flex items-center gap-2">
							<Icon name="lucide:eye" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
							<h3 class="text-sm font-semibold text-gray-900 dark:text-white">
								Prévia do Cardápio
							</h3>
						</div>
					</template>

					<div
						class="flex-1 overflow-y-auto p-0 flex flex-col items-center bg-gray-100 dark:bg-gray-900/50"
					>
						<!-- Container do "Celular" -->
						<div
							class="w-full max-w-[300px] my-6 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[40px] border-[8px] border-gray-900 dark:border-gray-800 overflow-hidden flex flex-col aspect-[9/19] relative transition-all duration-300"
							:style="{
								'--cardapio-primary': values.cor_primaria,
								'--cardapio-secondary': values.cor_secundaria,
								'--bg-surface': values.cor_fundo,
								'--text-primary': values.cor_texto,
								'--cardapio-success': values.cor_sucesso,
								'--cardapio-danger': values.cor_erro,
								'--cardapio-warning': values.cor_aviso,
								'--cardapio-promo-from': values.gradiente_promo_inicio,
								'--cardapio-promo-to': values.gradiente_promo_fim,
								'--cardapio-highlight-from': values.gradiente_destaque_inicio,
								'--cardapio-highlight-to': values.gradiente_destaque_fim,
								backgroundColor: values.cor_fundo,
								fontFamily: 'Inter, sans-serif',
							}"
						>
							<!-- Notch -->
							<div
								class="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 dark:bg-gray-800 rounded-b-2xl z-50 flex items-end justify-center pb-1"
							>
								<div class="w-10 h-1 bg-white/10 rounded-full"></div>
							</div>

							<!-- Conteúdo do App -->
							<div class="flex-1 overflow-y-auto pt-8 custom-scrollbar">
								<!-- Header Realístico -->
								<div class="p-3">
									<div
										class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 flex items-start gap-3 border border-gray-100 dark:border-gray-700 relative overflow-hidden"
										:style="{
											backgroundColor:
												values.cor_fundo === '#ffffff' ? '#ffffff' : `${values.cor_fundo}EE`,
										}"
									>
										<!-- Logo -->
										<div
											class="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0 shadow-sm border border-gray-100 dark:border-gray-700 relative z-10"
										>
											<Icon
												name="lucide:store"
												class="w-7 h-7 opacity-20"
												:style="{ color: values.cor_texto }"
											/>
										</div>
										<div class="flex-1 min-w-0 relative z-10">
											<div
												class="h-3 w-3/4 rounded bg-gray-200/50 mb-1.5"
												:style="{ backgroundColor: `${values.cor_texto}20` }"
											></div>
											<div
												class="h-1.5 w-1/2 rounded bg-gray-200/50 mb-2.5"
												:style="{ backgroundColor: `${values.cor_texto}10` }"
											></div>
											<div class="flex flex-wrap items-center gap-1.5">
												<!-- Badge Aberto -->
												<div
													class="px-2 py-0.5 rounded-full text-[8px] font-bold text-white shadow-sm flex items-center gap-1"
													:style="{
														backgroundColor: values.cor_sucesso,
														borderRadius: values.estilo_botoes === 'rounded' ? '99px' : '4px',
													}"
												>
													<div class="w-1 h-1 rounded-full bg-white animate-pulse"></div>
													Aberto
												</div>
												<!-- Badge Tempo -->
												<div
													class="px-2 py-0.5 rounded-full text-[8px] font-medium bg-gray-100/50 backdrop-blur-sm flex items-center gap-1"
													:style="{
														color: values.cor_texto,
														borderRadius: values.estilo_botoes === 'rounded' ? '99px' : '4px',
													}"
												>
													<Icon name="lucide:clock" class="w-2 h-2" />
													30m
												</div>
											</div>
										</div>
									</div>
								</div>

								<!-- Categorias -->
								<div class="px-3 py-2 flex gap-2 overflow-x-hidden">
									<div
										v-for="(cat, i) in ['Todos', 'Burgers', 'Bebidas']"
										:key="cat"
										class="px-3 py-1 text-[9px] font-bold whitespace-nowrap shadow-sm transition-all"
										:style="{
											backgroundColor:
												i === 0
													? values.cor_primaria
													: values.cor_fundo === '#ffffff'
														? '#f3f4f6'
														: `${values.cor_texto}15`,
											color: i === 0 ? '#ffffff' : values.cor_texto,
											borderRadius: values.estilo_botoes === 'rounded' ? '99px' : '4px',
											opacity: i === 0 ? 1 : 0.6,
										}"
									>
										{{ cat }}
									</div>
								</div>

								<!-- Produtos -->
								<div class="px-3 grid gap-2 pb-8 grid-cols-1">
									<!-- Produto Normal -->
									<div
										class="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex transition-all flex-row p-1.5 gap-2 items-center"
										:style="{
											backgroundColor:
												values.cor_fundo === '#ffffff' ? '#ffffff' : `${values.cor_fundo}EE`,
											borderRadius: '10px',
										}"
									>
										<div
											class="bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0 w-14 h-14 rounded-lg relative overflow-hidden"
										>
											<Icon
												name="lucide:utensils"
												class="w-5 h-5 opacity-10"
												:style="{ color: values.cor_texto }"
											/>
										</div>
										<div class="flex-1 min-w-0 space-y-0.5">
											<div
												class="h-2.5 w-full rounded bg-gray-200/50"
												:style="{ backgroundColor: `${values.cor_texto}20` }"
											></div>
											<div class="flex justify-between items-center pt-0.5">
												<span class="text-[9px] font-black" :style="{ color: values.cor_primaria }"
													>R$ 25,90</span
												>
												<div
													class="w-5 h-5 flex items-center justify-center text-white shadow-sm transition-all"
													:style="{
														backgroundColor: values.cor_primaria,
														borderRadius: values.estilo_botoes === 'rounded' ? '50%' : '4px',
													}"
												>
													<Icon name="lucide:plus" class="w-3 h-3" />
												</div>
											</div>
										</div>
									</div>

									<!-- Produto Promoção -->
									<div
										class="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex transition-all flex-row p-1.5 gap-2 items-center"
										:style="{
											backgroundColor:
												values.cor_fundo === '#ffffff' ? '#ffffff' : `${values.cor_fundo}EE`,
											borderRadius: '10px',
										}"
									>
										<div
											class="bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0 w-14 h-14 rounded-lg relative overflow-hidden"
										>
											<!-- Badge Promo -->
											<div
												class="absolute top-1 left-1 px-1 py-0.5 rounded text-[6px] font-bold text-white z-10"
												:style="{
													backgroundImage: `linear-gradient(to right, ${values.gradiente_promo_inicio}, ${values.gradiente_promo_fim})`,
												}"
											>
												-15%
											</div>
											<Icon
												name="lucide:pizza"
												class="w-5 h-5 opacity-10"
												:style="{ color: values.cor_texto }"
											/>
										</div>
										<div class="flex-1 min-w-0 space-y-0.5">
											<div
												class="h-2.5 w-3/4 rounded bg-gray-200/50"
												:style="{ backgroundColor: `${values.cor_texto}20` }"
											></div>
											<div class="flex justify-between items-center pt-0.5">
												<span class="text-[9px] font-black" :style="{ color: values.cor_sucesso }"
													>R$ 19,90</span
												>
												<div
													class="w-5 h-5 flex items-center justify-center text-white shadow-sm transition-all"
													:style="{
														backgroundColor: values.cor_primaria,
														borderRadius: values.estilo_botoes === 'rounded' ? '50%' : '4px',
													}"
												>
													<Icon name="lucide:plus" class="w-3 h-3" />
												</div>
											</div>
										</div>
									</div>

									<!-- Produto Destaque -->
									<div
										class="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex transition-all flex-row p-1.5 gap-2 items-center"
										:style="{
											backgroundColor:
												values.cor_fundo === '#ffffff' ? '#ffffff' : `${values.cor_fundo}EE`,
											borderRadius: '10px',
										}"
									>
										<div
											class="bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0 w-14 h-14 rounded-lg relative overflow-hidden"
										>
											<Icon
												name="lucide:sandwich"
												class="w-5 h-5 opacity-10"
												:style="{ color: values.cor_texto }"
											/>
										</div>
										<div class="flex-1 min-w-0 space-y-0.5">
											<div
												class="h-2.5 w-2/3 rounded bg-gray-200/50"
												:style="{ backgroundColor: `${values.cor_texto}20` }"
											></div>
											<div class="flex items-center gap-1">
												<!-- Badge Destaque (Star) -->
												<div
													class="w-3 h-3 rounded flex items-center justify-center"
													:style="{
														backgroundImage: `linear-gradient(to bottom right, ${values.gradiente_destaque_inicio}, ${values.gradiente_destaque_fim})`,
													}"
												>
													<Icon name="lucide:star" class="w-2 h-2 text-white fill-white" />
												</div>
												<span class="text-[8px] opacity-70" :style="{ color: values.cor_texto }"
													>Mais vendido</span
												>
											</div>
											<div class="flex justify-between items-center pt-0.5">
												<span class="text-[9px] font-black" :style="{ color: values.cor_primaria }"
													>R$ 22,00</span
												>
												<div
													class="w-5 h-5 flex items-center justify-center text-white shadow-sm transition-all"
													:style="{
														backgroundColor: values.cor_primaria,
														borderRadius: values.estilo_botoes === 'rounded' ? '50%' : '4px',
													}"
												>
													<Icon name="lucide:plus" class="w-3 h-3" />
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</UiCard>
			</div>

			<!-- COLUNA DIREITA: EDITOR -->
			<div class="lg:col-span-3 flex min-h-0">
				<UiCard class="flex-1" fill-height no-padding size="lg">
					<template #header>
						<div class="flex items-center gap-2">
							<Icon name="lucide:palette" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
							<h3 class="text-sm font-semibold text-gray-900 dark:text-white">Identidade Visual</h3>
						</div>
					</template>

					<div class="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
						<!-- 1. Identidade Principal -->
						<section class="space-y-4">
							<div class="flex items-center gap-2 mb-2">
								<div class="w-1 h-4 bg-primary rounded-full"></div>
								<h4
									class="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider"
								>
									Identidade Principal
								</h4>
							</div>

							<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
								<!-- Cor Primária -->
								<div class="space-y-2">
									<div class="flex items-center justify-between px-1">
										<label class="text-[10px] font-black text-gray-400 uppercase tracking-widest"
											>Cor Primária</label
										>
										<button
											v-if="values.cor_primaria?.toLowerCase() !== CORES_PADRAO.cor_primaria"
											type="button"
											class="text-[9px] font-bold text-primary hover:underline"
											@click="resetarCor('cor_primaria')"
										>
											Resetar
										</button>
									</div>
									<div class="flex gap-2">
										<input
											type="color"
											class="w-12 h-11 rounded-lg border-2 border-gray-200 dark:border-gray-700 cursor-pointer p-1 transition-all hover:scale-105"
											:value="values.cor_primaria"
											@input="
												(e) => setFieldValue('cor_primaria', (e.target as HTMLInputElement).value)
											"
										/>
										<UiInput
											:model-value="values.cor_primaria"
											placeholder="#3B82F6"
											class="flex-1"
											@update:model-value="(v) => setFieldValue('cor_primaria', String(v))"
										/>
									</div>
								</div>

								<!-- Cor Secundária -->
								<div class="space-y-2">
									<div class="flex items-center justify-between px-1">
										<label class="text-[10px] font-black text-gray-400 uppercase tracking-widest"
											>Cor Secundária</label
										>
										<button
											v-if="values.cor_secundaria?.toLowerCase() !== CORES_PADRAO.cor_secundaria"
											type="button"
											class="text-[9px] font-bold text-primary hover:underline"
											@click="resetarCor('cor_secundaria')"
										>
											Resetar
										</button>
									</div>
									<div class="flex gap-2">
										<input
											type="color"
											class="w-12 h-11 rounded-lg border-2 border-gray-200 dark:border-gray-700 cursor-pointer p-1 transition-all hover:scale-105"
											:value="values.cor_secundaria"
											@input="
												(e) => setFieldValue('cor_secundaria', (e.target as HTMLInputElement).value)
											"
										/>
										<UiInput
											:model-value="values.cor_secundaria"
											placeholder="#10B981"
											class="flex-1"
											@update:model-value="(v) => setFieldValue('cor_secundaria', String(v))"
										/>
									</div>
								</div>

								<!-- Cor de Fundo -->
								<div class="space-y-2">
									<div class="flex items-center justify-between px-1">
										<label class="text-[10px] font-black text-gray-400 uppercase tracking-widest"
											>Cor de Fundo</label
										>
										<button
											v-if="values.cor_fundo?.toLowerCase() !== CORES_PADRAO.cor_fundo"
											type="button"
											class="text-[9px] font-bold text-primary hover:underline"
											@click="resetarCor('cor_fundo')"
										>
											Resetar
										</button>
									</div>
									<div class="flex gap-2">
										<input
											type="color"
											class="w-12 h-11 rounded-lg border-2 border-gray-200 dark:border-gray-700 cursor-pointer p-1 transition-all hover:scale-105"
											:value="values.cor_fundo"
											@input="
												(e) => setFieldValue('cor_fundo', (e.target as HTMLInputElement).value)
											"
										/>
										<UiInput
											:model-value="values.cor_fundo"
											placeholder="#FFFFFF"
											class="flex-1"
											@update:model-value="(v) => setFieldValue('cor_fundo', String(v))"
										/>
									</div>
								</div>

								<!-- Cor de Texto -->
								<div class="space-y-2">
									<div class="flex items-center justify-between px-1">
										<label class="text-[10px] font-black text-gray-400 uppercase tracking-widest"
											>Cor do Texto</label
										>
										<button
											v-if="values.cor_texto?.toLowerCase() !== CORES_PADRAO.cor_texto"
											type="button"
											class="text-[9px] font-bold text-primary hover:underline"
											@click="resetarCor('cor_texto')"
										>
											Resetar
										</button>
									</div>
									<div class="flex gap-2">
										<input
											type="color"
											class="w-12 h-11 rounded-lg border-2 border-gray-200 dark:border-gray-700 cursor-pointer p-1 transition-all hover:scale-105"
											:value="values.cor_texto"
											@input="
												(e) => setFieldValue('cor_texto', (e.target as HTMLInputElement).value)
											"
										/>
										<UiInput
											:model-value="values.cor_texto"
											placeholder="#1F2937"
											class="flex-1"
											@update:model-value="(v) => setFieldValue('cor_texto', String(v))"
										/>
									</div>
								</div>
							</div>
						</section>

						<!-- 2. Cores de Status (Collapsable) -->
						<section class="border-t border-gray-100 dark:border-gray-800 pt-4">
							<button
								type="button"
								class="flex items-center justify-between w-full mb-4 group"
								@click="toggleSecao('status')"
							>
								<div class="flex items-center gap-2">
									<div class="w-1 h-4 bg-emerald-500 rounded-full"></div>
									<h4
										class="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider group-hover:text-primary transition-colors"
									>
										Cores de Status
									</h4>
								</div>
								<Icon
									:name="secoesAbertas.status ? 'lucide:chevron-up' : 'lucide:chevron-down'"
									class="w-4 h-4 text-gray-400"
								/>
							</button>

							<div v-show="secoesAbertas.status" class="grid grid-cols-1 md:grid-cols-2 gap-6 pl-3">
								<!-- Sucesso -->
								<div class="space-y-2">
									<div class="flex items-center justify-between px-1">
										<label class="text-[10px] font-black text-emerald-600 uppercase tracking-widest"
											>Sucesso / Aberto</label
										>
										<button
											v-if="values.cor_sucesso?.toLowerCase() !== CORES_PADRAO.cor_sucesso"
											type="button"
											class="text-[9px] font-bold text-primary hover:underline"
											@click="resetarCor('cor_sucesso')"
										>
											Resetar
										</button>
									</div>
									<div class="flex gap-2">
										<input
											type="color"
											class="w-12 h-11 rounded-lg border-2 border-gray-200 dark:border-gray-700 cursor-pointer p-1"
											:value="values.cor_sucesso"
											@input="
												(e) => setFieldValue('cor_sucesso', (e.target as HTMLInputElement).value)
											"
										/>
										<UiInput
											:model-value="values.cor_sucesso"
											class="flex-1"
											@update:model-value="(v) => setFieldValue('cor_sucesso', String(v))"
										/>
									</div>
								</div>

								<!-- Erro -->
								<div class="space-y-2">
									<div class="flex items-center justify-between px-1">
										<label class="text-[10px] font-black text-red-600 uppercase tracking-widest"
											>Erro / Fechado</label
										>
										<button
											v-if="values.cor_erro?.toLowerCase() !== CORES_PADRAO.cor_erro"
											type="button"
											class="text-[9px] font-bold text-primary hover:underline"
											@click="resetarCor('cor_erro')"
										>
											Resetar
										</button>
									</div>
									<div class="flex gap-2">
										<input
											type="color"
											class="w-12 h-11 rounded-lg border-2 border-gray-200 dark:border-gray-700 cursor-pointer p-1"
											:value="values.cor_erro"
											@input="
												(e) => setFieldValue('cor_erro', (e.target as HTMLInputElement).value)
											"
										/>
										<UiInput
											:model-value="values.cor_erro"
											class="flex-1"
											@update:model-value="(v) => setFieldValue('cor_erro', String(v))"
										/>
									</div>
								</div>

								<!-- Aviso -->
								<div class="space-y-2">
									<div class="flex items-center justify-between px-1">
										<label class="text-[10px] font-black text-amber-600 uppercase tracking-widest"
											>Aviso / Destaques</label
										>
										<button
											v-if="values.cor_aviso?.toLowerCase() !== CORES_PADRAO.cor_aviso"
											type="button"
											class="text-[9px] font-bold text-primary hover:underline"
											@click="resetarCor('cor_aviso')"
										>
											Resetar
										</button>
									</div>
									<div class="flex gap-2">
										<input
											type="color"
											class="w-12 h-11 rounded-lg border-2 border-gray-200 dark:border-gray-700 cursor-pointer p-1"
											:value="values.cor_aviso"
											@input="
												(e) => setFieldValue('cor_aviso', (e.target as HTMLInputElement).value)
											"
										/>
										<UiInput
											:model-value="values.cor_aviso"
											class="flex-1"
											@update:model-value="(v) => setFieldValue('cor_aviso', String(v))"
										/>
									</div>
								</div>
							</div>
						</section>

						<!-- 3. Gradientes (Collapsable) -->
						<section class="border-t border-gray-100 dark:border-gray-800 pt-4">
							<button
								type="button"
								class="flex items-center justify-between w-full mb-4 group"
								@click="toggleSecao('gradientes')"
							>
								<div class="flex items-center gap-2">
									<div class="w-1 h-4 bg-gradient-to-b from-rose-500 to-red-600 rounded-full"></div>
									<h4
										class="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider group-hover:text-primary transition-colors"
									>
										Gradientes da Marca
									</h4>
								</div>
								<Icon
									:name="secoesAbertas.gradientes ? 'lucide:chevron-up' : 'lucide:chevron-down'"
									class="w-4 h-4 text-gray-400"
								/>
							</button>

							<div
								v-show="secoesAbertas.gradientes"
								class="grid grid-cols-1 md:grid-cols-2 gap-6 pl-3"
							>
								<!-- Promoção -->
								<div class="col-span-2 grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-xl">
									<div class="col-span-2 flex justify-between items-center">
										<label class="text-[10px] font-black text-gray-500 uppercase tracking-widest"
											>Gradiente de Promoção</label
										>
										<div
											class="w-20 h-4 rounded bg-gradient-to-r"
											:style="{
												'--tw-gradient-from': values.gradiente_promo_inicio,
												'--tw-gradient-to': values.gradiente_promo_fim,
												'--tw-gradient-stops': 'var(--tw-gradient-from), var(--tw-gradient-to)',
											}"
										></div>
									</div>
									<!-- Inicio -->
									<div>
										<label class="text-[9px] text-gray-400 block mb-1">Início</label>
										<div class="flex gap-2">
											<input
												type="color"
												class="w-8 h-8 rounded border cursor-pointer"
												:value="values.gradiente_promo_inicio"
												@input="
													(e) =>
														setFieldValue(
															'gradiente_promo_inicio',
															(e.target as HTMLInputElement).value,
														)
												"
											/>
											<UiInput
												:model-value="values.gradiente_promo_inicio"
												class="flex-1 h-8 text-xs"
												@update:model-value="
													(v) => setFieldValue('gradiente_promo_inicio', String(v))
												"
											/>
										</div>
									</div>
									<!-- Fim -->
									<div>
										<label class="text-[9px] text-gray-400 block mb-1">Fim</label>
										<div class="flex gap-2">
											<input
												type="color"
												class="w-8 h-8 rounded border cursor-pointer"
												:value="values.gradiente_promo_fim"
												@input="
													(e) =>
														setFieldValue(
															'gradiente_promo_fim',
															(e.target as HTMLInputElement).value,
														)
												"
											/>
											<UiInput
												:model-value="values.gradiente_promo_fim"
												class="flex-1 h-8 text-xs"
												@update:model-value="(v) => setFieldValue('gradiente_promo_fim', String(v))"
											/>
										</div>
									</div>
								</div>

								<!-- Destaque -->
								<div class="col-span-2 grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-xl">
									<div class="col-span-2 flex justify-between items-center">
										<label class="text-[10px] font-black text-gray-500 uppercase tracking-widest"
											>Gradiente de Destaque</label
										>
										<div
											class="w-20 h-4 rounded bg-gradient-to-r"
											:style="{
												'--tw-gradient-from': values.gradiente_destaque_inicio,
												'--tw-gradient-to': values.gradiente_destaque_fim,
												'--tw-gradient-stops': 'var(--tw-gradient-from), var(--tw-gradient-to)',
											}"
										></div>
									</div>
									<!-- Inicio -->
									<div>
										<label class="text-[9px] text-gray-400 block mb-1">Início</label>
										<div class="flex gap-2">
											<input
												type="color"
												class="w-8 h-8 rounded border cursor-pointer"
												:value="values.gradiente_destaque_inicio"
												@input="
													(e) =>
														setFieldValue(
															'gradiente_destaque_inicio',
															(e.target as HTMLInputElement).value,
														)
												"
											/>
											<UiInput
												:model-value="values.gradiente_destaque_inicio"
												class="flex-1 h-8 text-xs"
												@update:model-value="
													(v) => setFieldValue('gradiente_destaque_inicio', String(v))
												"
											/>
										</div>
									</div>
									<!-- Fim -->
									<div>
										<label class="text-[9px] text-gray-400 block mb-1">Fim</label>
										<div class="flex gap-2">
											<input
												type="color"
												class="w-8 h-8 rounded border cursor-pointer"
												:value="values.gradiente_destaque_fim"
												@input="
													(e) =>
														setFieldValue(
															'gradiente_destaque_fim',
															(e.target as HTMLInputElement).value,
														)
												"
											/>
											<UiInput
												:model-value="values.gradiente_destaque_fim"
												class="flex-1 h-8 text-xs"
												@update:model-value="
													(v) => setFieldValue('gradiente_destaque_fim', String(v))
												"
											/>
										</div>
									</div>
								</div>
							</div>
						</section>

						<!-- Estilo dos Botões -->
						<section class="space-y-6 pt-4 border-t border-gray-100 dark:border-gray-800">
							<div class="flex items-center gap-2 mb-2">
								<div class="w-1 h-4 bg-primary rounded-full"></div>
								<h4
									class="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider"
								>
									Estilo da Interface
								</h4>
							</div>

							<div class="space-y-3">
								<label class="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1"
									>Estilo dos Botões</label
								>
								<div class="grid grid-cols-2 gap-3">
									<button
										v-for="estilo in estilosBotoes"
										:key="estilo.value"
										type="button"
										class="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all"
										:class="[
											values.estilo_botoes === estilo.value
												? 'border-primary bg-primary/5 text-primary'
												: 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 bg-white dark:bg-gray-800 text-gray-500',
										]"
										@click="setFieldValue('estilo_botoes', estilo.value)"
									>
										<Icon :name="estilo.icon" class="w-5 h-5" />
										<span class="text-[10px] font-bold uppercase tracking-tight">{{
											estilo.label
										}}</span>
									</button>
								</div>
							</div>
						</section>

						<!-- Dica -->
						<div
							class="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 flex items-start gap-3 mt-4"
						>
							<Icon name="lucide:info" class="w-5 h-5 text-blue-500 mt-0.5" />
							<div class="space-y-1">
								<p class="text-xs font-bold text-blue-800 dark:text-blue-200">
									Personalização Avançada
								</p>
								<p class="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
									Você tem controle total sobre as cores. Use os gradientes para criar uma
									identidade única para seus destaques e promoções.
								</p>
							</div>
						</div>
					</div>

					<template #footer>
						<div class="flex items-center justify-end gap-3 border-gray-100 dark:border-gray-800">
							<UiButton
								variant="ghost"
								size="sm"
								:disabled="saving"
								@click="() => resetForm({ values: tema! })"
							>
								Descartar
							</UiButton>
							<UiButton
								variant="solid"
								color="primary"
								size="sm"
								:loading="saving"
								@click="onSubmit"
							>
								<template #iconLeft>
									<Icon name="lucide:save" class="w-4 h-4" />
								</template>
								Salvar Alterações
							</UiButton>
						</div>
					</template>
				</UiCard>
			</div>
		</div>
	</div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
	width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
	background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
	background: rgba(var(--primary-rgb), 0.1);
	border-radius: 10px;
}
</style>
