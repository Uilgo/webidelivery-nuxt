/**
 * 📌 Tipos de Estabelecimentos
 *
 * Tipos relacionados aos estabelecimentos (restaurantes, lanchonetes, etc.),
 * incluindo configurações, endereços e dados operacionais.
 */

import type { UUID, TimestampTz, Json, EstabelecimentoStatus } from "./database";

// ========================================
// TABELA ESTABELECIMENTOS
// ========================================

export interface Estabelecimento {
	readonly id: UUID;
	readonly created_at: TimestampTz;
	readonly updated_at: TimestampTz;
	readonly nome: string | null;
	readonly slug: string | null;
	readonly descricao: string | null;
	readonly status: EstabelecimentoStatus;
	readonly aberto: boolean;
	readonly onboarding: boolean;
	readonly logo_url: string | null;
	readonly logo_url_dark: string | null;
	readonly capa_url: string | null;
	readonly foto_capa_url: string | null;
	readonly cor_fundo: string | null;
	readonly whatsapp: string | null;
	readonly endereco_rua: string | null;
	readonly endereco_numero: string | null;
	readonly endereco_complemento: string | null;
	readonly endereco_bairro: string | null;
	readonly endereco_cidade: string | null;
	readonly endereco_estado: string | null;
	readonly endereco_cep: string | null;
	readonly endereco_referencia: string | null;
	readonly config_geral: Json;
	readonly config_pagamento: Json;
	readonly config_tema: Json;
	readonly setup_status: Json;
}

// ========================================
// TIPOS ESTRUTURADOS PARA CONFIGURAÇÕES
// ========================================

export type TipoTaxaEntrega = "sem_taxa" | "taxa_unica" | "taxa_distancia" | "taxa_localizacao";

export interface TaxaDistancia {
	readonly id: string;
	readonly distancia_km: number;
	readonly taxa_valor: number;
	readonly tempo_min: number;
	readonly tempo_max: number;
	readonly status: "ativado" | "desativado";
}

export interface TaxaLocalizacao {
	readonly id: string;
	readonly nome: string;
	readonly taxa_valor: number;
	readonly tempo_min: number;
	readonly tempo_max: number;
	readonly status: "ativado" | "desativado";
}

export interface ConfigGeral {
	readonly taxa_entrega: number;
	readonly tipo_taxa_entrega?: TipoTaxaEntrega;
	readonly taxas_por_distancia?: TaxaDistancia[];
	readonly taxas_por_localizacao?: TaxaLocalizacao[];
	readonly tempo_preparo_min: number;
	readonly tempo_preparo_max: number;
	readonly valor_minimo_pedido: number;
	readonly raio_entrega_km: number;
	readonly horario_funcionamento: HorarioFuncionamento[];
	readonly excecoes_horario?: HorarioExcecao[];
}

export interface ConfigPagamento {
	readonly aceita_dinheiro: boolean;
	readonly aceita_pix: boolean;
	readonly aceita_cartao_credito: boolean;
	readonly aceita_cartao_debito: boolean;
	readonly tipo_chave_pix?: "cpf" | "cnpj" | "email" | "telefone" | "aleatoria";
	readonly chave_pix?: string;
	readonly taxa_cartao?: number;
}

export interface ConfigTema {
	readonly cor_primaria?: string;
	readonly cor_secundaria?: string;
	readonly cor_fundo?: string;
	readonly cor_texto?: string;
	readonly estilo_botoes?: "rounded" | "square";
	readonly layout_cardapio?: "grid" | "list";

	// Cores Semânticas (Opcionais - Default no Frontend)
	readonly cor_sucesso?: string; // Status Aberto, Preços
	readonly cor_erro?: string; // Status Fechado
	readonly cor_aviso?: string; // Alertas, Frete Grátis
	readonly cor_info?: string; // Informações

	// Gradientes e Identidade (Opcionais)
	readonly gradiente_promo_inicio?: string;
	readonly gradiente_promo_fim?: string;
	readonly gradiente_destaque_inicio?: string;
	readonly gradiente_destaque_fim?: string;
}

export interface HorarioFuncionamento {
	readonly dia_semana: DiaSemana;
	readonly aberto: boolean;
	readonly periodos?: PeriodoFuncionamento[];
	// Campos de compatibilidade (deprecated)
	readonly horario_abertura?: string;
	readonly horario_fechamento?: string;
	readonly pausa_inicio?: string;
	readonly pausa_fim?: string;
}

export interface PeriodoFuncionamento {
	readonly id?: string; // Para identificar períodos únicos
	readonly horario_abertura?: string;
	readonly horario_fechamento?: string;
	readonly nome?: string; // Ex: "Almoço", "Jantar", "Happy Hour" (opcional - não usado na interface simplificada)
}

export interface HorarioExcecao {
	readonly id: string;
	readonly data: string; // Formato ISO YYYY-MM-DD
	readonly nome: string; // Ex: "Feriado Municipal", "Terça-feira de Carnaval"
	readonly aberto: boolean;
	readonly periodos: PeriodoFuncionamento[];
}

export interface SetupStatus {
	readonly info_basica: boolean;
	readonly endereco: boolean;
	readonly contato: boolean;
	readonly horarios: boolean;
	readonly pagamentos: boolean;
	readonly concluido: boolean;
}

// ========================================
// TIPOS PARA ENDEREÇO
// ========================================

export interface Endereco {
	readonly rua: string;
	readonly numero: string;
	readonly complemento?: string;
	readonly bairro: string;
	readonly cidade: string;
	readonly estado: string;
	readonly cep?: string;
	readonly referencia?: string;
}

export interface EnderecoCompleto extends Endereco {
	readonly endereco_formatado: string;
	readonly coordenadas?: {
		readonly latitude: number;
		readonly longitude: number;
	};
}

// ========================================
// TIPOS PARA ONBOARDING
// ========================================

export interface OnboardingEtapa {
	readonly etapa: number;
	readonly titulo: string;
	readonly descricao: string;
	readonly concluida: boolean;
	readonly obrigatoria: boolean;
}

export interface OnboardingDados {
	readonly info_basica: {
		readonly nome: string;
		readonly slug: string;
		readonly descricao?: string;
	};
	readonly endereco: Endereco;
	readonly contato: {
		readonly whatsapp: string;
	};
	readonly horarios: HorarioFuncionamento[];
	readonly pagamentos: ConfigPagamento;
}

// ========================================
// TIPOS PARA VALIDAÇÃO
// ========================================

export interface SlugValidacao {
	readonly slug: string;
	readonly disponivel: boolean;
	readonly sugestoes?: string[];
}

// ========================================
// TIPOS DERIVADOS PARA USO NA APLICAÇÃO
// ========================================

export interface EstabelecimentoResumo {
	readonly id: UUID;
	readonly nome: string;
	readonly slug: string;
	readonly status: EstabelecimentoStatus;
	readonly aberto: boolean;
	readonly logo_url: string | null;
	readonly total_produtos?: number;
	readonly total_pedidos?: number;
}

export interface EstabelecimentoPublico {
	readonly id: UUID;
	readonly nome: string;
	readonly slug: string;
	readonly descricao: string | null;
	readonly aberto: boolean;
	readonly logo_url: string | null;
	readonly capa_url: string | null;
	readonly cor_fundo: string | null;
	readonly whatsapp: string | null;
	readonly endereco_formatado: string;
	readonly config_tema: ConfigTema;
	readonly horario_funcionamento: HorarioFuncionamento[];
}

// ========================================
// TIPOS
// ========================================

export type DiaSemana = "domingo" | "segunda" | "terca" | "quarta" | "quinta" | "sexta" | "sabado";
