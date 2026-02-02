/**
 * 📌 Constantes de Estabelecimento
 *
 * Constantes relacionadas a estabelecimentos, status, configurações, etc.
 */

import type { EstabelecimentoStatus } from "../types/database";

// ========================================
// STATUS DO ESTABELECIMENTO
// ========================================

export const STATUS_ESTABELECIMENTO = {
	RASCUNHO: "rascunho",
	ATIVO: "ativo",
	INATIVO: "inativo",
	SUSPENSO: "suspenso",
} as const;

export const STATUS_ESTABELECIMENTO_LABELS: Record<EstabelecimentoStatus, string> = {
	rascunho: "Rascunho",
	ativo: "Ativo",
	inativo: "Inativo",
	suspenso: "Suspenso",
};

export const STATUS_ESTABELECIMENTO_CORES: Record<EstabelecimentoStatus, string> = {
	rascunho: "gray",
	ativo: "green",
	inativo: "yellow",
	suspenso: "red",
};

export const STATUS_ESTABELECIMENTO_DESCRICOES: Record<EstabelecimentoStatus, string> = {
	rascunho: "Estabelecimento em processo de cadastro",
	ativo: "Estabelecimento ativo e operacional",
	inativo: "Estabelecimento temporariamente inativo",
	suspenso: "Estabelecimento suspenso pela plataforma",
};

// ========================================
// DIAS DA SEMANA
// ========================================

export const DIAS_SEMANA = {
	DOMINGO: "domingo",
	SEGUNDA: "segunda",
	TERCA: "terca",
	QUARTA: "quarta",
	QUINTA: "quinta",
	SEXTA: "sexta",
	SABADO: "sabado",
} as const;

export const DIAS_SEMANA_LABELS: Record<string, string> = {
	domingo: "Domingo",
	segunda: "Segunda-feira",
	terca: "Terça-feira",
	quarta: "Quarta-feira",
	quinta: "Quinta-feira",
	sexta: "Sexta-feira",
	sabado: "Sábado",
};

export const DIAS_SEMANA_ABREVIADOS: Record<string, string> = {
	domingo: "Dom",
	segunda: "Seg",
	terca: "Ter",
	quarta: "Qua",
	quinta: "Qui",
	sexta: "Sex",
	sabado: "Sáb",
};

export const DIAS_SEMANA_ORDEM = [
	"domingo",
	"segunda",
	"terca",
	"quarta",
	"quinta",
	"sexta",
	"sabado",
] as const;

// ========================================
// ESTADOS BRASILEIROS
// ========================================

export const ESTADOS_BRASIL = [
	"AC",
	"AL",
	"AP",
	"AM",
	"BA",
	"CE",
	"DF",
	"ES",
	"GO",
	"MA",
	"MT",
	"MS",
	"MG",
	"PA",
	"PB",
	"PR",
	"PE",
	"PI",
	"RJ",
	"RN",
	"RS",
	"RO",
	"RR",
	"SC",
	"SP",
	"SE",
	"TO",
] as const;

export const ESTADOS_LABELS: Record<string, string> = {
	AC: "Acre",
	AL: "Alagoas",
	AP: "Amapá",
	AM: "Amazonas",
	BA: "Bahia",
	CE: "Ceará",
	DF: "Distrito Federal",
	ES: "Espírito Santo",
	GO: "Goiás",
	MA: "Maranhão",
	MT: "Mato Grosso",
	MS: "Mato Grosso do Sul",
	MG: "Minas Gerais",
	PA: "Pará",
	PB: "Paraíba",
	PR: "Paraná",
	PE: "Pernambuco",
	PI: "Piauí",
	RJ: "Rio de Janeiro",
	RN: "Rio Grande do Norte",
	RS: "Rio Grande do Sul",
	RO: "Rondônia",
	RR: "Roraima",
	SC: "Santa Catarina",
	SP: "São Paulo",
	SE: "Sergipe",
	TO: "Tocantins",
};

// ========================================
// ETAPAS DO ONBOARDING
// ========================================

export const ETAPAS_ONBOARDING = {
	INFO_BASICA: 1,
	ENDERECO: 2,
	CONTATO: 3,
	HORARIOS: 4,
	PAGAMENTOS: 5,
} as const;

export const ETAPAS_ONBOARDING_LABELS: Record<number, string> = {
	1: "Informações Básicas",
	2: "Endereço",
	3: "Contato",
	4: "Horários",
	5: "Pagamentos",
};

export const ETAPAS_ONBOARDING_DESCRICOES: Record<number, string> = {
	1: "Nome e identificação do estabelecimento",
	2: "Localização para entregas",
	3: "WhatsApp para comunicação",
	4: "Funcionamento do estabelecimento",
	5: "Métodos aceitos",
};

export const TOTAL_ETAPAS_ONBOARDING = 5;

// ========================================
// CONFIGURAÇÕES PADRÃO
// ========================================

/**
 * Taxa de entrega padrão
 */
export const TAXA_ENTREGA_PADRAO = 0;

/**
 * Tempo de entrega mínimo padrão (em minutos)
 */
export const TEMPO_ENTREGA_MIN_PADRAO = 30;

/**
 * Tempo de entrega máximo padrão (em minutos)
 */
export const TEMPO_ENTREGA_MAX_PADRAO = 60;

/**
 * Valor mínimo de pedido padrão
 */
export const VALOR_MINIMO_PEDIDO_PADRAO = 0;

// ========================================
// LIMITES E VALIDAÇÕES
// ========================================

/**
 * Tamanho mínimo do slug
 */
export const SLUG_MIN_LENGTH = 3;

/**
 * Tamanho máximo do slug
 */
export const SLUG_MAX_LENGTH = 50;

/**
 * Tamanho máximo do nome
 */
export const NOME_MAX_LENGTH = 100;

/**
 * Tamanho máximo da descrição
 */
export const DESCRICAO_MAX_LENGTH = 500;

/**
 * Tamanho máximo do WhatsApp (com DDI)
 */
export const WHATSAPP_LENGTH = 13;

/**
 * Tempo máximo de entrega (em minutos)
 */
export const TEMPO_ENTREGA_MAX = 240;

/**
 * Máximo de períodos de funcionamento por dia
 */
export const MAX_PERIODOS_POR_DIA = 5;

// ========================================
// TEMAS E ESTILOS
// ========================================

export const ESTILOS_BOTOES = ["rounded", "square"] as const;

export const LAYOUTS_CARDAPIO = ["grid", "list"] as const;

export const CORES_PRIMARIAS_PADRAO = [
	"#EF4444", // red
	"#F59E0B", // amber
	"#10B981", // emerald
	"#3B82F6", // blue
	"#8B5CF6", // violet
	"#EC4899", // pink
] as const;
