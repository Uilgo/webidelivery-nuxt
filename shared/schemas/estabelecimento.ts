/**
 * 📌 Schemas de Validação - Estabelecimento
 *
 * Schemas Zod para validação de onboarding e configurações do estabelecimento.
 */

import { z } from "zod";
import { VALIDATION_PATTERNS, VALIDATION_MESSAGES } from "../constants/validation";
import { ESTADOS_BRASIL } from "../constants/estabelecimento";

// ========================================
// SCHEMAS DE SLUG
// ========================================

/**
 * Schema para slug do estabelecimento
 */
export const slugSchema = z
	.string()
	.min(3, "Slug deve ter pelo menos 3 caracteres")
	.max(50, "Slug deve ter no máximo 50 caracteres")
	.regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens")
	.regex(/^[a-z]/, "Slug deve começar com uma letra")
	.regex(/[^-]$/, "Slug não pode terminar com hífen")
	.refine((slug) => !slug.includes("--"), {
		message: "Slug não pode conter hífens consecutivos",
	})
	.transform((slug) => slug.toLowerCase().trim());

// ========================================
// SCHEMAS DE TELEFONE
// ========================================

/**
 * Schema para WhatsApp (DDI + DDD + Número)
 */
const whatsappSchema = z
	.string()
	.min(1, VALIDATION_MESSAGES.WHATSAPP_REQUIRED)
	.transform((tel) => tel.replace(/\D/g, "")) // PRIMEIRO: remover formatação
	.refine((tel) => VALIDATION_PATTERNS.WHATSAPP.test(tel), VALIDATION_MESSAGES.WHATSAPP_LENGTH);

// ========================================
// SCHEMAS DE CEP E ENDEREÇO
// ========================================

/**
 * Schema para CEP
 */
const cepSchema = z
	.string()
	.min(1, "CEP é obrigatório")
	.transform((cep) => cep.replace(/\D/g, "")) // Remove formatação
	.refine((cep) => cep.length === 8, "CEP deve ter 8 dígitos")
	.refine((cep) => /^\d{8}$/.test(cep), "CEP deve conter apenas números");

/**
 * Schema para estado (UF) - obrigatório e deve ser válido
 */
const estadoSchema = z
	.string()
	.min(1, "Estado é obrigatório")
	.refine((val) => ESTADOS_BRASIL.includes(val as (typeof ESTADOS_BRASIL)[number]), {
		message: "Selecione um estado válido",
	});

// ========================================
// ONBOARDING - ETAPA 1: INFORMAÇÕES BÁSICAS
// ========================================

/**
 * Schema para informações básicas do estabelecimento
 */
export const onboardingInfoBasicaSchema = z.object({
	nome: z
		.string()
		.min(1, "Nome é obrigatório")
		.min(3, "Nome deve ter pelo menos 3 caracteres")
		.max(100, "Nome deve ter no máximo 100 caracteres")
		.transform((nome) => nome.trim()),
	slug: slugSchema,
	descricao: z
		.string()
		.max(500, "Descrição deve ter no máximo 500 caracteres")
		.optional()
		.or(z.literal("")),
});

// ========================================
// ONBOARDING - ETAPA 2: ENDEREÇO
// ========================================

/**
 * Schema para endereço do estabelecimento
 */
export const onboardingEnderecoSchema = z.object({
	endereco_rua: z
		.string()
		.min(1, "Rua é obrigatória")
		.max(200, "Rua deve ter no máximo 200 caracteres")
		.transform((rua) => rua.trim()),
	endereco_numero: z
		.string()
		.min(1, "Número é obrigatório")
		.max(20, "Número deve ter no máximo 20 caracteres")
		.transform((numero) => numero.trim()),
	endereco_complemento: z
		.string()
		.max(100, "Complemento deve ter no máximo 100 caracteres")
		.optional()
		.or(z.literal("")),
	endereco_bairro: z
		.string()
		.min(1, "Bairro é obrigatório")
		.max(100, "Bairro deve ter no máximo 100 caracteres")
		.transform((bairro) => bairro.trim()),
	endereco_cidade: z
		.string()
		.min(1, "Cidade é obrigatória")
		.max(100, "Cidade deve ter no máximo 100 caracteres")
		.transform((cidade) => cidade.trim()),
	endereco_estado: estadoSchema,
	endereco_cep: cepSchema,
	endereco_referencia: z
		.string()
		.max(200, "Referência deve ter no máximo 200 caracteres")
		.optional()
		.or(z.literal("")),
	cidades_atendidas: z
		.array(z.string().min(1, "Nome da cidade é obrigatório"))
		.min(1, "Adicione pelo menos 1 cidade atendida"),
});

// ========================================
// ONBOARDING - ETAPA 3: CONTATO
// ========================================

/**
 * Schema para contato do estabelecimento
 */
export const onboardingContatoSchema = z.object({
	whatsapp: whatsappSchema,
});

// ========================================
// ONBOARDING - ETAPA 4: HORÁRIOS
// ========================================

/**
 * Schema para período de funcionamento individual
 */
const periodoFuncionamentoSchema = z.object({
	id: z.string().optional(),
	horario_abertura: z
		.string()
		.regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Horário de abertura inválido (formato HH:MM)"),
	horario_fechamento: z
		.string()
		.regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Horário de fechamento inválido (formato HH:MM)"),
});

/**
 * Schema para horário de funcionamento com suporte a múltiplos períodos
 */
