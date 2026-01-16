/**
 * 📌 Tipos do Cardápio Público
 *
 * Tipos específicos para a página pública do cardápio.
 */

// Estabelecimento público (dados visíveis para clientes)
export interface EstabelecimentoPublico {
	id: string;
	nome: string;
	slug: string;
	logo_url: string | null;
	descricao: string | null;
	whatsapp: string | null;
	endereco_rua: string | null;
	endereco_numero: string | null;
	endereco_bairro: string | null;
	endereco_cidade: string | null;
	endereco_estado: string | null;
	status: "ativo" | "inativo" | "rascunho";
	aberto: boolean;
	config_geral: ConfiguracoesEstabelecimento | null;
}

// Horário de funcionamento
export interface HorarioFuncionamento {
	segunda?: HorarioDia;
	terca?: HorarioDia;
	quarta?: HorarioDia;
	quinta?: HorarioDia;
	sexta?: HorarioDia;
	sabado?: HorarioDia;
	domingo?: HorarioDia;
}

export interface HorarioDia {
	aberto: boolean;
	abertura?: string; // "08:00"
	fechamento?: string; // "22:00"
	intervalo?: {
		inicio: string;
		fim: string;
	};
}

// Configurações do estabelecimento
export interface ConfiguracoesEstabelecimento {
	cor_primaria?: string;
	cor_secundaria?: string;
	tempo_entrega_min?: number;
	tempo_entrega_max?: number;
	valor_minimo_pedido?: number;
	taxa_entrega?: number;
	raio_entrega_km?: number;
	aceita_retirada?: boolean;
	aceita_delivery?: boolean;
}

// Categoria pública
export interface CategoriaPublica {
	id: string;
	nome: string;
	descricao: string | null;
	imagem_url: string | null;
	ordem: number;
	produtos: ProdutoPublico[];
}

// Produto público
export interface ProdutoPublico {
	id: string;
	nome: string;
	descricao: string | null;
	imagem_url: string | null;
	destaque: boolean;
	em_promocao: boolean;
	categoria_id: string;
	variacoes: VariacaoPublica[];
	grupos_adicionais: GrupoAdicionalPublico[];
}

// Variação pública
export interface VariacaoPublica {
	id: string;
	nome: string;
	preco: number;
	preco_promocional: number | null;
}

// Grupo de adicionais público
export interface GrupoAdicionalPublico {
	id: string;
	nome: string;
	descricao: string | null;
	min_selecao: number;
	max_selecao: number;
	obrigatorio: boolean;
	adicionais: AdicionalPublico[];
}

// Adicional público
export interface AdicionalPublico {
	id: string;
	nome: string;
	preco: number;
}

// Combo público
export interface ComboPublico {
	id: string;
	nome: string;
	descricao: string | null;
	imagem_url: string | null;
	preco_combo: number;
	preco_original: number;
	destaque: boolean;
	produtos: ComboProdutoPublico[];
}

export interface ComboProdutoPublico {
	produto_id: string;
	produto_nome: string;
	quantidade: number;
}

// Item do carrinho
export interface ItemCarrinho {
	id: string; // ID único do item no carrinho
	tipo: "produto" | "combo";
	produto_id?: string;
	combo_id?: string;
	nome: string;
	imagem_url: string | null;
	variacao?: {
		id: string;
		nome: string;
		preco: number;
	};
	adicionais: {
		id: string;
		nome: string;
		preco: number;
		quantidade: number;
	}[];
	observacao: string;
	quantidade: number;
	preco_unitario: number;
	preco_total: number;
}

// Carrinho completo
export interface Carrinho {
	estabelecimento_id: string;
	estabelecimento_slug: string;
	itens: ItemCarrinho[];
	subtotal: number;
	taxa_entrega: number;
	desconto: number;
	total: number;
}

// Dados do checkout
export interface DadosCheckout {
	cliente: {
		nome: string;
		telefone: string;
		email?: string;
	};
	entrega: {
		tipo: "delivery" | "retirada";
		endereco?: {
			rua: string;
			numero: string;
			complemento?: string;
			bairro: string;
			cidade: string;
			cep: string;
		};
	};
	pagamento: {
		metodo: "dinheiro" | "pix" | "cartao_credito" | "cartao_debito";
		troco_para?: number; // Se pagamento em dinheiro
	};
	observacao?: string;
}
