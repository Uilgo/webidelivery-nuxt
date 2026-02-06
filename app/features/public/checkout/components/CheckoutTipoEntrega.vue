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
	calcularProximaEntrega,
	obterHorariosDisponiveis,
	horariosFuncionamento, // ✅ Adicionado para validação de dias
} = useHorarioFuncionamento();

/**
 * Cálculo dinâmico de entrega
 */
const { calcularEntregaPorCEP, calcularEntregaPorBairro, validarCidade } = useCalculoEntrega();

/**
 * Store do estabelecimento para buscar taxas por bairro
 */
const estabelecimentoStore = useEstabelecimentoStore();

/**
 * Taxas por bairro (apenas bairros ativos)
 */
const taxasPorBairro = computed(() => {
	const config = estabelecimentoStore.estabelecimento?.config_geral;
	if (!config?.taxas_por_localizacao) return [];

	return (
		config.taxas_por_localizacao as Array<{
			id: string;
			nome: string;
			cidade?: string;
			taxa_valor: number;
			tempo_min: number;
			tempo_max: number;
			status: "ativado" | "desativado";
		}>
	)
		.filter((taxa) => taxa.status === "ativado")
		.sort((a, b) => a.nome.localeCompare(b.nome));
});

/**
 * Taxa padrão para outros bairros
 */
const taxaPadraoOutros = computed(() => {
	const config = estabelecimentoStore.estabelecimento?.config_geral;
	return (config?.taxa_padrao_outros_bairros as number | undefined) || 0;
});

/**
 * Opções do Combobox de bairros (com cidade filtrada)
 */
const comboboxBairrosOptions = computed(() => {
	if (!endereco.cidade) return [];

	// Filtrar bairros pela cidade atual
	const bairrosDaCidade = taxasPorBairro.value.filter((taxa) => {
		if (!taxa.cidade) return true; // Bairros sem cidade definida aparecem sempre
		return taxa.cidade.toLowerCase() === endereco.cidade.toLowerCase();
	});

	return bairrosDaCidade.map((taxa) => ({
		value: taxa.nome,
		label: taxa.nome,
		badge: `R$ ${taxa.taxa_valor.toFixed(2).replace(".", ",")}`,
		description: `${taxa.tempo_min}-${taxa.tempo_max} min`,
		icon: "lucide:map-pin",
	}));
});

/**
 * Estado de feedback do Combobox de bairro
 * ✅ CORRIGIDO: Validar null/undefined antes de usar .trim()
 */
const feedbackBairroState = computed<"success" | "warning" | "error" | null>(() => {
	// ✅ Validar se valores existem antes de usar .trim()
	const bairroValido =
		endereco.bairro && typeof endereco.bairro === "string" && endereco.bairro.trim();
	const cidadeValida =
		endereco.cidade && typeof endereco.cidade === "string" && endereco.cidade.trim();

	if (!bairroValido || !cidadeValida) return null;

	// Verificar se entrega está disponível
	if (!entregaDisponivel.value) return "error";

	// Verificar se encontrou match exato
	const bairroMatch = taxasPorBairro.value.find(
		(taxa) =>
			taxa.nome.toLowerCase() === endereco.bairro.toLowerCase() &&
			(!taxa.cidade || taxa.cidade.toLowerCase() === endereco.cidade.toLowerCase()),
	);

	if (bairroMatch) return "success"; // Match perfeito

	// Se tem taxa padrão, é warning (vai usar fallback)
	if (taxaPadraoOutros.value > 0) return "warning";

	// Sem match e sem taxa padrão = erro
	return "error";
});

/**
 * Mensagem de feedback do Combobox de bairro
 * ✅ CORRIGIDO: Validar null/undefined antes de usar .trim()
 */
const feedbackBairroMessage = computed(() => {
	// ✅ Validar se valores existem antes de usar .trim()
	const bairroValido =
		endereco.bairro && typeof endereco.bairro === "string" && endereco.bairro.trim();
	const cidadeValida =
		endereco.cidade && typeof endereco.cidade === "string" && endereco.cidade.trim();

	if (!bairroValido || !cidadeValida) {
		return "Digite o bairro para calcular a taxa de entrega";
	}

	if (!entregaDisponivel.value) {
		return motivoIndisponivel.value || "Não entregamos nesta região";
	}

	const bairroMatch = taxasPorBairro.value.find(
		(taxa) =>
			taxa.nome.toLowerCase() === endereco.bairro.toLowerCase() &&
			(!taxa.cidade || taxa.cidade.toLowerCase() === endereco.cidade.toLowerCase()),
	);

	if (bairroMatch) {
		return `✅ Taxa de R$ ${bairroMatch.taxa_valor.toFixed(2).replace(".", ",")} - Entrega em ${bairroMatch.tempo_min}-${bairroMatch.tempo_max} min`;
	}

	if (taxaPadraoOutros.value > 0) {
		return `⚠️ Bairro não cadastrado - Taxa padrão de R$ ${taxaPadraoOutros.value.toFixed(2).replace(".", ",")} será aplicada para bairros não listados`;
	}

	return "❌ Bairro não atendido - Entre em contato via WhatsApp";
});

/**
 * Handler para mudança de bairro no Combobox (seleção do dropdown)
 * ✅ CORRIGIDO: Validar valores vazios e null
 */
const handleBairroChange = (value: string | number | null) => {
	// ✅ Validar se valor é vazio ou null
	if (!value || value === "" || !endereco.cidade) {
		// Resetar valores quando limpar
		entregaDisponivel.value = true;
		motivoIndisponivel.value = undefined;
		return;
	}

	// Converter para string
	const bairroValue = String(value).trim();
	if (!bairroValue) {
		// String vazia após trim
		entregaDisponivel.value = true;
		motivoIndisponivel.value = undefined;
		return;
	}

	// Recalcular entrega quando bairro mudar
	const calculo = calcularEntregaPorBairro(bairroValue, endereco.cidade);
	tempoEntregaMin.value = calculo.tempoMin;
	tempoEntregaMax.value = calculo.tempoMax;
	taxaEntrega.value = calculo.taxa;
	entregaDisponivel.value = calculo.disponivel;
	motivoIndisponivel.value = calculo.motivo;
	tipoTaxaEntrega.value = calculo.tipoTaxa || "taxa_localizacao";
};

