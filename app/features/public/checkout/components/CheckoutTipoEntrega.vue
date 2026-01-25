<script setup lang="ts">
/**
 * 📌 CheckoutTipoEntrega
 *
 * Formulário de tipo de entrega (Etapa 2).
 * Permite escolher entre Delivery ou Retirada com agendamento inteligente OBRIGATÓRIO.
 */

import type { TipoEntrega, EnderecoEntrega } from "~/features/public/checkout/types/checkout";
import { formatCEP, parseCEP } from "~/lib/formatters/cep";
import { useCEP } from "../../../../composables/useCEP";
import { useHorarioFuncionamento } from "../composables/useHorarioFuncionamento";
import { useCalculoEntrega } from "../composables/useCalculoEntrega";

interface Props {
	tipoInicial?: TipoEntrega;
	enderecoInicial?: EnderecoEntrega;
	enderecoEstabelecimento?: string;
	slug: string;
}

const props = defineProps<Props>();

interface Emits {
	submit: [
		tipo: TipoEntrega,
		endereco?: EnderecoEntrega,
		agendamento?: { tipo: "agora" | "agendar"; horario?: string },
	];
	voltar: [];
}

const emit = defineEmits<Emits>();

/**
 * Integração com dados reais do estabelecimento
 */
const {
	estaAberto,
	proximoHorario,
	tempoPreparoMin,
	tempoPreparoMax,
	calcularProximaEntrega,
	obterHorariosDisponiveis,
} = useHorarioFuncionamento();

/**
 * Cálculo dinâmico de entrega
 */
const { calcularEntregaPorCEP, calcularEntregaPorBairro } = useCalculoEntrega();

/**
 * Tempo de entrega dinâmico (baseado no CEP/bairro)
 */
const tempoEntregaMin = ref(15);
const tempoEntregaMax = ref(30);
const taxaEntrega = ref(0);
const entregaDisponivel = ref(true);
const motivoIndisponivel = ref<string>();

/**
 * Tipo de entrega selecionado
 */
const tipoSelecionado = ref<TipoEntrega>(props.tipoInicial || "delivery");

/**
 * Tipo de agendamento (inteligente baseado no contexto)
 */
const tipoAgendamento = ref<"agora" | "agendar">("agora");

/**
 * Horário selecionado para agendamento
 */
const horarioSelecionado = ref<string>("");

/**
 * Tempos calculados
 */
const tempoTotalMin = computed(
	() => tempoPreparoMin.value + (tipoSelecionado.value === "delivery" ? tempoEntregaMin.value : 0),
);
const tempoTotalMax = computed(
	() => tempoPreparoMax.value + (tipoSelecionado.value === "delivery" ? tempoEntregaMin.value : 0),
);

/**
 * Lógica do agendamento inteligente contextual
 */
const agendamentoOptions = computed(() => {
	if (estaAberto.value) {
		return {
			showAgora: true,
			showAgendar: true,
			defaultOption: "agora" as const,
			agendar: {
				required: false,
				label: "Agendar para mais tarde",
				description: "Escolha quando quer receber",
			},
		};
	} else {
		return {
			showAgora: false,
			showAgendar: true,
			defaultOption: "agendar" as const,
			agendar: {
				required: true,
				label: "Agendar pedido",
				description: "Escolha quando quer receber - começaremos a preparar no horário ideal",
			},
		};
	}
});

// Definir opção padrão baseada no contexto
watch(
	agendamentoOptions,
	(options) => {
		tipoAgendamento.value = options.defaultOption;
	},
	{ immediate: true },
);
/**
 * Próxima entrega/retirada (contextual)
 */
const proximaEntregaRapida = computed(() => {
	return calcularProximaEntrega(tipoSelecionado.value === "delivery" ? tempoEntregaMin.value : 0);
});

/**
 * Datas formatadas
 */
const hoje = new Date();
const amanha = new Date(hoje);
amanha.setDate(amanha.getDate() + 1);

const dataHoje = computed(() => {
	return hoje
		.toLocaleDateString("pt-BR", {
			weekday: "long",
			day: "2-digit",
			month: "2-digit",
		})
		.replace("-feira", "");
});

