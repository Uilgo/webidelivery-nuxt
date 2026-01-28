/**
 * 📌 Store do Carrinho (Pinia + Cookie)
 *
 * Gerencia o estado do carrinho de compras do cliente.
 * Persiste em cookie para SSR compatível (sem flash de hidratação).
 *
 * @description
 * O carrinho é salvo em cookie para que o servidor possa ler os dados
 * e renderizar o HTML já com os itens do carrinho preenchidos.
 */

import { defineStore } from "pinia";
import type { ItemCarrinho, Carrinho } from "~/features/public/cardapio/types/cardapio-publico";

// ========================================
// TIPOS DO STORE
// ========================================

/**
 * Dados persistidos no cookie (estrutura reduzida)
 */
interface CarrinhoCookieData {
	estabelecimento_id: string | null;
	estabelecimento_slug: string | null;
	itens: ItemCarrinho[];
	taxa_entrega: number;
	desconto: number;
}

// ========================================
// COMPOSABLE DO COOKIE
// ========================================

/**
 * Composable para acessar o cookie do carrinho.
 * Pode ser usado no servidor e no cliente.
 */
export function useCarrinhoCookie() {
	return useCookie<CarrinhoCookieData | null>("webidelivery_carrinho", {
		// Cookie dura 7 dias
		maxAge: 60 * 60 * 24 * 7,
		// Protege contra CSRF em navegação cross-site
		sameSite: "lax",
		// Cookie acessível em todo o site
		path: "/",
		// Valor padrão quando não existe
		default: () => null,
		// Permite serialização de objetos complexos
		watch: true,
	});
}

// ========================================
// STORE PRINCIPAL
// ========================================

export const useCarrinhoStore = defineStore("carrinho", {
	// ========================================
	// ESTADO
	// ========================================
	state: (): CarrinhoCookieData => {
		// Tenta ler do cookie no momento da criação do estado
		const cookie = useCarrinhoCookie();
		const dadosCookie = cookie.value;

		if (dadosCookie) {
			return {
				estabelecimento_id: dadosCookie.estabelecimento_id,
				estabelecimento_slug: dadosCookie.estabelecimento_slug,
				itens: dadosCookie.itens || [],
				taxa_entrega: dadosCookie.taxa_entrega || 0,
				desconto: dadosCookie.desconto || 0,
			};
		}

		// Estado inicial vazio
		return {
			estabelecimento_id: null,
			estabelecimento_slug: null,
			itens: [],
			taxa_entrega: 0,
			desconto: 0,
		};
	},

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
		 * Sincroniza o estado do store com o cookie.
		 * Deve ser chamado após qualquer alteração no estado.
		 */
		_sincronizarCookie(): void {
			const cookie = useCarrinhoCookie();
			cookie.value = {
				estabelecimento_id: this.estabelecimento_id,
				estabelecimento_slug: this.estabelecimento_slug,
				itens: this.itens,
				taxa_entrega: this.taxa_entrega,
				desconto: this.desconto,
			};
		},

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
			this._sincronizarCookie();
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
			this._sincronizarCookie();
		},

		/**
		 * Remove um item do carrinho pelo ID
		 */
		removerItem(itemId: string): void {
			const index = this.itens.findIndex((item) => item.id === itemId);
			if (index !== -1) {
				this.itens.splice(index, 1);
				this._sincronizarCookie();
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
					this._sincronizarCookie();
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
			this._sincronizarCookie();
		},

		/**
		 * Aplica um desconto
		 */
		aplicarDesconto(valor: number): void {
			this.desconto = valor;
			this._sincronizarCookie();
		},

		/**
		 * Limpa o carrinho completamente
		 */
		limpar(): void {
			this.itens = [];
			this.taxa_entrega = 0;
			this.desconto = 0;
			this._sincronizarCookie();
		},
	},
});