/**
 * Handler para input de bairro (digitação livre ou seleção)
 * ✅ CORRIGIDO: Validar valores vazios e null
 */
const handleBairroInput = (value: string | number | null) => {
	// ✅ Validar se valor é vazio ou null
	if (!value || value === "" || !endereco.cidade) {
		// Resetar valores quando limpar
		entregaDisponivel.value = true;
		motivoIndisponivel.value = undefined;
		return;
	}

	// Converter para string
	const bairroValue = String(value).trim();
	if (!bairroValue) {
		// String vazia após trim
		entregaDisponivel.value = true;
		motivoIndisponivel.value = undefined;
		return;
	}

	// Recalcular entrega
	const calculo = calcularEntregaPorBairro(bairroValue, endereco.cidade);
	tempoEntregaMin.value = calculo.tempoMin;
	tempoEntregaMax.value = calculo.tempoMax;
	taxaEntrega.value = calculo.taxa;
	entregaDisponivel.value = calculo.disponivel;
	motivoIndisponivel.value = calculo.motivo;
	tipoTaxaEntrega.value = calculo.tipoTaxa || "taxa_localizacao";
};

/**
 * Tipo de taxa de entrega (para label dinâmico)
 */
const tipoTaxaEntrega = ref<string>("taxa_unica");

/**
 * Label dinâmico para taxa de entrega
 */
const labelTaxaEntrega = computed(() => {
	switch (tipoTaxaEntrega.value) {
		case "taxa_unica":
			return "Taxa fixa de entrega";
		case "taxa_localizacao":
			return "Taxa de entrega (seu bairro)";
		case "sem_taxa":
			return "Entrega";
		default:
			return "Taxa de entrega";
	}
});

/**
 * Tempo de entrega dinâmico (baseado no CEP/bairro)
 * ✅ CORRIGIDO: Inicializar com valores globais do estabelecimento
 */
const tempoEntregaMin = ref(
	(estabelecimentoStore.estabelecimento?.config_geral?.tempo_entrega_min as number) || 30,
);
const tempoEntregaMax = ref(
	(estabelecimentoStore.estabelecimento?.config_geral?.tempo_entrega_max as number) || 60,
);
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
 * Estado do accordion de taxas por região
 */
const taxasRegiaoExpandido = ref(false);

/**
 * Tempos calculados
 * ✅ CORRIGIDO: Mostrar apenas tempo de entrega (já inclui preparo calculado pelo admin)
 */
const tempoTotalMin = computed(() => tempoEntregaMin.value);
const tempoTotalMax = computed(() => tempoEntregaMax.value);

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

/**
 * Próxima entrega/retirada (contextual)
 * ✅ CORRIGIDO: Calcular horário atual + tempo min/max
 */
const proximaEntregaMin = computed(() => {
	const agora = new Date();
	agora.setMinutes(agora.getMinutes() + tempoTotalMin.value);
	return agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
});

const proximaEntregaMax = computed(() => {
	const agora = new Date();
	agora.setMinutes(agora.getMinutes() + tempoTotalMax.value);
	return agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
});

/**
 * Validar se horário de entrega ultrapassa horário de fechamento
 */
const validarHorarioEntrega = computed(() => {
	const estabelecimento = estabelecimentoStore.estabelecimento;

	// ✅ Validar se estabelecimento e config_geral existem
	if (!estabelecimento || !estabelecimento.config_geral) {
		return { valido: true, mensagem: "" };
	}

	const configGeral = estabelecimento.config_geral as Record<string, unknown>;
	const horarios = configGeral.horarios as
		| Array<{
				dia_semana: string;
				aberto: boolean;
				periodos: Array<{
					horario_abertura: string;
					horario_fechamento: string;
				}>;
		  }>
		| undefined;

	if (!horarios || horarios.length === 0) {
		return { valido: true, mensagem: "" };
	}

	const agora = new Date();
	const diaSemana = agora.getDay(); // 0 = Domingo, 1 = Segunda, etc.
	const diasMap = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
	const diaAtual = diasMap[diaSemana];

	// ✅ Validar se diaAtual é válido
	if (!diaAtual) {
		return { valido: true, mensagem: "" };
	}

	// Encontrar horário do dia atual
	const horarioDia = horarios.find((h) => h.dia_semana === diaAtual);

	// Se não tem horário configurado ou está fechado
	if (!horarioDia || !horarioDia.aberto) {
		return {
			valido: false,
			mensagem: "Estabelecimento fechado hoje. Agende para outro dia.",
		};
	}

	// Pegar horário de fechamento
	const periodos = horarioDia.periodos;
	if (!periodos || periodos.length === 0) {
		return { valido: true, mensagem: "" };
	}

	// Pegar o último período (horário de fechamento)
	const ultimoPeriodo = periodos[periodos.length - 1];

	// ✅ Validar se ultimoPeriodo existe
	if (!ultimoPeriodo || !ultimoPeriodo.horario_fechamento) {
		return { valido: true, mensagem: "" };
	}

	const [horaFim, minFim] = ultimoPeriodo.horario_fechamento.split(":").map(Number);

	// ✅ Validar se horaFim e minFim são números válidos
	if (horaFim === undefined || minFim === undefined || isNaN(horaFim) || isNaN(minFim)) {
		return { valido: true, mensagem: "" };
	}

	// Criar data do horário de fechamento
	const horarioFechamento = new Date();
	horarioFechamento.setHours(horaFim, minFim, 0, 0);

	// Calcular horário máximo de entrega
	const horarioEntregaMax = new Date();
	horarioEntregaMax.setMinutes(horarioEntregaMax.getMinutes() + tempoTotalMax.value);

	// Verificar se ultrapassa
	if (horarioEntregaMax > horarioFechamento) {
		const horarioFechamentoStr = horarioFechamento.toLocaleTimeString("pt-BR", {
			hour: "2-digit",
			minute: "2-digit",
		});
		return {
			valido: false,
			mensagem: `⚠️ Seu pedido pode não chegar antes do fechamento (${horarioFechamentoStr}). Recomendamos agendar para outro horário.`,
		};
	}

	return { valido: true, mensagem: "" };
});

