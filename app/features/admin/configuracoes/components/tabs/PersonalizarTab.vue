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
	// 🔥 CRÍTICO: Remover campos undefined para não sobrescrever valores no banco
	// Quando em modo simples, cor_secundaria deve ser omitida (não enviada como undefined)
	const dadosLimpos = Object.fromEntries(
		Object.entries(formValues).filter(([_, value]) => value !== undefined && value !== ""),
	);

	console.log("🔍 Dados do formulário (antes de limpar):", formValues);
	console.log("✅ Dados limpos (enviando):", dadosLimpos);

	await salvarTema(dadosLimpos);
});

// Cores padrão do sistema
// Cores padrão do sistema
// Função para ler variáveis CSS (executada no client)
const getCssVar = (name: string, fallback: string) => {
	if (import.meta.server) return fallback;
	const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
	return value || fallback;
};

// Cores padrão (Computed para ser reativo/dinâmico se necessário, mas aqui só lemos no mount/uso)
const getCoresPadrao = () => ({
	cor_primaria: getCssVar("--default-cardapio-primary", "#fb923c"),
	cor_secundaria: getCssVar("--default-cardapio-secondary", "#0d9488"),
	cor_fundo: getCssVar("--default-cardapio-bg", "#020618"), // Slate 950
	cor_texto: getCssVar("--default-cardapio-text", "#f1f5f9"), // Slate 100
	// Status
	cor_sucesso: getCssVar("--default-cardapio-success", "#16a34a"),
	cor_erro: getCssVar("--default-cardapio-danger", "#dc2626"),
	cor_aviso: getCssVar("--default-cardapio-warning", "#f59e0b"),
	// Gradientes
	gradiente_promo_inicio: getCssVar("--default-cardapio-promo-from", "#dc2626"),
	gradiente_promo_fim: getCssVar("--default-cardapio-promo-to", "#991b1b"),
	gradiente_destaque_inicio: getCssVar("--default-cardapio-highlight-from", "#f59e0b"),
	gradiente_destaque_fim: getCssVar("--default-cardapio-highlight-to", "#d97706"),
});

// Referência reativa para usar no template/script
const CORES_PADRAO = ref(getCoresPadrao());

// Atualizar cores ao montar (caso CSS demore a carregar)
onMounted(() => {
	CORES_PADRAO.value = getCoresPadrao();
});