const dataAmanha = computed(() => {
	return amanha
		.toLocaleDateString("pt-BR", {
			weekday: "long",
			day: "2-digit",
			month: "2-digit",
		})
		.replace("-feira", "");
});

/**
 * Horários disponíveis (integrados com dados reais)
 */
const horariosHoje = computed(() => {
	if (!estaAberto.value) return [];
	return obterHorariosDisponiveis(new Date());
});

const horariosAmanha = computed(() => {
	const amanha = new Date();
	amanha.setDate(amanha.getDate() + 1);
	return obterHorariosDisponiveis(amanha);
});

/**
 * Formulário de endereço
 */
const endereco = reactive<EnderecoEntrega>({
	cep: props.enderecoInicial?.cep || "",
	rua: props.enderecoInicial?.rua || "",
	numero: props.enderecoInicial?.numero || "",
	complemento: props.enderecoInicial?.complemento || "",
	bairro: props.enderecoInicial?.bairro || "",
	cidade: props.enderecoInicial?.cidade || "",
	estado: props.enderecoInicial?.estado || "",
	referencia: props.enderecoInicial?.referencia || "",
});

/**
 * Validação do formulário (inteligente baseada no contexto)
 */
const formValido = computed(() => {
	// Validação básica do tipo de entrega
	const tipoValido =
		tipoSelecionado.value === "retirada" ||
		(endereco.cep.trim() &&
			endereco.rua.trim() &&
			endereco.numero.trim() &&
			endereco.bairro.trim() &&
			endereco.cidade.trim() &&
			endereco.estado.trim() &&
			entregaDisponivel.value); // Verificar se entrega está disponível

	// Validação do agendamento (contextual)
	const agendamentoValido =
		tipoAgendamento.value === "agora" ||
		(tipoAgendamento.value === "agendar" && horarioSelecionado.value);

	return tipoValido && agendamentoValido;
});

/**
 * Submete o formulário
 */
const handleSubmit = () => {
	if (!formValido.value) return;

	// Dados de agendamento (contextual)
	const dadosAgendamento = {
		tipo: tipoAgendamento.value,
		horario: tipoAgendamento.value === "agendar" ? horarioSelecionado.value : undefined,
	};

	if (tipoSelecionado.value === "delivery") {
		emit(
			"submit",
			"delivery",
			{
				cep: endereco.cep.trim(),
				rua: endereco.rua.trim(),
				numero: endereco.numero.trim(),
				complemento: endereco.complemento?.trim() || undefined,
				bairro: endereco.bairro.trim(),
				cidade: endereco.cidade.trim(),
				estado: endereco.estado.trim(),
				referencia: endereco.referencia?.trim() || undefined,
			},
			dadosAgendamento,
		);
	} else {
		emit("submit", "retirada", undefined, dadosAgendamento);
	}
};

/**
 * CEP Lookup usando composable global
 */
const cepRef = ref(endereco.cep);
const { data: dadosCEP, error: erroCEP, loading: buscandoCEP } = useCEP(cepRef);

// Watch para preencher campos automaticamente quando CEP for encontrado
watch(dadosCEP, (novosDados) => {
	if (novosDados) {
		endereco.rua = novosDados.logradouro;
		endereco.bairro = novosDados.bairro;
		endereco.cidade = novosDados.localidade;
		endereco.estado = novosDados.uf;
	}
});

// Watch para recalcular entrega quando CEP mudar
watch(
	() => endereco.cep,
	async (novoCEP) => {
		if (novoCEP && novoCEP.length === 9 && tipoSelecionado.value === "delivery") {
			try {
				const calculo = await calcularEntregaPorCEP(novoCEP);
				tempoEntregaMin.value = calculo.tempoMin;
				tempoEntregaMax.value = calculo.tempoMax;
				taxaEntrega.value = calculo.taxa;
				entregaDisponivel.value = calculo.disponivel;
				motivoIndisponivel.value = calculo.motivo;
			} catch (error) {
				console.error("Erro ao calcular entrega:", error);
				// Manter valores padrão em caso de erro
				tempoEntregaMin.value = 15;
				tempoEntregaMax.value = 30;
				taxaEntrega.value = 0;
				entregaDisponivel.value = true;
				motivoIndisponivel.value = undefined;
			}
		}
	},
);

