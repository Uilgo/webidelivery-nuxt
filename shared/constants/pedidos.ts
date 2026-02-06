/**
 * 📌 Constantes de Pedidos
 *
 * Constantes relacionadas a pedidos, status, formas de pagamento, etc.
 */

// ========================================
// STATUS DO PEDIDO
// ========================================

export const STATUS_PEDIDO = {
	PENDENTE: "pendente",
	ACEITO: "aceito",
	PREPARO: "preparo",
	PRONTO: "pronto",
	ENTREGA: "entrega",
	CONCLUIDO: "concluido",
	CANCELADO: "cancelado",
} as const;

export const STATUS_PEDIDO_LABELS: Record<string, string> = {
	pendente: "Pendente",
	aceito: "Aceito",
	preparo: "Em Preparo",
	pronto: "Pronto",
	entrega: "Em Entrega",
	concluido: "Concluído",
	cancelado: "Cancelado",
};

export const STATUS_PEDIDO_CORES: Record<string, string> = {
	pendente: "yellow",
	aceito: "blue",
	preparo: "orange",
	pronto: "purple",
	entrega: "cyan",
	concluido: "green",
	cancelado: "red",
};

export const STATUS_PEDIDO_ICONES: Record<string, string> = {
	pendente: "lucide:clock",
	aceito: "lucide:check-circle",
	preparo: "lucide:chef-hat",
	pronto: "lucide:package-check",
	entrega: "lucide:truck",
	concluido: "lucide:circle-check",
	cancelado: "lucide:x-circle",
};

// ========================================
// TIPOS DE ENTREGA
// ========================================

export const TIPO_ENTREGA = {
	DELIVERY: "delivery",
	RETIRADA: "retirada",
} as const;

export const TIPO_ENTREGA_LABELS: Record<string, string> = {
	delivery: "Delivery",
	retirada: "Retirada",
};

export const TIPO_ENTREGA_ICONES: Record<string, string> = {
	delivery: "lucide:bike",
	retirada: "lucide:store",
};

// ========================================
// FORMAS DE PAGAMENTO
// ========================================

export const FORMA_PAGAMENTO = {
	DINHEIRO: "dinheiro",
	PIX: "pix",
	CREDITO: "credito",
	DEBITO: "debito",
} as const;

export const FORMA_PAGAMENTO_LABELS: Record<string, string> = {
	dinheiro: "Dinheiro",
	pix: "PIX",
	credito: "Cartão de Crédito",
	debito: "Cartão de Débito",
};

export const FORMA_PAGAMENTO_ICONES: Record<string, string> = {
	dinheiro: "lucide:banknote",
	pix: "lucide:qr-code",
	credito: "lucide:credit-card",
	debito: "lucide:credit-card",
};

// ========================================
// MOTIVOS DE CANCELAMENTO
// ========================================

export const MOTIVO_CANCELAMENTO_CLIENTE = {
	MUDEI_IDEIA: "mudei_ideia",
	PEDIDO_ERRADO: "pedido_errado",
	DEMORA: "demora",
	PRECO: "preco",
	OUTRO: "outro",
} as const;

export const MOTIVO_CANCELAMENTO_LABELS: Record<string, string> = {
	mudei_ideia: "Mudei de ideia",
	pedido_errado: "Fiz o pedido errado",
	demora: "Está demorando muito",
	preco: "Preço muito alto",
	outro: "Outro motivo",
};

// ========================================
// FLUXO DE STATUS
// ========================================

/**
 * Define quais status podem ser alterados para quais
 */
export const TRANSICOES_STATUS: Record<string, string[]> = {
	pendente: ["aceito", "cancelado"],
	aceito: ["preparo", "cancelado"],
	preparo: ["pronto", "cancelado"],
	pronto: ["entrega", "concluido", "cancelado"],
	entrega: ["concluido", "cancelado"],
	concluido: [],
	cancelado: [],
};

/**
 * Status que permitem cancelamento
 */
export const STATUS_CANCELAVEIS = ["pendente", "aceito", "preparo"] as const;

/**
 * Status que indicam pedido em andamento
 */
export const STATUS_EM_ANDAMENTO = ["aceito", "preparo", "pronto", "entrega"] as const;

/**
 * Status finais (não podem ser alterados)
 */
export const STATUS_FINAIS = ["concluido", "cancelado"] as const;

// ========================================
// LIMITES E CONFIGURAÇÕES
// ========================================

/**
 * Tempo máximo para cancelamento pelo cliente (em minutos)
 */
export const TEMPO_MAXIMO_CANCELAMENTO_CLIENTE = 5;

/**
 * Tempo de expiração de pedido pendente (em minutos)
 */
export const TEMPO_EXPIRACAO_PEDIDO_PENDENTE = 30;

/**
 * Valor mínimo de pedido padrão
 */
export const VALOR_MINIMO_PEDIDO_PADRAO = 0;

/**
 * Taxa de entrega padrão
 */
export const TAXA_ENTREGA_PADRAO = 0;

/**
 * Quantidade máxima de itens por pedido
 */
export const MAX_ITENS_POR_PEDIDO = 50;

/**
 * Quantidade máxima de adicionais por item
 */
export const MAX_ADICIONAIS_POR_ITEM = 20;
