/**
 * 📌 Store do Carrinho (Pinia)
 *
 * Gerencia o estado do carrinho de compras do cliente.
 * Persiste no localStorage para manter entre sessões.
 */

import { defineStore } from "pinia";
import type { ItemCarrinho, Carrinho } from "~/features/public/cardapio/types/cardapio-publico";

// ========================================
// TIPOS DO STORE
// ========================================

interface CarrinhoState {
	estabelecimento_id: string | null;
	estabelecimento_slug: string | null;
	itens: ItemCarrinho[];
	taxa_entrega: number;
	desconto: number;
}

// ========================================
// STORE PRINCIPAL
// ========================================

export const useCarrinhoStore = defineStore("carrinho", {
	// ========================================
	// ESTADO
	// ========================================
	state: (): CarrinhoState => ({
		estabelecimento_id: null,
		estabelecimento_slug: null,
		itens: [],
		taxa_entrega: 0,
		desconto: 0,
	}),

	// ========================================
	// GETTERS
	// ========================================
	getters: {
		/**
		 * Quantidade total de itens no carrinho
		 */
		quantidadeTotal(): number {
			return this.itens.reduce((acc, item) => acc + item.quantidade, 0);
		},

		/**
		 * Subtotal (soma dos preços dos itens)
		 */
		subtotal(): number {
			return this.itens.reduce((acc, item) => acc + item.preco_total, 0);
		},

		/**
		 * Total final (subtotal + taxa - desconto)
		 */
		total(): number {
			return Math.max(0, this.subtotal + this.taxa_entrega - this.desconto);
		},

		/**
		 * Verifica se o carrinho está vazio
		 */
		estaVazio(): boolean {
			return this.itens.length === 0;
		},

		/**
		 * Retorna o carrinho completo formatado
		 */
		carrinhoCompleto(): Carrinho | null {
			if (!this.estabelecimento_id || !this.estabelecimento_slug) return null;

			return {
				estabelecimento_id: this.estabelecimento_id,
				estabelecimento_slug: this.estabelecimento_slug,
				itens: this.itens,
				subtotal: this.subtotal,
				taxa_entrega: this.taxa_entrega,
				desconto: this.desconto,
				total: this.total,
			};
		},
	},

	// ========================================
	// ACTIONS
	// ========================================
	actions: {
		/**
		 * Define o estabelecimento do carrinho
		 * Se mudar de estabelecimento, limpa o carrinho
		 */
		setEstabelecimento(id: string, slug: string): void {
			// Se mudou de estabelecimento, limpa o carrinho
			if (this.estabelecimento_id && this.estabelecimento_id !== id) {
				this.limpar();
			}

			this.estabelecimento_id = id;
			this.estabelecimento_slug = slug;
			this.salvarNoStorage();
		},

		/**
		 * Adiciona um item ao carrinho
		 */
		adicionarItem(item: Omit<ItemCarrinho, "id">): void {
			const novoItem: ItemCarrinho = {
				...item,
				id: crypto.randomUUID(),
			};

			this.itens.push(novoItem);
			this.salvarNoStorage();
		},

		/**
		 * Remove um item do carrinho pelo ID
		 */
		removerItem(itemId: string): void {
			const index = this.itens.findIndex((item) => item.id === itemId);
			if (index !== -1) {
				this.itens.splice(index, 1);
				this.salvarNoStorage();
			}
		},

		/**
		 * Atualiza a quantidade de um item
		 */
		atualizarQuantidade(itemId: string, quantidade: number): void {
			const item = this.itens.find((i) => i.id === itemId);
			if (item) {
				if (quantidade <= 0) {
					this.removerItem(itemId);
				} else {
					item.quantidade = quantidade;
					item.preco_total = item.preco_unitario * quantidade;
					this.salvarNoStorage();
				}
			}
		},

		/**
		 * Incrementa quantidade de um item
		 */
		incrementar(itemId: string): void {
			const item = this.itens.find((i) => i.id === itemId);
			if (item) {
				this.atualizarQuantidade(itemId, item.quantidade + 1);
			}
		},

		/**
		 * Decrementa quantidade de um item
		 */
		decrementar(itemId: string): void {
			const item = this.itens.find((i) => i.id === itemId);
			if (item) {
				this.atualizarQuantidade(itemId, item.quantidade - 1);
			}
		},

		/**
		 * Define a taxa de entrega
		 */
		setTaxaEntrega(taxa: number): void {
			this.taxa_entrega = taxa;
			this.salvarNoStorage();
		},

		/**
		 * Aplica um desconto
		 */
		aplicarDesconto(valor: number): void {
			this.desconto = valor;
			this.salvarNoStorage();
		},

		/**
		 * Limpa o carrinho completamente
		 */
		limpar(): void {
			this.itens = [];
			this.taxa_entrega = 0;
			this.desconto = 0;
			this.salvarNoStorage();
		},

		/**
		 * Salva o estado no localStorage
		 */
		salvarNoStorage(): void {
			if (import.meta.client) {
				const dados = {
					estabelecimento_id: this.estabelecimento_id,
					estabelecimento_slug: this.estabelecimento_slug,
					itens: this.itens,
					taxa_entrega: this.taxa_entrega,
					desconto: this.desconto,
				};
				localStorage.setItem("webidelivery_carrinho", JSON.stringify(dados));
			}
		},

		/**
		 * Carrega o estado do localStorage
		 */
		carregarDoStorage(): void {
			if (import.meta.client) {
				const dados = localStorage.getItem("webidelivery_carrinho");
				if (dados) {
					try {
						const parsed = JSON.parse(dados) as CarrinhoState;
						this.estabelecimento_id = parsed.estabelecimento_id;
						this.estabelecimento_slug = parsed.estabelecimento_slug;
						this.itens = parsed.itens || [];
						this.taxa_entrega = parsed.taxa_entrega || 0;
						this.desconto = parsed.desconto || 0;
					} catch {
						// Se der erro no parse, ignora
					}
				}
			}
		},
	},
});