// ✅ Definir opção padrão baseada no contexto
watch(
	agendamentoOptions,
	(options) => {
		tipoAgendamento.value = options.defaultOption;
	},
	{ immediate: true },
);

// ✅ Forçar agendamento quando horário inválido
watch(
	validarHorarioEntrega,
	(validacao) => {
		if (!validacao.valido && tipoAgendamento.value === "agora") {
			tipoAgendamento.value = "agendar";
		}
	},
	{ immediate: true },
);

/**
 * ✅ NOVO: Seletor de data para agendamento (qualquer data futura)
 */
const dataSelecionada = ref<string>(""); // ISO date string (YYYY-MM-DD)

/**
 * ✅ NOVO: Data mínima (hoje)
 */
const dataMinima = computed(() => {
	const hoje = new Date();
	return hoje.toISOString().split("T")[0]; // YYYY-MM-DD
});

/**
 * ✅ NOVO: Verificar se a data selecionada é um dia que o estabelecimento abre
 */
const diaEstaAberto = computed(() => {
	if (!dataSelecionada.value) return { aberto: false, mensagem: "" };

	const data = new Date(dataSelecionada.value + "T00:00:00");
	const diaSemana = data.getDay();
	const diasMap = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
	const diaAtual = diasMap[diaSemana];

	// ✅ Validar se diaAtual é válido
	if (!diaAtual) {
		return { aberto: false, mensagem: "Dia inválido" };
	}

	const horarios = horariosFuncionamento.value;
	if (!horarios) {
		return { aberto: false, mensagem: "Horários não configurados" };
	}

	const horarioDia = horarios[diaAtual];
	if (!horarioDia?.ativo || !horarioDia?.periodos || horarioDia.periodos.length === 0) {
		const diasSemanaLabel = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
		return {
			aberto: false,
			mensagem: `Estabelecimento fechado às ${diasSemanaLabel[diaSemana]}s. Escolha outro dia.`,
		};
	}

	return { aberto: true, mensagem: "" };
});

/**
 * ✅ NOVO: Horários disponíveis para a data selecionada
 */
const horariosDisponiveisData = computed(() => {
	if (!dataSelecionada.value || !diaEstaAberto.value.aberto) return [];

	const data = new Date(dataSelecionada.value + "T00:00:00");

	// Passar os tempos de entrega (min e max)
	return obterHorariosDisponiveis(data, tempoEntregaMin.value, tempoEntregaMax.value);
});

/**
 * ✅ NOVO: Label formatado da data selecionada
 */
const dataFormatada = computed(() => {
	if (!dataSelecionada.value) return "";

	const data = new Date(dataSelecionada.value + "T00:00:00");
	const hoje = new Date();
	hoje.setHours(0, 0, 0, 0);
	const amanha = new Date(hoje);
	amanha.setDate(amanha.getDate() + 1);

	// Verificar se é hoje ou amanhã
	if (data.getTime() === hoje.getTime()) {
		return "Hoje";
	} else if (data.getTime() === amanha.getTime()) {
		return "Amanhã";
	}

	// Formatar data completa
	const diasSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
	const diaSemana = diasSemana[data.getDay()];
	const dataStr = data.toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});

	return `${diaSemana}, ${dataStr}`;
});

// ✅ Limpar horário selecionado quando mudar a data
watch(dataSelecionada, () => {
	horarioSelecionado.value = "";
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
		(endereco.cep &&
			endereco.cep.trim() &&
			endereco.rua &&
			endereco.rua.trim() &&
			endereco.numero &&
			endereco.numero.trim() &&
			endereco.bairro &&
			endereco.bairro.trim() &&
			endereco.cidade &&
			endereco.cidade.trim() &&
			endereco.estado &&
			endereco.estado.trim() &&
			entregaDisponivel.value); // Verificar se entrega está disponível

	// Validação do agendamento (contextual)
	const agendamentoValido =
		tipoAgendamento.value === "agora" ||
		(tipoAgendamento.value === "agendar" && horarioSelecionado.value);

	// ✅ NOVO: Validação de horário de funcionamento
	const horarioValido = tipoAgendamento.value === "agendar" || validarHorarioEntrega.value.valido;

	return tipoValido && agendamentoValido && horarioValido;
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
				cep: endereco.cep?.trim() || "",
				rua: endereco.rua?.trim() || "",
				numero: endereco.numero?.trim() || "",
				complemento: endereco.complemento?.trim() || undefined,
				bairro: endereco.bairro?.trim() || "",
				cidade: endereco.cidade?.trim() || "",
				estado: endereco.estado?.trim() || "",
				referencia: endereco.referencia?.trim() || undefined,
				taxa_entrega: taxaEntrega.value,
				tempo_min: tempoEntregaMin.value,
				tempo_max: tempoEntregaMax.value,
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
		// ✅ Preencher rua (se retornou)
		if (novosDados.logradouro) {
			endereco.rua = novosDados.logradouro;
		}

		// ✅ Preencher bairro APENAS se CEP retornou (não sobrescrever se vazio)
		if (novosDados.bairro) {
			endereco.bairro = novosDados.bairro;
		}

		// ✅ Sempre preencher cidade e estado
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
				const calculo = await calcularEntregaPorCEP(novoCEP, endereco.cidade, endereco.bairro);
				tempoEntregaMin.value = calculo.tempoMin;
				tempoEntregaMax.value = calculo.tempoMax;
				taxaEntrega.value = calculo.taxa;
				entregaDisponivel.value = calculo.disponivel;
				motivoIndisponivel.value = calculo.motivo;
				tipoTaxaEntrega.value = calculo.tipoTaxa || "taxa_unica";
			} catch (error) {
				console.error("Erro ao calcular entrega:", error);
				// ✅ CORRIGIDO: Manter valores globais em caso de erro
				tempoEntregaMin.value =
					(estabelecimentoStore.estabelecimento?.config_geral?.tempo_entrega_min as number) || 30;
				tempoEntregaMax.value =
					(estabelecimentoStore.estabelecimento?.config_geral?.tempo_entrega_max as number) || 60;
				taxaEntrega.value = 0;
				entregaDisponivel.value = true;
				motivoIndisponivel.value = undefined;
				tipoTaxaEntrega.value = "taxa_unica";
			}
		}
	},
);

