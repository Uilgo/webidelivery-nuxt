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

export interface ConfigGeral {
	readonly taxa_entrega: number;
	readonly tempo_preparo_min: number;
	readonly tempo_preparo_max: number;
	readonly valor_minimo_pedido: number;
	readonly raio_entrega_km: number;
	readonly aceita_agendamento: boolean;
	readonly horario_funcionamento: HorarioFuncionamento[];
}

export interface ConfigPagamento {
	readonly aceita_dinheiro: boolean;
	readonly aceita_pix: boolean;
	readonly aceita_cartao_credito: boolean;
	readonly aceita_cartao_debito: boolean;
	readonly chave_pix?: string;
	readonly taxa_cartao?: number;
}

export interface ConfigTema {
	readonly cor_primaria: string;
	readonly cor_secundaria: string;
	readonly cor_fundo: string;
	readonly cor_texto: string;
	readonly fonte_principal: string;
	readonly estilo_botoes: "rounded" | "square";
	readonly layout_cardapio: "grid" | "list";
}

export interface HorarioFuncionamento {
	readonly dia_semana: DiaSemana;
	readonly aberto: boolean;
	readonly horario_abertura?: string;
	readonly horario_fechamento?: string;
	readonly pausa_inicio?: string;
	readonly pausa_fim?: string;
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
// ENUMS E CONSTANTES
// ========================================

export type DiaSemana = "domingo" | "segunda" | "terca" | "quarta" | "quinta" | "sexta" | "sabado";

export const DIAS_SEMANA: readonly DiaSemana[] = [
	"domingo",
	"segunda",
	"terca",
	"quarta",
	"quinta",
	"sexta",
	"sabado",
] as const;

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

export const ETAPAS_ONBOARDING: readonly OnboardingEtapa[] = [
	{
		etapa: 1,
		titulo: "Informações Básicas",
		descricao: "Nome e identificação do estabelecimento",
		concluida: false,
		obrigatoria: true,
	},
	{
		etapa: 2,
		titulo: "Endereço",
		descricao: "Localização para entregas",
		concluida: false,
		obrigatoria: true,
	},
	{
		etapa: 3,
		titulo: "Contato",
		descricao: "WhatsApp para comunicação",
		concluida: false,
		obrigatoria: true,
	},
	{
		etapa: 4,
		titulo: "Horários",
		descricao: "Funcionamento do estabelecimento",
		concluida: false,
		obrigatoria: true,
	},
	{
		etapa: 5,
		titulo: "Pagamentos",
		descricao: "Métodos aceitos",
		concluida: false,
		obrigatoria: true,
	},
] as const;