const horarioFuncionamentoSchema = z.object({
	dia_semana: z.enum(["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"], {
		message: "Dia da semana inválido",
	}),
	aberto: z.boolean(),
	periodos: z.array(periodoFuncionamentoSchema).optional(),
	// Campos legados para compatibilidade (opcionais)
	horario_abertura: z
		.string()
		.regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Horário de abertura inválido (formato HH:MM)")
		.optional(),
	horario_fechamento: z
		.string()
		.regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Horário de fechamento inválido (formato HH:MM)")
		.optional(),
	pausa_inicio: z
		.string()
		.regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Horário de pausa inválido (formato HH:MM)")
		.optional(),
	pausa_fim: z
		.string()
		.regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Horário de pausa inválido (formato HH:MM)")
		.optional(),
});

/**
 * Schema para horários de funcionamento
 */
export const onboardingHorariosSchema = z.object({
	horarios: z
		.array(horarioFuncionamentoSchema)
		.min(1, "Deve ter pelo menos 1 dia configurado")
		.refine(
			(horarios) => {
				// Validar que dias abertos têm horários definidos
				return horarios.every((h) => {
					if (h.aberto) {
						// Verificar se tem períodos configurados OU horários legados
						const temPeriodos = h.periodos && h.periodos.length > 0;
						const temHorariosLegados = h.horario_abertura && h.horario_fechamento;
						return temPeriodos || temHorariosLegados;
					}
					return true;
				});
			},
			{
				message: "Dias abertos devem ter horários de funcionamento configurados",
			},
		)
		.refine(
			(horarios) => {
				// Validar períodos individuais
				return horarios.every((h) => {
					if (!h.aberto || !h.periodos) return true;

					return h.periodos.every((periodo) => {
						if (!periodo.horario_abertura || !periodo.horario_fechamento) {
							return false;
						}

						// Validar que abertura é antes do fechamento (considerando horário noturno)
						const [aberturaH, aberturaM] = periodo.horario_abertura.split(":").map(Number);
						const [fechamentoH, fechamentoM] = periodo.horario_fechamento.split(":").map(Number);

						if (
							aberturaH === undefined ||
							aberturaM === undefined ||
							fechamentoH === undefined ||
							fechamentoM === undefined
						) {
							return false;
						}

						const aberturaMinutos = aberturaH * 60 + aberturaM;
						const fechamentoMinutos = fechamentoH * 60 + fechamentoM;

						// Permitir funcionamento noturno (ex: 22:00 - 02:00)
						// Se fechamento é menor que abertura e fechamento é antes das 06:00, assumir dia seguinte
						if (fechamentoMinutos < aberturaMinutos && fechamentoH < 6) {
							return true; // Horário noturno válido
						}

						return fechamentoMinutos > aberturaMinutos;
					});
				});
			},
			{
				message: "Horários de abertura devem ser anteriores aos de fechamento",
			},
		),
});

// ========================================
// ONBOARDING - ETAPA 5: PAGAMENTOS
// ========================================

/**
 * Schema para configuração de pagamentos
 */
export const onboardingPagamentosSchema = z
	.object({
		aceita_dinheiro: z.boolean(),
		aceita_pix: z.boolean(),
		aceita_cartao_credito: z.boolean(),
		aceita_cartao_debito: z.boolean(),
		chave_pix: z
			.string()
			.max(200, "Chave PIX deve ter no máximo 200 caracteres")
			.optional()
			.or(z.literal("")),
		taxa_cartao: z
			.number()
			.nonnegative("Taxa do cartão deve ser não negativa")
			.max(100, "Taxa do cartão deve ser no máximo 100%")
			.optional(),
	})
	.refine(
		(data) => {
			// Pelo menos um método de pagamento deve estar ativo
			return (
				data.aceita_dinheiro ||
				data.aceita_pix ||
				data.aceita_cartao_credito ||
				data.aceita_cartao_debito
			);
		},
		{
			message: "Pelo menos um método de pagamento deve estar ativo",
		},
	);

// ========================================
// SCHEMAS DE CONFIGURAÇÕES GERAIS
// ========================================

/**
 * Schema para configurações gerais do estabelecimento
 */
export const configGeralSchema = z.object({
	taxa_entrega: z.number().nonnegative("Taxa de entrega deve ser não negativa"),
	tempo_preparo_min: z
		.number()
		.int("Tempo mínimo deve ser inteiro")
		.positive("Tempo mínimo deve ser positivo"),
	tempo_preparo_max: z
		.number()
		.int("Tempo máximo deve ser inteiro")
		.positive("Tempo máximo deve ser positivo"),
	valor_minimo_pedido: z.number().nonnegative("Valor mínimo deve ser não negativo"),
});

// ========================================
// TIPOS INFERIDOS DOS SCHEMAS
// ========================================

export type PeriodoFuncionamentoFormData = z.infer<typeof periodoFuncionamentoSchema>;
export type HorarioFuncionamentoFormData = z.infer<typeof horarioFuncionamentoSchema>;
export type OnboardingInfoBasicaFormData = z.infer<typeof onboardingInfoBasicaSchema>;
export type OnboardingEnderecoFormData = z.infer<typeof onboardingEnderecoSchema>;
export type OnboardingContatoFormData = z.infer<typeof onboardingContatoSchema>;
export type OnboardingHorariosFormData = z.infer<typeof onboardingHorariosSchema>;
export type OnboardingPagamentosFormData = z.infer<typeof onboardingPagamentosSchema>;
export type ConfigGeralFormData = z.infer<typeof configGeralSchema>;
export type SlugFormData = z.infer<typeof slugSchema>;