// Watch para validar cidade quando mudar
watch(
	() => endereco.cidade,
	(novaCidade) => {
		if (novaCidade && tipoSelecionado.value === "delivery") {
			const cidadeValida = validarCidade(novaCidade);
			if (!cidadeValida) {
				entregaDisponivel.value = false;
				motivoIndisponivel.value = `Não entregamos em ${novaCidade}`;
			} else {
				// ✅ Desbloquear quando cidade é válida
				entregaDisponivel.value = true;
				motivoIndisponivel.value = undefined;
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
		<form @submit.prevent="handleSubmit" class="space-y-6">
			<!-- Seleção de tipo -->
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
				<!-- Delivery -->
				<button
					type="button"
					@click="tipoSelecionado = 'delivery'"
					class="relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 text-left group"
					:class="{
						'border-[var(--cardapio-primary)] bg-[var(--cardapio-primary)]/5 shadow-md':
							tipoSelecionado === 'delivery',
						'border-[var(--cardapio-border)] hover:border-[var(--cardapio-primary)]/50 hover:bg-[var(--cardapio-muted)]':
							tipoSelecionado !== 'delivery',
					}"
				>
					<!-- Ícone à esquerda -->
					<div
						class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
						:class="
							tipoSelecionado === 'delivery'
								? 'bg-[var(--cardapio-primary)] text-white'
								: 'bg-[var(--cardapio-muted)] text-[var(--cardapio-text-muted)] group-hover:text-[var(--cardapio-primary)]'
						"
					>
						<Icon name="lucide:truck" class="w-5 h-5" />
					</div>

					<!-- Textos à direita -->
					<div class="flex-1 min-w-0">
						<p class="font-bold text-sm text-[var(--cardapio-text)]">Delivery</p>
						<p class="text-xs text-[var(--cardapio-text-muted)]">Receba em casa</p>
					</div>

					<!-- Check indicator -->
					<div
						v-if="tipoSelecionado === 'delivery'"
						class="flex-shrink-0 text-[var(--cardapio-primary)]"
					>
						<Icon name="lucide:check-circle-2" class="w-5 h-5" />
					</div>
				</button>

				<!-- Retirada -->
				<button
					type="button"
					@click="tipoSelecionado = 'retirada'"
					class="relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 text-left group"
					:class="{
						'border-[var(--cardapio-primary)] bg-[var(--cardapio-primary)]/5 shadow-md':
							tipoSelecionado === 'retirada',
						'border-[var(--cardapio-border)] hover:border-[var(--cardapio-primary)]/50 hover:bg-[var(--cardapio-muted)]':
							tipoSelecionado !== 'retirada',
					}"
				>
					<!-- Ícone à esquerda -->
					<div
						class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
						:class="
							tipoSelecionado === 'retirada'
								? 'bg-[var(--cardapio-primary)] text-white'
								: 'bg-[var(--cardapio-muted)] text-[var(--cardapio-text-muted)] group-hover:text-[var(--cardapio-primary)]'
						"
					>
						<Icon name="lucide:store" class="w-5 h-5" />
					</div>

					<!-- Textos à direita -->
					<div class="flex-1 min-w-0">
						<p class="font-bold text-sm text-[var(--cardapio-text)]">Retirada</p>
						<p class="text-xs text-[var(--cardapio-text-muted)]">Busque no local</p>
					</div>

					<!-- Check indicator -->
					<div
						v-if="tipoSelecionado === 'retirada'"
						class="flex-shrink-0 text-[var(--cardapio-primary)]"
					>
						<Icon name="lucide:check-circle-2" class="w-5 h-5" />
					</div>
				</button>
			</div>

			<!-- Formulário de endereço (apenas para delivery) -->
			<div v-if="tipoSelecionado === 'delivery'" class="space-y-4">
				<!-- CEP -->
				<div>
					<label for="cep" class="block text-sm font-medium text-[var(--cardapio-text)] mb-1">
						CEP <span class="text-red-500">*</span>
					</label>
					<div class="relative">
						<UiInput
							id="cep"
							v-model="endereco.cep"
							type="text"
							required
							placeholder="00000-000"
							maxlength="9"
							:disabled="buscandoCEP"
							:class="{
								'border-red-500': erroCEP,
								'border-green-500': endereco.rua && !erroCEP,
							}"
							@input="formatarCEP"
						/>
						<!-- Loading indicator -->
						<div v-if="buscandoCEP" class="absolute right-3 top-1/2 transform -translate-y-1/2">
							<Icon
								name="lucide:loader-2"
								class="w-5 h-5 animate-spin text-[var(--cardapio-primary)]"
							/>
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
					<label for="rua" class="block text-sm font-medium text-[var(--cardapio-text)] mb-1">
						Rua <span class="text-red-500">*</span>
					</label>
					<UiInput id="rua" v-model="endereco.rua" type="text" required placeholder="Nome da rua" />
				</div>

				<!-- Número e Complemento -->
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="numero" class="block text-sm font-medium text-[var(--cardapio-text)] mb-1">
							Número <span class="text-red-500">*</span>
						</label>
						<UiInput id="numero" v-model="endereco.numero" type="text" required placeholder="123" />
					</div>
					<div>
						<label
							for="complemento"
							class="block text-sm font-medium text-[var(--cardapio-text)] mb-1"
						>
							Complemento
						</label>
						<UiInput
							id="complemento"
							v-model="endereco.complemento"
							type="text"
							placeholder="Apto 101"
						/>
					</div>
				</div>

				<!-- Bairro com Combobox Inteligente -->
				<div>
					<label for="bairro" class="block text-sm font-medium text-[var(--cardapio-text)] mb-1">
						Bairro <span class="text-red-500">*</span>
					</label>

					<!-- Combobox: Permite digitação livre + sugestões -->
					<UiCombobox
						id="bairro"
						v-model="endereco.bairro"
						:options="comboboxBairrosOptions"
						placeholder="Digite ou selecione o bairro"
						:loading="buscandoCEP"
						:clearable="true"
						:open-on-focus="true"
						:feedback-state="feedbackBairroState"
						:feedback-message="feedbackBairroMessage"
						icon="lucide:map-pin"
						autocomplete="off-bairro"
						required
						empty-text="Nenhum bairro cadastrado"
						:empty-description="
							taxaPadraoOutros > 0
								? `Digite o nome do seu bairro - Taxa padrão de R$ ${taxaPadraoOutros.toFixed(2).replace('.', ',')} será aplicada`
								: 'Entre em contato para verificar disponibilidade'
						"
						no-results-text="Bairro não encontrado na lista"
						:no-results-description="
							taxaPadraoOutros > 0
								? `Você pode digitar qualquer bairro - Taxa padrão de R$ ${taxaPadraoOutros.toFixed(2).replace('.', ',')} será aplicada`
								: 'Digite o nome correto do seu bairro'
						"
						@change="handleBairroChange"
						@update:model-value="handleBairroInput"
					/>
				</div>

				<!-- Cidade e Estado -->
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="cidade" class="block text-sm font-medium text-[var(--cardapio-text)] mb-1">
							Cidade <span class="text-red-500">*</span>
						</label>
						<UiInput
							id="cidade"
							v-model="endereco.cidade"
							type="text"
							required
							placeholder="Sua cidade"
						/>
					</div>
					<div>
						<label for="estado" class="block text-sm font-medium text-[var(--cardapio-text)] mb-1">
							Estado <span class="text-red-500">*</span>
						</label>
						<UiInput
							id="estado"
							v-model="endereco.estado"
							type="text"
							required
							placeholder="UF"
							maxlength="2"
							class="uppercase"
						/>
					</div>
				</div>

				<!-- Ponto de referência -->
				<div>
					<label
						for="referencia"
						class="block text-sm font-medium text-[var(--cardapio-text)] mb-1"
					>
						Ponto de referência
					</label>
					<UiInput
						id="referencia"
						v-model="endereco.referencia"
						type="text"
						placeholder="Ex: Próximo ao mercado"
					/>
				</div>

				<!-- Informações de Entrega (quando disponível) -->
				<!-- ✅ CORRIGIDO: Só mostrar após bairro ser preenchido quando necessário -->
				<!-- Bairro obrigatório quando: taxa por localização OU tem bairros cadastrados -->
				<div
					v-if="
						endereco.cep &&
						endereco.cep.length === 9 &&
						(tipoTaxaEntrega === 'taxa_localizacao' || taxasPorBairro.length > 0
							? endereco.bairro && endereco.bairro.trim()
							: true)
					"
					class="p-4 rounded-lg border"
					:class="[
						entregaDisponivel && !motivoIndisponivel
							? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
							: entregaDisponivel && motivoIndisponivel
								? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'
								: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
					]"
				>
					<div v-if="entregaDisponivel" class="space-y-3">
						<!-- Header com feedback visual -->
						<h6
							class="font-bold flex items-center gap-2"
							:class="[
								motivoIndisponivel
									? 'text-amber-700 dark:text-amber-300'
									: 'text-green-700 dark:text-green-300',
							]"
						>
							<Icon
								:name="motivoIndisponivel ? 'lucide:alert-triangle' : 'lucide:check-circle'"
								class="w-4 h-4"
							/>
							{{ motivoIndisponivel ? "Taxa Padrão Aplicada" : "Entrega Disponível" }}
						</h6>

						<!-- Mensagem de aviso (se taxa padrão) -->
						<div
							v-if="motivoIndisponivel"
							class="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800"
						>
							<p class="text-sm text-amber-700 dark:text-amber-300 font-medium mb-2">
								ℹ️ Seu bairro não está cadastrado no sistema
							</p>
							<p class="text-xs text-amber-600 dark:text-amber-400">
								Como seu bairro não está na lista de regiões cadastradas, será aplicada a taxa
								padrão de
								<strong>R$ {{ taxaPadraoOutros.toFixed(2).replace(".", ",") }}</strong> para bairros
								não listados.
							</p>
						</div>

						<div class="space-y-2 text-sm">
							<!-- Tempo total estimado para entrega -->
							<div class="flex justify-between items-center">
								<span
									class="font-medium"
									:class="[
										motivoIndisponivel
											? 'text-amber-600 dark:text-amber-400'
											: 'text-green-600 dark:text-green-400',
									]"
									>⏱️ Tempo total estimado para entrega:</span
								>
								<p
									class="font-bold text-base"
									:class="[
										motivoIndisponivel
											? 'text-amber-700 dark:text-amber-300'
											: 'text-green-700 dark:text-green-300',
									]"
								>
									{{ tempoTotalMin }}-{{ tempoTotalMax }} min
								</p>
							</div>
							<!-- Taxa de entrega -->
							<div class="flex justify-between items-center">
								<span
									:class="[
										motivoIndisponivel
											? 'text-amber-600 dark:text-amber-400'
											: 'text-green-600 dark:text-green-400',
									]"
									>💰 {{ labelTaxaEntrega }}:</span
								>
								<p
									class="font-bold"
									:class="[
										motivoIndisponivel
											? 'text-amber-700 dark:text-amber-300'
											: 'text-green-700 dark:text-green-300',
									]"
								>
									{{
										taxaEntrega > 0 ? `R$ ${taxaEntrega.toFixed(2).replace(".", ",")}` : "Grátis"
									}}
								</p>
							</div>
						</div>
					</div>
					<div v-else class="space-y-3">
						<h6 class="font-bold text-red-700 dark:text-red-300 flex items-center gap-2">
							<Icon name="lucide:x-circle" class="w-4 h-4" />
							Entrega Indisponível
						</h6>
						<p class="text-sm text-red-600 dark:text-red-400 font-medium">
							{{ motivoIndisponivel || "Não entregamos nesta região" }}
						</p>
						<!-- Botão WhatsApp -->
						<a
							:href="`https://wa.me/${estabelecimentoStore.estabelecimento?.whatsapp?.replace(/\D/g, '')}`"
							target="_blank"
							class="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
						>
							<Icon name="logos:whatsapp-icon" class="w-4 h-4" />
							Falar no WhatsApp
						</a>
					</div>
				</div>

				<!-- Lista de Bairros com Taxas (Taxa por Localização) - COLAPSÁVEL -->
				<div
					v-if="tipoTaxaEntrega === 'taxa_localizacao' && taxasPorBairro.length > 0"
					class="rounded-lg border bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 overflow-hidden"
				>
					<!-- Header clicável -->
					<button
						type="button"
						@click="taxasRegiaoExpandido = !taxasRegiaoExpandido"
						class="w-full p-4 flex items-center justify-between hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
					>
						<h6 class="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2">
							<Icon name="lucide:map-pin" class="w-4 h-4" />
							Taxas de Entrega por Região
						</h6>
						<Icon
							name="lucide:chevron-down"
							class="w-5 h-5 text-blue-700 dark:text-blue-300 transition-transform duration-200"
							:class="{ 'rotate-180': taxasRegiaoExpandido }"
						/>
					</button>

					<!-- Conteúdo colapsável -->
					<div
						v-show="taxasRegiaoExpandido"
						class="px-4 pb-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200"
					>
						<!-- Regiões cadastradas -->
						<div class="space-y-2">
							<div
								v-for="taxa in taxasPorBairro"
								:key="taxa.id"
								class="flex justify-between items-center p-2 rounded bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-900"
							>
								<span class="text-sm font-medium text-blue-700 dark:text-blue-300 capitalize">
									{{ taxa.nome }}
								</span>
								<span class="text-sm font-bold text-blue-900 dark:text-blue-100">
									R$ {{ taxa.taxa_valor.toFixed(2).replace(".", ",") }}
								</span>
							</div>
						</div>

						<!-- Taxa padrão -->
						<div
							v-if="taxaPadraoOutros > 0"
							class="p-2 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
						>
							<div class="flex justify-between items-center">
								<span class="text-sm font-medium text-amber-700 dark:text-amber-300">
									Outros bairros
								</span>
								<span class="text-sm font-bold text-amber-900 dark:text-amber-100">
									R$ {{ taxaPadraoOutros.toFixed(2).replace(".", ",") }}
								</span>
							</div>
						</div>

						<!-- Instruções -->
						<div class="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
							<p class="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">
								ℹ️ Como funciona:
							</p>
							<ul class="text-xs text-blue-600 dark:text-blue-400 space-y-1">
								<li>1️⃣ Selecione a <strong>região mais próxima</strong> para calcular a taxa</li>
								<li>2️⃣ Digite o <strong>nome exato do seu bairro</strong> para o entregador</li>
								<li v-if="taxaPadraoOutros > 0">
									3️⃣ Se seu bairro não estiver listado, selecione "Outros bairros"
								</li>
							</ul>
						</div>
					</div>
				</div>

				<!-- Agendamento de Entrega (SEMPRE OBRIGATÓRIO) -->
				<div class="space-y-4">
					<h4 class="text-lg font-bold text-[var(--cardapio-text)]">
						🕐 Quando você quer receber?
					</h4>

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
						<!-- Opção 1: Mais rápido (só aparece quando aberto E horário válido) -->
						<div
							v-if="agendamentoOptions.showAgora"
							class="border rounded-lg p-4"
							:class="[
								tipoAgendamento === 'agora'
									? 'border-[var(--cardapio-primary)] bg-[var(--cardapio-primary)]/5'
									: 'border-[var(--cardapio-border)] hover:border-[var(--cardapio-primary)]/50',
								!validarHorarioEntrega.valido ? 'opacity-60' : '',
							]"
						>
							<label
								class="flex items-start gap-3"
								:class="validarHorarioEntrega.valido ? 'cursor-pointer' : 'cursor-not-allowed'"
							>
								<input
									type="radio"
									v-model="tipoAgendamento"
									value="agora"
									:disabled="!validarHorarioEntrega.valido"
									class="mt-1 text-[var(--cardapio-primary)] focus:ring-[var(--cardapio-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
								/>
								<div class="flex-1">
									<div class="flex items-center gap-2 mb-1">
										<Icon name="lucide:zap" class="w-5 h-5 text-[var(--cardapio-primary)]" />
										<span class="font-bold text-[var(--cardapio-text)]"
											>O MAIS RÁPIDO POSSÍVEL</span
										>
										<span
											v-if="!validarHorarioEntrega.valido"
											class="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
										>
											Indisponível
										</span>
									</div>
									<div class="text-sm text-[var(--cardapio-text-muted)]">
										<div class="space-y-1">
											<p>
												🚚
												{{
													tipoSelecionado === "delivery" ? "Tempo de entrega" : "Tempo de preparo"
												}}: ~{{ tempoTotalMin }}-{{ tempoTotalMax }} min
											</p>
											<p class="font-medium text-[var(--cardapio-text)]">
												⏰ Seu pedido
												{{
													tipoSelecionado === "delivery"
														? "deverá chegar entre"
														: "deverá estar pronto entre"
												}}:
												<strong>{{ proximaEntregaMin }} e {{ proximaEntregaMax }}</strong>
											</p>
											<!-- Aviso de horário de fechamento -->
											<div
												v-if="!validarHorarioEntrega.valido"
												class="mt-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
											>
												<p class="text-xs text-red-700 dark:text-red-300 font-medium">
													{{ validarHorarioEntrega.mensagem }}
												</p>
												<p class="text-xs text-red-600 dark:text-red-400 mt-1">
													Por favor, agende seu pedido para outro horário.
												</p>
											</div>
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
									? 'border-[var(--cardapio-primary)] bg-[var(--cardapio-primary)]/5'
									: 'border-[var(--cardapio-border)] hover:border-[var(--cardapio-primary)]/50',
							]"
						>
							<label class="flex items-start gap-3 cursor-pointer">
								<input
									type="radio"
									v-model="tipoAgendamento"
									value="agendar"
									class="mt-1 text-[var(--cardapio-primary)] focus:ring-[var(--cardapio-primary)]"
								/>
								<div class="flex-1">
									<div class="flex items-center gap-2 mb-1">
										<Icon
											name="lucide:calendar-clock"
											class="w-5 h-5 text-[var(--cardapio-primary)]"
										/>
										<span class="font-bold text-[var(--cardapio-text)]">{{
											agendamentoOptions.agendar.label.toUpperCase()
										}}</span>
									</div>
									<p class="text-sm text-[var(--cardapio-text-muted)]">
										{{ agendamentoOptions.agendar.description }}
									</p>
								</div>
							</label>
						</div>
					</div>

					<!-- Seleção de data e horário para agendamento -->
					<div v-if="tipoAgendamento === 'agendar'" class="space-y-4">
						<!-- Seletor de Data -->
						<div class="space-y-2">
							<label
								class="text-sm font-medium text-[var(--cardapio-text)] flex items-center gap-2"
							>
								<Icon name="lucide:calendar" class="w-4 h-4" />
								Escolha o Dia:
							</label>
							<UiDatePicker
								v-model="dataSelecionada"
								placeholder="Selecione uma data"
								:min-date="dataMinima"
								size="lg"
								class="w-full"
							/>
						</div>

						<!-- Aviso se dia está fechado -->
						<div
							v-if="dataSelecionada && !diaEstaAberto.aberto"
							class="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
						>
							<p
								class="text-sm text-amber-700 dark:text-amber-300 font-medium flex items-center gap-2"
							>
								<Icon name="lucide:alert-triangle" class="w-4 h-4" />
								{{ diaEstaAberto.mensagem }}
							</p>
						</div>

						<!-- Seletor de Horário (só aparece se dia está aberto) -->
						<div v-if="dataSelecionada && diaEstaAberto.aberto" class="space-y-2">
							<label
								class="text-sm font-medium text-[var(--cardapio-text)] flex items-center gap-2"
							>
								<Icon name="lucide:clock" class="w-4 h-4" />
								Escolha o Horário para {{ dataFormatada }}:
							</label>

							<!-- Mostrar horários disponíveis -->
							<div v-if="horariosDisponiveisData.length > 0">
								<UiSelectMenu
									v-model="horarioSelecionado"
									:options="
										horariosDisponiveisData.map((h) => ({
											value: h.value,
											label: h.display,
											description: h.isProximoDisponivel
												? '⚡ Mais cedo'
												: h.tempoRestante
													? `Em ${h.tempoRestante}`
													: '',
										}))
									"
									placeholder="Selecione um horário"
									size="lg"
									class="w-full"
								/>
							</div>

							<!-- Sem horários disponíveis -->
							<div
								v-else
								class="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800"
							>
								<p class="text-sm text-gray-600 dark:text-gray-400 text-center">
									Nenhum horário disponível para esta data
								</p>
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
								<li>⏰ <strong>Começamos a preparar</strong> {{ tempoTotalMin }} minutos antes</li>
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
				<div
					class="p-4 rounded-lg bg-[var(--cardapio-muted)] border border-[var(--cardapio-border)]"
				>
					<p class="text-sm font-medium text-[var(--cardapio-text)] mb-2">
						📍 Endereço para retirada:
					</p>
					<p class="text-sm text-[var(--cardapio-text-muted)]">
						{{ enderecoEstabelecimento || "Endereço não disponível" }}
					</p>
				</div>

				<!-- Agendamento de Retirada (SEMPRE OBRIGATÓRIO) -->
				<div class="space-y-4">
					<h4 class="text-lg font-bold text-[var(--cardapio-text)]">
						🕐 Quando você quer retirar?
					</h4>

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
						<!-- Opção 1: Mais rápido (só aparece quando aberto E horário válido) -->
						<div
							v-if="agendamentoOptions.showAgora"
							class="border rounded-lg p-4"
							:class="[
								tipoAgendamento === 'agora'
									? 'border-[var(--cardapio-primary)] bg-[var(--cardapio-primary)]/5'
									: 'border-[var(--cardapio-border)] hover:border-[var(--cardapio-primary)]/50',
								!validarHorarioEntrega.valido ? 'opacity-60' : '',
							]"
						>
							<label
								class="flex items-start gap-3"
								:class="validarHorarioEntrega.valido ? 'cursor-pointer' : 'cursor-not-allowed'"
							>
								<input
									type="radio"
									v-model="tipoAgendamento"
									value="agora"
									:disabled="!validarHorarioEntrega.valido"
									class="mt-1 text-[var(--cardapio-primary)] focus:ring-[var(--cardapio-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
								/>
								<div class="flex-1">
									<div class="flex items-center gap-2 mb-1">
										<Icon name="lucide:zap" class="w-5 h-5 text-[var(--cardapio-primary)]" />
										<span class="font-bold text-[var(--cardapio-text)]"
											>O MAIS RÁPIDO POSSÍVEL</span
										>
										<span
											v-if="!validarHorarioEntrega.valido"
											class="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
										>
											Indisponível
										</span>
									</div>
									<div class="text-sm text-[var(--cardapio-text-muted)]">
										<div class="space-y-1">
											<p>📦 Tempo de preparo: ~{{ tempoTotalMin }}-{{ tempoTotalMax }} min</p>
											<p class="font-medium text-[var(--cardapio-text)]">
												⏰ Seu pedido deverá estar pronto entre:
												<strong>{{ proximaEntregaMin }} e {{ proximaEntregaMax }}</strong>
											</p>
											<!-- Aviso de horário de fechamento -->
											<div
												v-if="!validarHorarioEntrega.valido"
												class="mt-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
											>
												<p class="text-xs text-red-700 dark:text-red-300 font-medium">
													{{ validarHorarioEntrega.mensagem }}
												</p>
												<p class="text-xs text-red-600 dark:text-red-400 mt-1">
													Por favor, agende seu pedido para outro horário.
												</p>
											</div>
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
									? 'border-[var(--cardapio-primary)] bg-[var(--cardapio-primary)]/5'
									: 'border-[var(--cardapio-border)] hover:border-[var(--cardapio-primary)]/50',
							]"
						>
							<label class="flex items-start gap-3 cursor-pointer">
								<input
									type="radio"
									v-model="tipoAgendamento"
									value="agendar"
									class="mt-1 text-[var(--cardapio-primary)] focus:ring-[var(--cardapio-primary)]"
								/>
								<div class="flex-1">
									<div class="flex items-center gap-2 mb-1">
										<Icon
											name="lucide:calendar-clock"
											class="w-5 h-5 text-[var(--cardapio-primary)]"
										/>
										<span class="font-bold text-[var(--cardapio-text)]">{{
											agendamentoOptions.agendar.label.toUpperCase()
										}}</span>
									</div>
									<p class="text-sm text-[var(--cardapio-text-muted)]">
										{{ agendamentoOptions.agendar.description }}
									</p>
								</div>
							</label>
						</div>
					</div>

					<!-- Seleção de data e horário para agendamento (Retirada) -->
					<div v-if="tipoAgendamento === 'agendar'" class="space-y-4">
						<!-- Seletor de Data -->
						<div class="space-y-2">
							<label
								class="text-sm font-medium text-[var(--cardapio-text)] flex items-center gap-2"
							>
								<Icon name="lucide:calendar" class="w-4 h-4" />
								Escolha o Dia:
							</label>
							<UiDatePicker
								v-model="dataSelecionada"
								placeholder="Selecione uma data"
								:min-date="dataMinima"
								size="lg"
								class="w-full"
							/>
						</div>

						<!-- Aviso se dia está fechado -->
						<div
							v-if="dataSelecionada && !diaEstaAberto.aberto"
							class="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
						>
							<p
								class="text-sm text-amber-700 dark:text-amber-300 font-medium flex items-center gap-2"
							>
								<Icon name="lucide:alert-triangle" class="w-4 h-4" />
								{{ diaEstaAberto.mensagem }}
							</p>
						</div>

						<!-- Seletor de Horário (só aparece se dia está aberto) -->
						<div v-if="dataSelecionada && diaEstaAberto.aberto" class="space-y-2">
							<label
								class="text-sm font-medium text-[var(--cardapio-text)] flex items-center gap-2"
							>
								<Icon name="lucide:clock" class="w-4 h-4" />
								Escolha o Horário para {{ dataFormatada }}:
							</label>

							<!-- Mostrar horários disponíveis -->
							<div v-if="horariosDisponiveisData.length > 0">
								<UiSelectMenu
									v-model="horarioSelecionado"
									:options="
										horariosDisponiveisData.map((h) => ({
											value: h.value,
											label: h.display,
											description: h.isProximoDisponivel
												? '⚡ Mais cedo'
												: h.tempoRestante
													? `Em ${h.tempoRestante}`
													: '',
										}))
									"
									placeholder="Selecione um horário"
									size="lg"
									class="w-full"
								/>
							</div>

							<!-- Sem horários disponíveis -->
							<div
								v-else
								class="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800"
							>
								<p class="text-sm text-gray-600 dark:text-gray-400 text-center">
									Nenhum horário disponível para esta data
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Botões -->
			<div class="flex gap-4">
				<UiButton
					type="button"
					variant="ghost"
					size="lg"
					class="flex-1 font-bold text-[var(--cardapio-text-muted)] border border-[var(--cardapio-border)] hover:border-[var(--cardapio-primary)] hover:text-[var(--cardapio-primary)] hover:bg-transparent"
					@click="emit('voltar')"
				>
					Voltar
				</UiButton>
				<UiButton
					type="submit"
					:disabled="!formValido"
					variant="solid"
					size="lg"
					class="flex-1 font-bold bg-[var(--cardapio-primary)] text-white shadow-[var(--cardapio-button-shadow)] hover:shadow-[var(--cardapio-button-shadow-hover)] hover:bg-[var(--cardapio-primary)]"
				>
					Continuar
					<Icon name="lucide:arrow-right" class="w-5 h-5 ml-2" />
				</UiButton>
			</div>
		</form>
	</div>
</template>
