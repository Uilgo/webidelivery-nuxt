/**
 * 📌 Constantes de Relatórios
 *
 * Constantes globais utilizadas no sistema de relatórios,
 * incluindo períodos, cores, formatos e configurações.
 */

// ========================================
// PERÍODOS PRESET
// ========================================

export const PERIODOS_PRESET = {
	hoje: { label: "Hoje", dias: 0 },
	ontem: { label: "Ontem", dias: 1 },
	ultimos_7_dias: { label: "Últimos 7 dias", dias: 7 },
	ultimos_30_dias: { label: "Últimos 30 dias", dias: 30 },
	este_mes: { label: "Este mês", tipo: "mes_atual" as const },
	mes_passado: { label: "Mês passado", tipo: "mes_anterior" as const },
	este_ano: { label: "Este ano", tipo: "ano_atual" as const },
	ano_passado: { label: "Ano passado", tipo: "ano_anterior" as const },
	personalizado: { label: "Personalizado", tipo: "custom" as const },
} as const;

export type PeriodoPresetKey = keyof typeof PERIODOS_PRESET;

// ========================================
// CORES DOS GRÁFICOS
// ========================================

export const CORES_GRAFICOS = {
	primaria: "#3b82f6", // blue-500
	secundaria: "#10b981", // green-500
	terciaria: "#f59e0b", // amber-500
	quaternaria: "#ef4444", // red-500
	quinaria: "#8b5cf6", // violet-500
	senaria: "#ec4899", // pink-500
	setenaria: "#06b6d4", // cyan-500
	octonaria: "#f97316", // orange-500
} as const;

export const CORES_STATUS = {
	pendente: "#f59e0b", // amber-500
	aceito: "#3b82f6", // blue-500
	preparo: "#8b5cf6", // violet-500
	pronto: "#10b981", // green-500
	entrega: "#06b6d4", // cyan-500
	concluido: "#22c55e", // green-600
	cancelado: "#ef4444", // red-500
} as const;

// ========================================
// FORMATOS DE EXPORTAÇÃO
// ========================================

export const FORMATOS_EXPORTACAO = ["pdf", "excel", "csv"] as const;

export type FormatoExportacao = (typeof FORMATOS_EXPORTACAO)[number];

// ========================================
// CONFIGURAÇÕES DE PAGINAÇÃO
// ========================================

export const OPCOES_PAGINACAO = [10, 25, 50, 100] as const;

export const PAGINACAO_PADRAO = 25;

// ========================================
// CONFIGURAÇÕES DE CACHE
// ========================================

export const CACHE_TTL_SEGUNDOS = 300; // 5 minutos

// ========================================
// LABELS E TEXTOS
// ========================================

export const LABELS_ABAS = {
	pedidos: "Pedidos",
	vendas: "Vendas",
	produtos: "Produtos",
	marketing: "Marketing",
	financeiro: "Financeiro",
} as const;

export const LABELS_STATUS_PEDIDO = {
	pendente: "Pendente",
	aceito: "Aceito",
	preparo: "Em Preparo",
	pronto: "Pronto",
	entrega: "Em Entrega",
	concluido: "Concluído",
	cancelado: "Cancelado",
} as const;

export const LABELS_TIPO_ENTREGA = {
	delivery: "Delivery",
	retirada: "Retirada",
} as const;

export const LABELS_FORMA_PAGAMENTO = {
	dinheiro: "Dinheiro",
	pix: "PIX",
	credito: "Cartão de Crédito",
	debito: "Cartão de Débito",
} as const;

// ========================================
// ÍCONES
// ========================================

export const ICONES_ABAS = {
	pedidos: "lucide:shopping-bag",
	vendas: "lucide:trending-up",
	produtos: "lucide:package",
	marketing: "lucide:megaphone",
	financeiro: "lucide:dollar-sign",
} as const;

export const ICONES_KPIS = {
	total: "lucide:hash",
	receita: "lucide:dollar-sign",
	crescimento: "lucide:trending-up",
	reducao: "lucide:trending-down",
	tempo: "lucide:clock",
	percentual: "lucide:percent",
	usuarios: "lucide:users",
	pedidos: "lucide:shopping-bag",
	produtos: "lucide:package",
	cupons: "lucide:ticket",
	banners: "lucide:image",
} as const;

// ========================================
// VALIDAÇÕES
// ========================================

export const MAX_DIAS_PERIODO = 365; // 1 ano

export const MIN_DATA_RELATORIO = "2024-01-01"; // Data mínima para relatórios