// Watch para carregar dados iniciais
watch(
	tema,
	(newTema) => {
		if (newTema) {
			// 🔥 CRÍTICO: Detectar modo baseado na presença de cor_secundaria
			const temCorSecundariaCustomizada = !!(
				newTema.cor_secundaria && newTema.cor_secundaria !== CORES_PADRAO.value.cor_secundaria
			);

			resetForm({
				values: {
					// Campos obrigatórios sempre têm valor
					cor_primaria: newTema.cor_primaria || CORES_PADRAO.value.cor_primaria,
					cor_fundo: newTema.cor_fundo || CORES_PADRAO.value.cor_fundo,
					cor_texto: newTema.cor_texto || CORES_PADRAO.value.cor_texto,
					estilo_botoes: newTema.estilo_botoes || "rounded",
					layout_cardapio: newTema.layout_cardapio,

					// 🔥 Cor secundária: só incluir se for customizada (modo avançado)
					...(temCorSecundariaCustomizada ? { cor_secundaria: newTema.cor_secundaria } : {}),

					// Campos opcionais: só incluir se existirem
					...(newTema.cor_sucesso ? { cor_sucesso: newTema.cor_sucesso } : {}),
					...(newTema.cor_erro ? { cor_erro: newTema.cor_erro } : {}),
					...(newTema.cor_aviso ? { cor_aviso: newTema.cor_aviso } : {}),
					...(newTema.cor_info ? { cor_info: newTema.cor_info } : {}),
					...(newTema.gradiente_promo_inicio
						? { gradiente_promo_inicio: newTema.gradiente_promo_inicio }
						: {}),
					...(newTema.gradiente_promo_fim
						? { gradiente_promo_fim: newTema.gradiente_promo_fim }
						: {}),
					...(newTema.gradiente_destaque_inicio
						? { gradiente_destaque_inicio: newTema.gradiente_destaque_inicio }
						: {}),
					...(newTema.gradiente_destaque_fim
						? { gradiente_destaque_fim: newTema.gradiente_destaque_fim }
						: {}),
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
	{ value: "rounded", label: "Arredondado", description: "Bordas circulares e suaves" },
	{ value: "square", label: "Quadrado", description: "Bordas retas e precisas" },
] as const;

// Estado interno
const isInitializing = ref(true);
const secoesAbertas = ref({
	status: false,
	gradientes: false,
});

/**
 * 🎨 Modo de Personalização
 * - Simples: Cor secundária gerada automaticamente (adapta ao fundo)
 * - Avançado: Usuário define cor secundária manualmente
 */
const modoAvancado = ref(false);

// Detectar modo inicial baseado se cor_secundaria está definida
watch(
	tema,
	(newTema) => {
		if (newTema && !isInitializing.value) {
			// Se tem cor secundária definida e diferente do padrão → modo avançado
			modoAvancado.value = !!(
				newTema.cor_secundaria && newTema.cor_secundaria !== CORES_PADRAO.value.cor_secundaria
			);
		}
	},
	{ immediate: true },
);

/**
 * Alterna entre modo simples e avançado
 */
const toggleModo = () => {
	modoAvancado.value = !modoAvancado.value;

	// Se alternar para modo simples, limpar cor secundária (será gerada automaticamente)
	if (!modoAvancado.value) {
		// 🔥 CRÍTICO: Usar null ao invés de undefined para forçar remoção do campo
		setFieldValue("cor_secundaria", null);
	} else {
		// Se alternar para modo avançado, definir cor padrão
		setFieldValue("cor_secundaria", CORES_PADRAO.value.cor_secundaria);
	}
};

/**
 * Reseta uma cor específica para o padrão
 */
const resetarCor = (campo: keyof typeof CORES_PADRAO.value) => {
	setFieldValue(campo, CORES_PADRAO.value[campo]);
};

/**
 * Toggle seção
 */
const toggleSecao = (secao: keyof typeof secoesAbertas.value) => {
	secoesAbertas.value[secao] = !secoesAbertas.value[secao];
};

/**
 * Reseta o tema para os padrões do sistema (remove personalização)
 */
const resetarTemaCompleto = async () => {
	if (!confirm("Tem certeza? Isso irá restaurar todas as cores para o padrão original do sistema."))
		return;

	// Define os valores como undefined/null para o backend limpar ou usar defaults
	const temaResetado = {
		cor_primaria: CORES_PADRAO.value.cor_primaria,
		cor_secundaria: CORES_PADRAO.value.cor_secundaria,
		cor_fundo: CORES_PADRAO.value.cor_fundo,
		cor_texto: CORES_PADRAO.value.cor_texto,
		cor_sucesso: CORES_PADRAO.value.cor_sucesso,
		cor_erro: CORES_PADRAO.value.cor_erro,
		cor_aviso: CORES_PADRAO.value.cor_aviso,
		// Resetar gradientes também
		gradiente_promo_inicio: CORES_PADRAO.value.gradiente_promo_inicio,
		gradiente_promo_fim: CORES_PADRAO.value.gradiente_promo_fim,
		gradiente_destaque_inicio: CORES_PADRAO.value.gradiente_destaque_inicio,
		gradiente_destaque_fim: CORES_PADRAO.value.gradiente_destaque_fim,
		estilo_botoes: "rounded" as const,
		layout_cardapio: "grid" as const,
	};

	// Atualiza o formulário visualmente
	resetForm({ values: temaResetado });

	// Salva no banco
	await onSubmit();
};

// ========================================
// PALETAS PREDEFINIDAS
// ========================================

/**
 * Interface para paletas de cores
 */
interface PaletaCores {
	id: string;
	nome: string;
	descricao: string;
	tipo: "light" | "dark";
	cores: {
		cor_primaria: string;
		cor_secundaria: string;
		cor_fundo: string;
		cor_texto: string;
	};
}

/**
 * Paletas predefinidas (4 Light + 4 Dark)
 */
const PALETAS_PREDEFINIDAS: PaletaCores[] = [
	// Light themes
	{
		id: "light-appetite-orange",
		nome: "Appetite Orange",
		descricao: "Lanchonetes e Fast-foods",
		tipo: "light",
		cores: {
			cor_primaria: "#EA580C",
			cor_secundaria: "#0D9488",
			cor_fundo: "#FFFBF7",
			cor_texto: "#1C1917",
		},
	},
	{
		id: "light-fresh-garden",
		nome: "Fresh Garden",
		descricao: "Comida Saudável",
		tipo: "light",
		cores: {
			cor_primaria: "#16A34A",
			cor_secundaria: "#D97706",
			cor_fundo: "#F8FBF6",
			cor_texto: "#14532D",
		},
	},
	{
		id: "light-gourmet-red",
		nome: "Gourmet Red",
		descricao: "Restaurantes Finos",
		tipo: "light",
		cores: {
			cor_primaria: "#B91C1C",
			cor_secundaria: "#92400E",
			cor_fundo: "#FFFAF5",
			cor_texto: "#450A0A",
		},
	},
	{
		id: "light-tropical-vibes",
		nome: "Tropical Vibes",
		descricao: "Açaí e Sorveterias",
		tipo: "light",
		cores: {
			cor_primaria: "#DB2777",
			cor_secundaria: "#7C3AED",
			cor_fundo: "#FDF4FF",
			cor_texto: "#4A044E",
		},
	},
	// Dark themes
	{
		id: "dark-midnight-flame",
		nome: "Midnight Flame",
		descricao: "Design Premium",
		tipo: "dark",
		cores: {
			cor_primaria: "#FB923C",
			cor_secundaria: "#14B8A6",
			cor_fundo: "#0C0A09",
			cor_texto: "#FAFAF9",
		},
	},
	{
		id: "dark-emerald-night",
		nome: "Emerald Night",
		descricao: "Restaurantes Orgânicos",
		tipo: "dark",
		cores: {
			cor_primaria: "#4ADE80",
			cor_secundaria: "#FBBF24",
			cor_fundo: "#052E16",
			cor_texto: "#ECFDF5",
		},
	},
	{
		id: "dark-royal-burgundy",
		nome: "Royal Burgundy",
		descricao: "Steakhouses e Wine Bars",
		tipo: "dark",
		cores: {
			cor_primaria: "#F87171",
			cor_secundaria: "#FCD34D",
			cor_fundo: "#1C0909",
			cor_texto: "#FEF2F2",
		},
	},
	{
		id: "dark-neon-purple",
		nome: "Neon Purple",
		descricao: "Delivery Jovem e Trendy",
		tipo: "dark",
		cores: {
			cor_primaria: "#A855F7",
			cor_secundaria: "#F472B6",
			cor_fundo: "#0F0A1A",
			cor_texto: "#FAF5FF",
		},
	},
];

// Estado das paletas
const paletaTipo = ref<"light" | "dark">("dark");
const paletaSelecionada = ref<string | null>(null);

/**
 * Paletas filtradas pelo tipo selecionado
 */
const paletasFiltradas = computed(() => {
	return PALETAS_PREDEFINIDAS.filter((p) => p.tipo === paletaTipo.value);
});

/**
 * Aplica uma paleta ao formulário
 */
const aplicarPaleta = (paleta: PaletaCores) => {
	paletaSelecionada.value = paleta.id;

	// Aplica as cores da paleta
	setFieldValue("cor_primaria", paleta.cores.cor_primaria);
	setFieldValue("cor_fundo", paleta.cores.cor_fundo);
	setFieldValue("cor_texto", paleta.cores.cor_texto);

	// Cor secundária só é aplicada no modo avançado
	// No modo simples, ela é gerada automaticamente pelo sistema
	if (modoAvancado.value) {
		setFieldValue("cor_secundaria", paleta.cores.cor_secundaria);
	} else {
		// FIX: Limpa valor residual para garantir cálculo automático
		setFieldValue("cor_secundaria", undefined);
	}
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
														borderRadius: values.estilo_botoes === 'rounded' ? '99px' : '8px',
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
														borderRadius: values.estilo_botoes === 'rounded' ? '99px' : '8px',
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
											borderRadius: values.estilo_botoes === 'rounded' ? '99px' : '8px',
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
														borderRadius: values.estilo_botoes === 'rounded' ? '50%' : '8px',
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
														borderRadius: values.estilo_botoes === 'rounded' ? '50%' : '8px',
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
														borderRadius: values.estilo_botoes === 'rounded' ? '50%' : '8px',
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
						<!-- 🎨 Modo de Personalização -->
						<section
							class="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 rounded-xl p-4 border border-primary/20"
						>
							<div class="flex items-start justify-between gap-4">
								<div class="flex-1 space-y-1">
									<div class="flex items-center gap-2">
										<Icon
											:name="modoAvancado ? 'lucide:settings-2' : 'lucide:zap'"
											class="w-4 h-4 text-primary"
										/>
										<h4
											class="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider"
										>
											{{ modoAvancado ? "Modo Avançado" : "Modo Simples" }}
										</h4>
									</div>
									<p class="text-[10px] text-gray-600 dark:text-gray-400 leading-relaxed">
										<template v-if="!modoAvancado">
											Cores automáticas baseadas no fundo. Perfeito para começar rápido com um
											resultado profissional.
										</template>
										<template v-else>
											Controle total sobre todas as cores. Personalize cada detalhe da sua
											identidade visual.
										</template>
									</p>
								</div>
								<UiSwitch :model-value="modoAvancado" @update:model-value="toggleModo" />
							</div>
						</section>

						<!-- 🎨 Paletas Predefinidas -->
						<section class="space-y-4">
							<div class="flex items-center gap-2 mb-2">
								<div
									class="w-1 h-4 bg-gradient-to-b from-pink-500 to-purple-600 rounded-full"
								></div>
								<h4
									class="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider"
								>
									Paletas Prontas
								</h4>
								<span
									class="ml-auto text-[9px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full"
								>
									Clique para aplicar
								</span>
							</div>

							<p class="text-[10px] text-gray-500 dark:text-gray-400 -mt-2 mb-3">
								Escolha um tema pronto ou personalize as cores individualmente abaixo.
							</p>

							<!-- Tabs Light/Dark -->
							<div class="flex gap-2 mb-3">
								<button
									type="button"
									class="flex-1 py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2"
									:class="
										paletaTipo === 'light'
											? 'bg-white text-gray-800 shadow-md border border-gray-200'
											: 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
									"
									@click="paletaTipo = 'light'"
								>
									<Icon name="lucide:sun" class="w-3.5 h-3.5" />
									Temas Claros
								</button>
								<button
									type="button"
									class="flex-1 py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2"
									:class="
										paletaTipo === 'dark'
											? 'bg-gray-900 text-white shadow-md border border-gray-700'
											: 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
									"
									@click="paletaTipo = 'dark'"
								>
									<Icon name="lucide:moon" class="w-3.5 h-3.5" />
									Temas Escuros
								</button>
							</div>

							<!-- Grid de Paletas -->
							<div class="grid grid-cols-2 gap-3">
								<button
									v-for="paleta in paletasFiltradas"
									:key="paleta.id"
									type="button"
									class="group relative p-3 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
									:class="
										paletaSelecionada === paleta.id
											? 'border-primary shadow-lg shadow-primary/20'
											: 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
									"
									:style="{ backgroundColor: paleta.cores.cor_fundo }"
									@click="aplicarPaleta(paleta)"
								>
									<!-- Layout: Textos à esquerda, cores à direita -->
									<div class="flex items-center justify-between gap-3">
										<!-- Nome e Descrição -->
										<div class="flex-1 min-w-0 text-left">
											<h5
												class="text-sm font-bold truncate"
												:style="{ color: paleta.cores.cor_texto }"
											>
												{{ paleta.nome }}
											</h5>
											<p
												class="text-xs truncate opacity-60"
												:style="{ color: paleta.cores.cor_texto }"
											>
												{{ paleta.descricao }}
											</p>
										</div>
										<!-- Preview das cores -->
										<div class="flex items-center gap-1.5 shrink-0">
											<div
												class="w-5 h-5 rounded-full shadow-sm border border-white/20"
												:style="{ backgroundColor: paleta.cores.cor_primaria }"
												title="Primária"
											></div>
											<div
												class="w-5 h-5 rounded-full shadow-sm border border-white/20"
												:style="{ backgroundColor: paleta.cores.cor_secundaria }"
												title="Secundária"
											></div>
											<div
												class="w-5 h-5 rounded-full shadow-sm border border-black/10"
												:style="{ backgroundColor: paleta.cores.cor_texto }"
												title="Texto"
											></div>
										</div>
									</div>

									<!-- Indicador de seleção -->
									<div
										v-if="paletaSelecionada === paleta.id"
										class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-md"
									>
										<Icon name="lucide:check" class="w-3 h-3 text-white" />
									</div>
								</button>
							</div>
						</section>

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
									<UiColorPicker
										:model-value="values.cor_primaria || ''"
										placeholder="#3B82F6"
										@update:model-value="(v) => setFieldValue('cor_primaria', String(v))"
									/>
								</div>

								<!-- Cor Secundária (APENAS MODO AVANÇADO) -->
								<div v-if="modoAvancado" class="space-y-2">
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
									<UiColorPicker
										:model-value="values.cor_secundaria || ''"
										placeholder="#10B981"
										@update:model-value="(v) => setFieldValue('cor_secundaria', String(v))"
									/>
									<p class="text-[9px] text-gray-500 dark:text-gray-400 px-1">
										Define cards, badges e elementos de UI
									</p>
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
									<UiColorPicker
										:model-value="values.cor_fundo || ''"
										placeholder="#FFFFFF"
										@update:model-value="(v) => setFieldValue('cor_fundo', String(v))"
									/>
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
									<UiColorPicker
										:model-value="values.cor_texto || ''"
										placeholder="#1F2937"
										@update:model-value="(v) => setFieldValue('cor_texto', String(v))"
									/>
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
									<UiColorPicker
										:model-value="values.cor_sucesso || ''"
										@update:model-value="(v) => setFieldValue('cor_sucesso', String(v))"
									/>
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
									<UiColorPicker
										:model-value="values.cor_erro || ''"
										@update:model-value="(v) => setFieldValue('cor_erro', String(v))"
									/>
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
									<UiColorPicker
										:model-value="values.cor_aviso || ''"
										@update:model-value="(v) => setFieldValue('cor_aviso', String(v))"
									/>
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
								<div class="col-span-2 grid grid-cols-2 gap-4 p-3 rounded-xl">
									<div class="col-span-2 flex justify-between items-center mb-2">
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
										<UiColorPicker
											:model-value="values.gradiente_promo_inicio || ''"
											@update:model-value="
												(v) => setFieldValue('gradiente_promo_inicio', String(v))
											"
										/>
									</div>
									<!-- Fim -->
									<div>
										<label class="text-[9px] text-gray-400 block mb-1">Fim</label>
										<UiColorPicker
											:model-value="values.gradiente_promo_fim || ''"
											@update:model-value="(v) => setFieldValue('gradiente_promo_fim', String(v))"
										/>
									</div>
								</div>

								<!-- Destaque -->
								<div class="col-span-2 grid grid-cols-2 gap-4 p-3 rounded-xl">
									<div class="col-span-2 flex justify-between items-center mb-2">
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
										<UiColorPicker
											:model-value="values.gradiente_destaque_inicio || ''"
											@update:model-value="
												(v) => setFieldValue('gradiente_destaque_inicio', String(v))
											"
										/>
									</div>
									<!-- Fim -->
									<div>
										<label class="text-[9px] text-gray-400 block mb-1">Fim</label>
										<UiColorPicker
											:model-value="values.gradiente_destaque_fim || ''"
											@update:model-value="
												(v) => setFieldValue('gradiente_destaque_fim', String(v))
											"
										/>
									</div>
								</div>
							</div>
						</section>

						<!-- Estilo da Interface -->
						<section class="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
							<div class="flex items-center gap-2 mb-2">
								<div class="w-1 h-4 bg-primary rounded-full"></div>
								<h4
									class="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider"
								>
									Estilo da Interface
								</h4>
							</div>

							<!-- Estilo dos Botões -->
							<div class="space-y-2">
								<div class="flex flex-col gap-0.5 px-1">
									<label class="text-[10px] font-black text-gray-400 uppercase tracking-widest"
										>Formato dos Botões</label
									>
									<p class="text-[9px] text-gray-500">Arredondamento global da interface</p>
								</div>
								<div class="grid grid-cols-2 gap-3">
									<button
										v-for="estilo in estilosBotoes"
										:key="estilo.value"
										type="button"
										class="group relative flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-200"
										:class="[
											values.estilo_botoes === estilo.value
												? 'bg-gray-200 dark:bg-gray-700 shadow-xl shadow-primary/30 scale-[1.02]'
												: 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-[1.01]',
										]"
										@click="setFieldValue('estilo_botoes', estilo.value)"
									>
										<!-- Preview Visual do Botão -->
										<div
											class="w-16 h-8 transition-all duration-300"
											:style="{
												borderRadius: estilo.value === 'rounded' ? '99px' : '8px',
												backgroundColor:
													values.estilo_botoes === estilo.value
														? values.cor_primaria
														: values.cor_primaria + '40',
											}"
										></div>

										<div class="text-center">
											<span
												class="block text-[11px] font-bold uppercase tracking-tight transition-colors"
												:class="
													values.estilo_botoes === estilo.value
														? 'text-primary'
														: 'text-gray-700 dark:text-gray-300'
												"
												>{{ estilo.label }}</span
											>
											<span class="block text-[9px] text-gray-500 dark:text-gray-400 mt-0.5">
												{{
													estilo.value === "rounded"
														? "Bordas circulares e suaves"
														: "Bordas retas e precisas"
												}}
											</span>
										</div>

										<!-- Indicator -->
										<div
											v-if="values.estilo_botoes === estilo.value"
											class="absolute top-2 right-2"
										>
											<Icon
												name="lucide:check"
												class="w-5 h-5 text-primary animate-in zoom-in duration-200"
											/>
										</div>
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
						<div
							class="flex items-center justify-between gap-3 border-gray-100 dark:border-gray-800 w-full"
						>
							<UiButton
								type="button"
								variant="ghost"
								size="sm"
								:disabled="saving"
								@click="resetarTemaCompleto"
							>
								Restaurar Padrões
							</UiButton>

							<div class="flex items-center gap-2">
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