// Watch para recalcular entrega quando bairro mudar (taxa por localização)
watch(
	() => endereco.bairro,
	(novoBairro) => {
		if (novoBairro && tipoSelecionado.value === "delivery") {
			const calculo = calcularEntregaPorBairro(novoBairro);
			// Só atualizar se for taxa por localização para não sobrescrever cálculo por CEP
			if (!endereco.cep || endereco.cep.length < 9) {
				tempoEntregaMin.value = calculo.tempoMin;
				tempoEntregaMax.value = calculo.tempoMax;
				taxaEntrega.value = calculo.taxa;
				entregaDisponivel.value = calculo.disponivel;
				motivoIndisponivel.value = calculo.motivo;
			}
		}
	},
);

// Computed para verificar se CEP foi encontrado com sucesso
const cepEncontrado = computed(() => !!dadosCEP.value && !erroCEP.value);

/**
 * Formata CEP enquanto digita e atualiza ref para busca automática
 */
const formatarCEP = (event: Event) => {
	const input = event.target as HTMLInputElement;
	const apenasNumeros = parseCEP(input.value);
	endereco.cep = formatCEP(apenasNumeros);

	// Atualizar ref para trigger automático do useCEP
	cepRef.value = endereco.cep;
};
</script>

<template>
	<div class="space-y-6">
		<div>
			<h3 class="text-lg font-bold text-[var(--text-primary)] mb-2">🚚 Como você quer receber?</h3>
		</div>

		<form @submit.prevent="handleSubmit" class="space-y-6">
			<!-- Seleção de tipo -->
			<div class="grid grid-cols-2 gap-4">
				<!-- Delivery -->
				<button
					type="button"
					@click="tipoSelecionado = 'delivery'"
					class="p-4 rounded-lg border-2 transition-all text-center"
					:class="{
						'border-primary bg-primary/5': tipoSelecionado === 'delivery',
						'border-[var(--border-color)] hover:border-primary/50': tipoSelecionado !== 'delivery',
					}"
				>
					<Icon name="lucide:truck" class="w-8 h-8 mx-auto mb-2 text-primary" />
					<p class="font-bold text-[var(--text-primary)]">Delivery</p>
					<p class="text-xs text-[var(--text-muted)] mt-1">Entrega no endereço</p>
				</button>

				<!-- Retirada -->
				<button
					type="button"
					@click="tipoSelecionado = 'retirada'"
					class="p-4 rounded-lg border-2 transition-all text-center"
					:class="{
						'border-primary bg-primary/5': tipoSelecionado === 'retirada',
						'border-[var(--border-color)] hover:border-primary/50': tipoSelecionado !== 'retirada',
					}"
				>
					<Icon name="lucide:store" class="w-8 h-8 mx-auto mb-2 text-primary" />
					<p class="font-bold text-[var(--text-primary)]">Retirada</p>
					<p class="text-xs text-[var(--text-muted)] mt-1">Buscar no local</p>
				</button>
			</div>

			<!-- Formulário de endereço (apenas para delivery) -->
			<div v-if="tipoSelecionado === 'delivery'" class="space-y-4">
				<!-- CEP -->
				<div>
					<label for="cep" class="block text-sm font-medium text-[var(--text-primary)] mb-1">
						CEP <span class="text-red-500">*</span>
					</label>
					<div class="relative">
						<input
							id="cep"
							v-model="endereco.cep"
							type="text"
							required
							placeholder="00000-000"
							maxlength="9"
							@input="formatarCEP"
							:disabled="buscandoCEP"
							class="w-full px-4 py-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
							:class="{
								'border-red-500': erroCEP,
								'border-green-500': endereco.rua && !erroCEP,
							}"
						/>
						<!-- Loading indicator -->
						<div v-if="buscandoCEP" class="absolute right-3 top-1/2 transform -translate-y-1/2">
							<Icon name="lucide:loader-2" class="w-5 h-5 animate-spin text-primary" />
						</div>
						<!-- Success indicator -->
						<div
							v-else-if="cepEncontrado && !erroCEP"
							class="absolute right-3 top-1/2 transform -translate-y-1/2"
						>
							<Icon name="lucide:check" class="w-5 h-5 text-green-500" />
						</div>
					</div>
					<!-- Mensagem de erro -->
					<p v-if="erroCEP" class="text-sm text-red-500 mt-1">{{ erroCEP }}</p>
					<!-- Mensagem de sucesso -->
					<p v-else-if="cepEncontrado && !buscandoCEP" class="text-sm text-green-600 mt-1">
						✅ Endereço encontrado automaticamente
					</p>
				</div>

				<!-- Rua -->
				<div>
					<label for="rua" class="block text-sm font-medium text-[var(--text-primary)] mb-1">
						Rua <span class="text-red-500">*</span>
					</label>
					<input
						id="rua"
						v-model="endereco.rua"
						type="text"
						required
						placeholder="Nome da rua"
						class="w-full px-4 py-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary"
					/>
				</div>

				<!-- Número e Complemento -->
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="numero" class="block text-sm font-medium text-[var(--text-primary)] mb-1">
							Número <span class="text-red-500">*</span>
						</label>
						<input
							id="numero"
							v-model="endereco.numero"
							type="text"
							required
							placeholder="123"
							class="w-full px-4 py-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary"
						/>
					</div>
					<div>
						<label
							for="complemento"
							class="block text-sm font-medium text-[var(--text-primary)] mb-1"
						>
							Complemento
						</label>
						<input
							id="complemento"
							v-model="endereco.complemento"
							type="text"
							placeholder="Apto 101"
							class="w-full px-4 py-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary"
						/>
					</div>
				</div>

				<!-- Bairro -->
				<div>
					<label for="bairro" class="block text-sm font-medium text-[var(--text-primary)] mb-1">
						Bairro <span class="text-red-500">*</span>
					</label>
					<input
						id="bairro"
						v-model="endereco.bairro"
						type="text"
						required
						placeholder="Nome do bairro"
						class="w-full px-4 py-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary"
					/>
				</div>

				<!-- Cidade e Estado -->
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="cidade" class="block text-sm font-medium text-[var(--text-primary)] mb-1">
							Cidade <span class="text-red-500">*</span>
						</label>
						<input
							id="cidade"
							v-model="endereco.cidade"
							type="text"
							required
							placeholder="Sua cidade"
							class="w-full px-4 py-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary"
						/>
					</div>
					<div>
						<label for="estado" class="block text-sm font-medium text-[var(--text-primary)] mb-1">
							Estado <span class="text-red-500">*</span>
						</label>
						<input
							id="estado"
							v-model="endereco.estado"
							type="text"
							required
							placeholder="UF"
							maxlength="2"
							class="w-full px-4 py-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary uppercase"
						/>
					</div>
				</div>

				<!-- Ponto de referência -->
				<div>
					<label for="referencia" class="block text-sm font-medium text-[var(--text-primary)] mb-1">
						Ponto de referência
					</label>
					<input
						id="referencia"
						v-model="endereco.referencia"
						type="text"
						placeholder="Ex: Próximo ao mercado"
						class="w-full px-4 py-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary"
					/>
				</div>

				<!-- Informações de Entrega (quando disponível) -->
				<div
					v-if="endereco.cep && endereco.cep.length === 9"
					class="p-4 rounded-lg border"
					:class="[
						entregaDisponivel
							? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
							: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
					]"
				>
					<div v-if="entregaDisponivel" class="space-y-2">
						<h6 class="font-bold text-green-700 dark:text-green-300 flex items-center gap-2">
							<Icon name="lucide:check-circle" class="w-4 h-4" />
							Entrega Disponível
						</h6>
						<div class="grid grid-cols-2 gap-4 text-sm">
							<div>
								<span class="text-green-600 dark:text-green-400">⏱️ Tempo estimado:</span>
								<p class="font-bold text-green-700 dark:text-green-300">
									{{ tempoEntregaMin }}-{{ tempoEntregaMax }} min
								</p>
							</div>
							<div>
								<span class="text-green-600 dark:text-green-400">💰 Taxa de entrega:</span>
								<p class="font-bold text-green-700 dark:text-green-300">
									{{
										taxaEntrega > 0 ? `R$ ${taxaEntrega.toFixed(2).replace(".", ",")}` : "Grátis"
									}}
								</p>
							</div>
						</div>
					</div>
					<div v-else class="space-y-2">
						<h6 class="font-bold text-red-700 dark:text-red-300 flex items-center gap-2">
							<Icon name="lucide:x-circle" class="w-4 h-4" />
							Entrega Indisponível
						</h6>
						<p class="text-sm text-red-600 dark:text-red-400">
							{{ motivoIndisponivel || "Não entregamos nesta região" }}
						</p>
					</div>
				</div>

				<!-- Agendamento de Entrega (SEMPRE OBRIGATÓRIO) -->
				<div class="space-y-4">
					<h4 class="text-lg font-bold text-[var(--text-primary)]">🕐 Quando você quer receber?</h4>

					<!-- Status do estabelecimento -->
					<div
						class="p-4 rounded-lg border"
						:class="[
							estaAberto
								? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
								: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
						]"
					>
						<div class="flex items-center gap-2">
							<div
								:class="['w-3 h-3 rounded-full', estaAberto ? 'bg-green-500' : 'bg-red-500']"
							></div>
							<span
								class="font-bold"
								:class="[
									estaAberto
										? 'text-green-700 dark:text-green-300'
										: 'text-red-700 dark:text-red-300',
								]"
							>
								{{ estaAberto ? "ABERTO AGORA" : "FECHADO AGORA" }}
							</span>
							<span
								class="text-sm"
								:class="[
									estaAberto
										? 'text-green-600 dark:text-green-400'
										: 'text-red-600 dark:text-red-400',
								]"
							>
								{{ proximoHorario }}
							</span>
						</div>
						<p v-if="!estaAberto" class="text-sm mt-1" :class="'text-red-600 dark:text-red-400'">
							Você pode fazer seu pedido e agendar a entrega
						</p>
					</div>

					<!-- Explicação contextual do sistema inteligente -->
					<div
						v-if="!estaAberto"
						class="p-4 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
					>
						<h6 class="font-bold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
							<Icon name="lucide:brain" class="w-4 h-4" />
							Sistema Inteligente Ativo:
						</h6>
						<ul class="text-sm text-blue-600 dark:text-blue-400 space-y-1">
							<li>🏪 <strong>Estabelecimento fechado</strong> - apenas agendamento disponível</li>
							<li>
								⏰ <strong>Calculamos automaticamente</strong> quando começar a preparar seu pedido
							</li>
							<li>
								🎯 <strong>Seu pedido chegará</strong> exatamente no horário que você escolher
							</li>
							<li>📱 <strong>Você será notificado</strong> sobre cada etapa do preparo</li>
						</ul>
					</div>

					<!-- Opções de entrega (contextual baseada no status) -->
					<div class="space-y-3">
						<!-- Opção 1: Mais rápido (só aparece quando aberto) -->
						<div
							v-if="agendamentoOptions.showAgora"
							class="border rounded-lg p-4"
							:class="[
								tipoAgendamento === 'agora'
									? 'border-primary bg-primary/5'
									: 'border-[var(--border-color)] hover:border-primary/50',
							]"
						>
							<label class="flex items-start gap-3 cursor-pointer">
								<input
									type="radio"
									v-model="tipoAgendamento"
									value="agora"
									class="mt-1 text-primary focus:ring-primary"
								/>
								<div class="flex-1">
									<div class="flex items-center gap-2 mb-1">
										<Icon name="lucide:zap" class="w-5 h-5 text-primary" />
										<span class="font-bold text-[var(--text-primary)]">O MAIS RÁPIDO POSSÍVEL</span>
									</div>
									<div class="text-sm text-[var(--text-muted)]">
										<div class="space-y-1">
											<p>📦 Preparo: ~{{ tempoPreparoMin }}-{{ tempoPreparoMax }} min</p>
											<p>
												🚚
												{{ tipoSelecionado === "delivery" ? "Entrega" : "Pronto para retirada" }}:
												~{{ tipoSelecionado === "delivery" ? tempoEntregaMin : 0 }} min
											</p>
											<p class="font-medium text-[var(--text-primary)]">
												⏰ Seu pedido
												{{ tipoSelecionado === "delivery" ? "chegará" : "estará pronto" }} às:
												<strong>{{ proximaEntregaRapida }}</strong>
											</p>
										</div>
									</div>
								</div>
							</label>
						</div>

						<!-- Opção 2: Agendar horário específico (sempre disponível) -->
						<div
							v-if="agendamentoOptions.showAgendar"
							class="border rounded-lg p-4"
							:class="[
								tipoAgendamento === 'agendar'
									? 'border-primary bg-primary/5'
									: 'border-[var(--border-color)] hover:border-primary/50',
							]"
						>
							<label class="flex items-start gap-3 cursor-pointer">
								<input
									type="radio"
									v-model="tipoAgendamento"
									value="agendar"
									class="mt-1 text-primary focus:ring-primary"
								/>
								<div class="flex-1">
									<div class="flex items-center gap-2 mb-1">
										<Icon name="lucide:calendar-clock" class="w-5 h-5 text-primary" />
										<span class="font-bold text-[var(--text-primary)]">{{
											agendamentoOptions.agendar.label.toUpperCase()
										}}</span>
									</div>
									<p class="text-sm text-[var(--text-muted)]">
										{{ agendamentoOptions.agendar.description }}
									</p>
								</div>
							</label>
						</div>
					</div>

					<!-- Lista de horários (se agendar selecionado) -->
					<div v-if="tipoAgendamento === 'agendar'" class="space-y-4">
						<h5 class="font-bold text-[var(--text-primary)]">📋 Horários Disponíveis:</h5>

						<!-- Hoje -->
						<div v-if="horariosHoje.length > 0" class="space-y-2">
							<h6 class="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wide">
								🗓️ HOJE ({{ dataHoje }})
							</h6>
							<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
								<button
									v-for="horario in horariosHoje"
									:key="horario.value"
									type="button"
									@click="horarioSelecionado = horario.value"
									class="p-3 rounded-lg border text-left transition-all"
									:class="[
										horarioSelecionado === horario.value
											? 'border-primary bg-primary/10 text-primary'
											: 'border-[var(--border-color)] hover:border-primary/50 text-[var(--text-primary)]',
									]"
								>
									<div class="font-bold">{{ horario.display }}</div>
									<div class="text-xs opacity-75">
										<span v-if="horario.isProximoDisponivel" class="text-primary"
											>⚡ Mais cedo</span
										>
										<span v-else-if="horario.tempoRestante">Em {{ horario.tempoRestante }}</span>
									</div>
								</button>
							</div>
						</div>

						<!-- Amanhã -->
						<div v-if="horariosAmanha.length > 0" class="space-y-2">
							<h6 class="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wide">
								🗓️ AMANHÃ ({{ dataAmanha }})
							</h6>
							<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
								<button
									v-for="horario in horariosAmanha"
									:key="horario.value"
									type="button"
									@click="horarioSelecionado = horario.value"
									class="p-3 rounded-lg border text-left transition-all"
									:class="[
										horarioSelecionado === horario.value
											? 'border-primary bg-primary/10 text-primary'
											: 'border-[var(--border-color)] hover:border-primary/50 text-[var(--text-primary)]',
									]"
								>
									<div class="font-bold">{{ horario.display }}</div>
									<div class="text-xs opacity-75">{{ horario.diaSemana }}</div>
								</button>
							</div>
						</div>

						<!-- Explicação detalhada -->
						<div
							class="p-4 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
						>
							<h6 class="font-bold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
								<Icon name="lucide:info" class="w-4 h-4" />
								Como funciona o agendamento:
							</h6>
							<ul class="text-sm text-blue-600 dark:text-blue-400 space-y-1">
								<li>
									✅ <strong>Seu pedido será preparado</strong> para
									{{ tipoSelecionado === "delivery" ? "chegar" : "ficar pronto" }} no horário
									escolhido
								</li>
								<li>
									⏰ <strong>Começamos a preparar</strong> {{ tempoPreparoMin }} minutos antes
								</li>
								<li v-if="tipoSelecionado === 'delivery'">
									🚚 <strong>Saímos para entrega</strong> com tempo suficiente para chegar no
									horário
								</li>
								<li v-else>
									🏪 <strong>Seu pedido estará pronto</strong> para retirada no horário escolhido
								</li>
								<li>📱 <strong>Você receberá atualizações</strong> sobre o status do seu pedido</li>
							</ul>
						</div>
					</div>
				</div>
			</div>

			<!-- Endereço do estabelecimento (apenas para retirada) -->
			<div v-else class="space-y-4">
				<div class="p-4 rounded-lg bg-[var(--bg-muted)] border border-[var(--border-color)]">
					<p class="text-sm font-medium text-[var(--text-primary)] mb-2">
						📍 Endereço para retirada:
					</p>
					<p class="text-sm text-[var(--text-muted)]">
						{{ enderecoEstabelecimento || "Endereço não disponível" }}
					</p>
				</div>

				<!-- Agendamento de Retirada (SEMPRE OBRIGATÓRIO) -->
				<div class="space-y-4">
					<h4 class="text-lg font-bold text-[var(--text-primary)]">🕐 Quando você quer retirar?</h4>

					<!-- Status do estabelecimento -->
					<div
						class="p-4 rounded-lg border"
						:class="[
							estaAberto
								? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
								: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
						]"
					>
						<div class="flex items-center gap-2">
							<div
								:class="['w-3 h-3 rounded-full', estaAberto ? 'bg-green-500' : 'bg-red-500']"
							></div>
							<span
								class="font-bold"
								:class="[
									estaAberto
										? 'text-green-700 dark:text-green-300'
										: 'text-red-700 dark:text-red-300',
								]"
							>
								{{ estaAberto ? "ABERTO AGORA" : "FECHADO AGORA" }}
							</span>
							<span
								class="text-sm"
								:class="[
									estaAberto
										? 'text-green-600 dark:text-green-400'
										: 'text-red-600 dark:text-red-400',
								]"
							>
								{{ proximoHorario }}
							</span>
						</div>
						<p v-if="!estaAberto" class="text-sm mt-1" :class="'text-red-600 dark:text-red-400'">
							Você pode fazer seu pedido e agendar a retirada
						</p>
					</div>

					<!-- Explicação contextual do sistema inteligente -->
					<div
						v-if="!estaAberto"
						class="p-4 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
					>
						<h6 class="font-bold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
							<Icon name="lucide:brain" class="w-4 h-4" />
							Sistema Inteligente Ativo:
						</h6>
						<ul class="text-sm text-blue-600 dark:text-blue-400 space-y-1">
							<li>🏪 <strong>Estabelecimento fechado</strong> - apenas agendamento disponível</li>
							<li>
								⏰ <strong>Calculamos automaticamente</strong> quando começar a preparar seu pedido
							</li>
							<li>
								🎯 <strong>Seu pedido estará pronto</strong> exatamente no horário que você escolher
							</li>
							<li>📱 <strong>Você será notificado</strong> sobre cada etapa do preparo</li>
						</ul>
					</div>

					<!-- Opções de retirada (contextual baseada no status) -->
					<div class="space-y-3">
						<!-- Opção 1: Mais rápido (só aparece quando aberto) -->
						<div
							v-if="agendamentoOptions.showAgora"
							class="border rounded-lg p-4"
							:class="[
								tipoAgendamento === 'agora'
									? 'border-primary bg-primary/5'
									: 'border-[var(--border-color)] hover:border-primary/50',
							]"
						>
							<label class="flex items-start gap-3 cursor-pointer">
								<input
									type="radio"
									v-model="tipoAgendamento"
									value="agora"
									class="mt-1 text-primary focus:ring-primary"
								/>
								<div class="flex-1">
									<div class="flex items-center gap-2 mb-1">
										<Icon name="lucide:zap" class="w-5 h-5 text-primary" />
										<span class="font-bold text-[var(--text-primary)]">O MAIS RÁPIDO POSSÍVEL</span>
									</div>
									<div class="text-sm text-[var(--text-muted)]">
										<div class="space-y-1">
											<p>📦 Preparo: ~{{ tempoPreparoMin }}-{{ tempoPreparoMax }} min</p>
											<p class="font-medium text-[var(--text-primary)]">
												⏰ Seu pedido estará pronto às: <strong>{{ proximaEntregaRapida }}</strong>
											</p>
										</div>
									</div>
								</div>
							</label>
						</div>

						<!-- Opção 2: Agendar horário específico (sempre disponível) -->
						<div
							v-if="agendamentoOptions.showAgendar"
							class="border rounded-lg p-4"
							:class="[
								tipoAgendamento === 'agendar'
									? 'border-primary bg-primary/5'
									: 'border-[var(--border-color)] hover:border-primary/50',
							]"
						>
							<label class="flex items-start gap-3 cursor-pointer">
								<input
									type="radio"
									v-model="tipoAgendamento"
									value="agendar"
									class="mt-1 text-primary focus:ring-primary"
								/>
								<div class="flex-1">
									<div class="flex items-center gap-2 mb-1">
										<Icon name="lucide:calendar-clock" class="w-5 h-5 text-primary" />
										<span class="font-bold text-[var(--text-primary)]">{{
											agendamentoOptions.agendar.label.toUpperCase()
										}}</span>
									</div>
									<p class="text-sm text-[var(--text-muted)]">
										{{ agendamentoOptions.agendar.description }}
									</p>
								</div>
							</label>
						</div>
					</div>

					<!-- Lista de horários para retirada -->
					<div v-if="tipoAgendamento === 'agendar'" class="space-y-4">
						<h5 class="font-bold text-[var(--text-primary)]">📋 Horários Disponíveis:</h5>

						<!-- Hoje -->
						<div v-if="horariosHoje.length > 0" class="space-y-2">
							<h6 class="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wide">
								🗓️ HOJE ({{ dataHoje }})
							</h6>
							<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
								<button
									v-for="horario in horariosHoje"
									:key="horario.value"
									type="button"
									@click="horarioSelecionado = horario.value"
									class="p-3 rounded-lg border text-left transition-all"
									:class="[
										horarioSelecionado === horario.value
											? 'border-primary bg-primary/10 text-primary'
											: 'border-[var(--border-color)] hover:border-primary/50 text-[var(--text-primary)]',
									]"
								>
									<div class="font-bold">{{ horario.display }}</div>
									<div class="text-xs opacity-75">
										<span v-if="horario.isProximoDisponivel" class="text-primary"
											>⚡ Mais cedo</span
										>
										<span v-else-if="horario.tempoRestante">Em {{ horario.tempoRestante }}</span>
									</div>
								</button>
							</div>
						</div>

						<!-- Amanhã -->
						<div v-if="horariosAmanha.length > 0" class="space-y-2">
							<h6 class="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wide">
								🗓️ AMANHÃ ({{ dataAmanha }})
							</h6>
							<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
								<button
									v-for="horario in horariosAmanha"
									:key="horario.value"
									type="button"
									@click="horarioSelecionado = horario.value"
									class="p-3 rounded-lg border text-left transition-all"
									:class="[
										horarioSelecionado === horario.value
											? 'border-primary bg-primary/10 text-primary'
											: 'border-[var(--border-color)] hover:border-primary/50 text-[var(--text-primary)]',
									]"
								>
									<div class="font-bold">{{ horario.display }}</div>
									<div class="text-xs opacity-75">{{ horario.diaSemana }}</div>
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Botões -->
			<div class="flex gap-4">
				<button
					type="button"
					@click="emit('voltar')"
					class="flex-1 py-3 px-6 rounded-lg font-bold text-[var(--text-primary)] bg-[var(--bg-muted)] hover:bg-[var(--bg-muted)]/80 transition-colors"
				>
					Voltar
				</button>
				<button
					type="submit"
					:disabled="!formValido"
					class="flex-1 py-3 px-6 rounded-lg font-bold text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					Continuar
				</button>
			</div>
		</form>
	</div>
</template>
